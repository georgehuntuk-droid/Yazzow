import "server-only";

import { revalidatePath } from "next/cache";

import { cancelLessonBooking } from "@/lib/bookings/cancel-booking";
import {
  createBookingManageToken,
  verifyBookingManageToken,
} from "@/lib/bookings/manage-token";
import { formatMoney, formatSlotRange } from "@/lib/format";
import { getTutorNotifyProfile } from "@/lib/notifications/slot-opened";
import { createAdminClient } from "@/lib/supabase/admin";

export type BookingManageView = {
  token: string;
  status: string;
  cancelledAt: string | null;
  cancelledBy: string | null;
  parentEmail: string;
  studentName: string | null;
  slotLabel: string;
  slotStartsAt: string;
  slotEndsAt: string;
  tutorDisplayName: string;
  tutorUsername: string;
  amountLabel: string;
  canCancel: boolean;
  tutorId: string;
  runningLateSentAt: string | null;
  runningLateNote: string | null;
  studentRunningLateSentAt: string | null;
  studentRunningLateNote: string | null;
  isPaid: boolean;
  stripePaymentIntentId: string | null;
  tutorPaymentInstructions: string | null;
};

type BookingManageRow = {
  id: string;
  status: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
  parent_email: string;
  student_name: string | null;
  amount_cents: number;
  stripe_payment_intent_id?: string | null;
  is_paid?: boolean;
  tutor_profiles:
    | { display_name: string; username: string; currency: string; payment_instructions: string | null }
    | { display_name: string; username: string; currency: string; payment_instructions: string | null }[]
    | null;
  availability_slots:
    | { starts_at: string; ends_at: string }
    | { starts_at: string; ends_at: string }[]
    | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getBookingForManage(
  token: string,
): Promise<BookingManageView | null> {
  const bookingId = verifyBookingManageToken(token);
  if (!bookingId) return null;

  const admin = createAdminClient();
  let res = await admin
    .from("bookings")
    .select(
      `
      id,
      tutor_id,
      status,
      cancelled_at,
      cancelled_by,
      parent_email,
      student_name,
      amount_cents,
      running_late_sent_at,
      running_late_note,
      student_running_late_sent_at,
      student_running_late_note,
      is_paid,
      stripe_payment_intent_id,
      tutor_profiles (display_name, username, currency, payment_instructions),
      availability_slots (starts_at, ends_at)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (res.error && (res.error.code === "42703" || res.error.message.includes("is_paid"))) {
    res = await admin
      .from("bookings")
      .select(
        `
        id,
        tutor_id,
        status,
        cancelled_at,
        cancelled_by,
        parent_email,
        student_name,
        amount_cents,
        running_late_sent_at,
        running_late_note,
        student_running_late_sent_at,
        student_running_late_note,
        stripe_payment_intent_id,
        tutor_profiles (display_name, username, currency, payment_instructions),
        availability_slots (starts_at, ends_at)
      `,
      )
      .eq("id", bookingId)
      .maybeSingle();
  }

  if (res.error || !res.data) return null;
  const data = res.data;

  const row = data as BookingManageRow & {
    tutor_id: string;
    running_late_sent_at: string | null;
    running_late_note: string | null;
    student_running_late_sent_at: string | null;
    student_running_late_note: string | null;
  };
  const tutor = firstRelation(row.tutor_profiles);
  const slot = firstRelation(row.availability_slots);
  if (!tutor || !slot) return null;

  const manageToken = createBookingManageToken(row.id) ?? token;
  const startsAt = new Date(slot.starts_at);
  const canCancel =
    row.status === "confirmed" && startsAt.getTime() > Date.now();

  const isPaid = (row as any).is_paid !== undefined 
    ? (row as any).is_paid 
    : (row.stripe_payment_intent_id !== "cash");

  return {
    token: manageToken,
    status: row.status,
    cancelledAt: row.cancelled_at,
    cancelledBy: row.cancelled_by,
    parentEmail: row.parent_email,
    studentName: row.student_name,
    slotLabel: formatSlotRange(slot.starts_at, slot.ends_at),
    slotStartsAt: slot.starts_at,
    slotEndsAt: slot.ends_at,
    tutorDisplayName: tutor.display_name,
    tutorUsername: tutor.username,
    amountLabel: formatMoney(row.amount_cents, tutor.currency),
    canCancel,
    tutorId: row.tutor_id,
    runningLateSentAt: row.running_late_sent_at,
    runningLateNote: row.running_late_note,
    studentRunningLateSentAt: row.student_running_late_sent_at,
    studentRunningLateNote: row.student_running_late_note,
    isPaid,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    tutorPaymentInstructions: tutor.payment_instructions,
  };
}

export async function cancelBookingByManageToken(
  token: string,
): Promise<
  | { ok: true; slotLabel: string; tutorUsername: string }
  | { ok: false; error: string }
> {
  const bookingId = verifyBookingManageToken(token);
  if (!bookingId) {
    return { ok: false, error: "This link is invalid or has expired." };
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      `
      id,
      tutor_id,
      status,
      availability_slots (starts_at, ends_at)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !booking) {
    return { ok: false, error: "Booking not found." };
  }

  const slot = firstRelation(
    (booking as { availability_slots: BookingManageRow["availability_slots"] })
      .availability_slots,
  );

  if (!slot) {
    return { ok: false, error: "Lesson time not found." };
  }

  if (booking.status === "cancelled") {
    return { ok: false, error: "This lesson is already cancelled." };
  }

  if (new Date(slot.starts_at) <= new Date()) {
    return {
      ok: false,
      error: "This lesson has already started and can no longer be cancelled online.",
    };
  }

  const result = await cancelLessonBooking({
    bookingId: booking.id,
    tutorId: booking.tutor_id,
    cancelledBy: "parent",
  });

  if (!result.ok) {
    return result;
  }

  const profile = await getTutorNotifyProfile(booking.tutor_id);
  if (profile) {
    revalidatePath("/dashboard");
    revalidatePath(`/tutor/${profile.username}`);
  }

  return {
    ok: true,
    slotLabel: formatSlotRange(slot.starts_at, slot.ends_at),
    tutorUsername: profile?.username ?? "",
  };
}
