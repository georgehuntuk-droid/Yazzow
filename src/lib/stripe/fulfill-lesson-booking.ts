import "server-only";

import type Stripe from "stripe";

import { syncBookingToGoogleCalendar } from "@/lib/calendar/sync-booking";
import { formatMoney, formatSlotRange } from "@/lib/format";
import { sendSlackBookingNotification } from "@/lib/slack/webhook";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { getStripe } from "@/lib/stripe/server";

export type FulfillLessonResult = {
  ok: boolean;
  bookingId?: string;
  alreadyFulfilled?: boolean;
};

export async function fulfillLessonBookingFromSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillLessonResult> {
  const metadata = session.metadata ?? {};
  if (metadata.type !== "lesson") {
    return { ok: false };
  }

  if (session.payment_status !== "paid") {
    return { ok: false };
  }

  const slotId = metadata.slot_id;
  const tutorId = metadata.tutor_id;
  const parentEmail = metadata.parent_email;
  const studentName = metadata.student_name?.trim() || null;
  const platformFeeCents = Number(metadata.platform_fee_cents ?? 0);
  const amountCents = session.amount_total ?? 0;

  if (!slotId || !tutorId || !parentEmail) {
    return { ok: false };
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("bookings")
    .select("id")
    .eq("slot_id", slotId)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, bookingId: existing.id, alreadyFulfilled: true };
  }

  await admin
    .from("availability_slots")
    .update({ is_booked: true })
    .eq("id", slotId)
    .eq("is_booked", false);

  const { data: bookingRow, error: bookingError } = await admin
    .from("bookings")
    .insert({
      slot_id: slotId,
      tutor_id: tutorId,
      parent_email: parentEmail,
      student_name: studentName,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (bookingError || !bookingRow?.id) {
    return { ok: false };
  }

  try {
    await syncBookingToGoogleCalendar(bookingRow.id);
  } catch (err) {
    console.error("Google Calendar sync failed:", err);
  }

  if (studentName) {
    await admin.from("students").upsert(
      {
        tutor_id: tutorId,
        student_name: studentName,
        parent_email: parentEmail,
      },
      { onConflict: "tutor_id,parent_email,student_name" },
    );
  }

  await admin.from("slot_alert_subscribers").upsert(
    {
      tutor_id: tutorId,
      parent_email: parentEmail,
      student_name: studentName,
    },
    { onConflict: "tutor_id,parent_email" },
  );

  await notifyTutorOfBooking({
    tutorId,
    parentEmail,
    studentName,
    slotId,
    amountCents,
  });

  return { ok: true, bookingId: bookingRow.id };
}

export async function fulfillLessonBookingFromCheckoutSessionId(
  sessionId: string,
  stripeAccountId: string,
): Promise<FulfillLessonResult> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(
    sessionId,
    {},
    { stripeAccount: stripeAccountId },
  );
  return fulfillLessonBookingFromSession(session);
}

async function notifyTutorOfBooking(input: {
  tutorId: string;
  parentEmail: string;
  studentName: string | null;
  slotId: string;
  amountCents: number;
}) {
  const admin = createAdminClient();

  const [{ data: tutor }, { data: slot }] = await Promise.all([
    admin.from("tutor_profiles").select("*").eq("id", input.tutorId).maybeSingle(),
    admin
      .from("availability_slots")
      .select("starts_at, ends_at")
      .eq("id", input.slotId)
      .maybeSingle(),
  ]);

  const profile = tutor as TutorProfileRow | null;
  if (!profile || !slot) return;

  const slotRange = formatSlotRange(slot.starts_at, slot.ends_at);
  const amountLabel = formatMoney(input.amountCents, profile.currency);

  try {
    await sendSlackBookingNotification({
      tutorName: profile.display_name,
      parentEmail: input.parentEmail,
      studentName: input.studentName,
      slotRange,
      amountLabel,
    });
  } catch (err) {
    console.error("Slack booking notification failed:", err);
  }
}
