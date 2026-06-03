import "server-only";

import {
  formatRunningLateSlotLabel,
  sendRunningLateEmail,
} from "@/lib/notifications/booking-update";
import { getTutorNotifyProfile } from "@/lib/notifications/slot-opened";
import { createAdminClient } from "@/lib/supabase/admin";

export async function sendRunningLateNotice(input: {
  bookingId: string;
  tutorId: string;
  note?: string | null;
}): Promise<
  { ok: true; emailed: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, slot_id, tutor_id, parent_email, student_name, status, running_late_sent_at")
    .eq("id", input.bookingId)
    .eq("tutor_id", input.tutorId)
    .maybeSingle();

  if (fetchError || !booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status !== "confirmed") {
    return { ok: false, error: "Only confirmed lessons can be updated." };
  }

  const { data: slotRow } = await admin
    .from("availability_slots")
    .select("starts_at, ends_at")
    .eq("id", booking.slot_id)
    .maybeSingle();

  if (!slotRow) {
    return { ok: false, error: "Lesson time not found." };
  }

  const lessonEnd = new Date(slotRow.ends_at);
  if (lessonEnd <= new Date()) {
    return { ok: false, error: "This lesson has already finished." };
  }

  const profile = await getTutorNotifyProfile(input.tutorId);
  if (!profile) {
    return { ok: false, error: "Tutor profile not found." };
  }

  const note = input.note?.trim() || null;
  const slotLabel = formatRunningLateSlotLabel(slotRow.starts_at, slotRow.ends_at);

  const emailed = await sendRunningLateEmail({
    to: booking.parent_email,
    tutorName: profile.display_name,
    studentName: booking.student_name,
    slotLabel,
    tutorUsername: profile.username,
    note,
  });

  await admin
    .from("bookings")
    .update({
      running_late_sent_at: new Date().toISOString(),
      running_late_note: note,
    })
    .eq("id", input.bookingId);

  if (!process.env.RESEND_API_KEY) {
    return { ok: true, emailed: false };
  }

  if (!emailed) {
    return {
      ok: false,
      error: "Could not send email. Check RESEND_API_KEY is set on the server.",
    };
  }

  return { ok: true, emailed: true };
}
