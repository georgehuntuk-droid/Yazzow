import "server-only";

import { formatRunningLateSlotLabel } from "@/lib/notifications/booking-update";
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

  // Update the booking row
  await admin
    .from("bookings")
    .update({
      running_late_sent_at: new Date().toISOString(),
      running_late_note: note,
    })
    .eq("id", input.bookingId);

  // Add system message to chat thread
  const noteText = note ? `: "${note}"` : ".";
  const messageContent = `⏳ [Running Late Notice] I am running late for our lesson scheduled on ${slotLabel}${noteText}`;
  await admin.from("messages").insert({
    tutor_id: input.tutorId,
    parent_email: booking.parent_email,
    sender: "tutor",
  });

  // Trigger push notification to parent
  try {
    const { data: usersData } = await admin.auth.admin.listUsers();
    const parentUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === booking.parent_email.toLowerCase()
    );
    if (parentUser?.id) {
      const { sendPushNotification } = await import("@/lib/notifications/web-push");
      await sendPushNotification(parentUser.id, {
        title: "Tutor Running Late",
        body: `${profile.display_name} is running late: "${note || "No details provided."}"`,
        url: `/tutor/${profile.username}/workspace?tab=chat`,
      });
    }
  } catch (pushErr) {
    console.error("[sendRunningLateNotice] Failed to send push notification:", pushErr);
  }

  return { ok: true, emailed: false };
}

export async function sendStudentRunningLateNotice(input: {
  bookingId: string;
  note?: string | null;
}): Promise<
  { ok: true; emailed: boolean } | { ok: false; error: string }
> {
  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, slot_id, tutor_id, parent_email, student_name, status")
    .eq("id", input.bookingId)
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

  const profile = await getTutorNotifyProfile(booking.tutor_id);
  if (!profile) {
    return { ok: false, error: "Tutor profile not found." };
  }

  const note = input.note?.trim() || null;
  const slotLabel = formatRunningLateSlotLabel(slotRow.starts_at, slotRow.ends_at);

  // Update the booking row
  await admin
    .from("bookings")
    .update({
      student_running_late_sent_at: new Date().toISOString(),
      student_running_late_note: note,
    })
    .eq("id", input.bookingId);

  // Add system message to chat thread
  const noteText = note ? `: "${note}"` : ".";
  const studentDisplayName = booking.student_name || "Student";
  const messageContent = `⏳ [Running Late Notice] ${studentDisplayName} is running late for our lesson scheduled on ${slotLabel}${noteText}`;
  await admin.from("messages").insert({
    tutor_id: booking.tutor_id,
    parent_email: booking.parent_email,
    sender: "parent",
    content: messageContent,
  });

  // Trigger push notification to tutor
  try {
    const { sendPushNotification } = await import("@/lib/notifications/web-push");
    await sendPushNotification(booking.tutor_id, {
      title: "Student Running Late",
      body: `${studentDisplayName} is running late: "${note || "No details provided."}"`,
      url: `/dashboard/messages?parentEmail=${encodeURIComponent(booking.parent_email)}`,
    });
  } catch (pushErr) {
    console.error("[sendStudentRunningLateNotice] Failed to send push notification:", pushErr);
  }

  return { ok: true, emailed: false };
}
