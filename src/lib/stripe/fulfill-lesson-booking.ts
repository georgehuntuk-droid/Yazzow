import "server-only";

import type Stripe from "stripe";

import { syncBookingToGoogleCalendar } from "@/lib/calendar/sync-booking";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const subscribeToAlerts = metadata.subscribe_to_alerts !== "false";

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

  const [{ data: slotRow }, { data: tutorRow }] = await Promise.all([
    admin
      .from("availability_slots")
      .select("starts_at, ends_at")
      .eq("id", slotId)
      .maybeSingle(),
    admin
      .from("tutor_profiles")
      .select("display_name, username, currency")
      .eq("id", tutorId)
      .maybeSingle(),
  ]);

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

  if (subscribeToAlerts) {
    await admin.from("slot_alert_subscribers").upsert(
      {
        tutor_id: tutorId,
        parent_email: parentEmail,
        student_name: studentName,
      },
      { onConflict: "tutor_id,parent_email" },
    );
  } else {
    await admin
      .from("slot_alert_subscribers")
      .delete()
      .eq("tutor_id", tutorId)
      .eq("parent_email", parentEmail);
  }

  if (slotRow && tutorRow) {
    const { sendBookingConfirmationEmail } = await import(
      "@/lib/notifications/booking-confirmation"
    );
    void sendBookingConfirmationEmail({
      bookingId: bookingRow.id,
      to: parentEmail,
      tutorName: tutorRow.display_name,
      tutorUsername: tutorRow.username,
      studentName,
      slotStartsAt: slotRow.starts_at,
      slotEndsAt: slotRow.ends_at,
      amountCents,
      currency: tutorRow.currency,
    }).catch((err) => {
      console.error("Booking confirmation email failed:", err);
    });
  }

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
