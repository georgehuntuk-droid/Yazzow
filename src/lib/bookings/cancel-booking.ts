import "server-only";

import { notifyFamiliesSlotOpened, getTutorNotifyProfile } from "@/lib/notifications/slot-opened";
import { createAdminClient } from "@/lib/supabase/admin";

export async function cancelLessonBooking(input: {
  bookingId: string;
  tutorId: string;
  cancelledBy: "tutor" | "parent";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, slot_id, tutor_id, parent_email, student_name, status, stripe_payment_intent_id")
    .eq("id", input.bookingId)
    .eq("tutor_id", input.tutorId)
    .maybeSingle();

  if (fetchError || !booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (booking.status === "cancelled") {
    return { ok: false, error: "This booking is already cancelled." };
  }

  const { data: slotRow, error: slotFetchError } = await admin
    .from("availability_slots")
    .select("starts_at, ends_at")
    .eq("id", booking.slot_id)
    .maybeSingle();

  if (slotFetchError || !slotRow) {
    return { ok: false, error: "Linked slot not found." };
  }

  if (new Date(slotRow.starts_at) <= new Date()) {
    return { ok: false, error: "Cannot cancel a lesson that has already started." };
  }

  const { error: bookingError } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: input.cancelledBy,
    })
    .eq("id", input.bookingId)
    .eq("tutor_id", input.tutorId);

  if (bookingError) {
    return { ok: false, error: bookingError.message };
  }

  const { error: slotError } = await admin
    .from("availability_slots")
    .update({ is_booked: false })
    .eq("id", booking.slot_id)
    .eq("tutor_id", input.tutorId);

  if (slotError) {
    return { ok: false, error: slotError.message };
  }

  // 0. Refund prepaid lesson credit if the booking was paid with credits
  if (!booking.stripe_payment_intent_id) {
    try {
      const { data: student } = await admin
        .from("students")
        .select("id, lesson_credits")
        .eq("tutor_id", booking.tutor_id)
        .ilike("parent_email", booking.parent_email)
        .eq("student_name", booking.student_name || "")
        .maybeSingle();

      if (student) {
        await admin
          .from("students")
          .update({ lesson_credits: (student.lesson_credits ?? 0) + 1 })
          .eq("id", student.id);
      }
    } catch (refundErr) {
      console.error("[cancelLessonBooking] Failed to process credit refund:", refundErr);
    }
  }


  const profile = await getTutorNotifyProfile(input.tutorId);

  // 0. Trigger push notifications for cancellations
  try {
    const { sendPushNotification } = await import("@/lib/notifications/web-push");
    const { formatSlotRange } = await import("@/lib/format");
    const slotLabel = formatSlotRange(slotRow.starts_at, slotRow.ends_at);

    if (input.cancelledBy === "tutor") {
      const { data: usersData } = await admin.auth.admin.listUsers();
      const parentUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === booking.parent_email.toLowerCase()
      );
      if (parentUser?.id) {
        await sendPushNotification(parentUser.id, {
          title: "Lesson Cancelled by Tutor",
          body: `Your lesson on ${slotLabel} has been cancelled by ${profile?.display_name || "Tutor"}.`,
          url: `/tutor/${profile?.username || "tutor"}/workspace`,
        });
      }
    } else {
      await sendPushNotification(input.tutorId, {
        title: "Lesson Cancelled by Parent",
        body: `${booking.student_name || "Student"} has cancelled their lesson on ${slotLabel}.`,
        url: `/dashboard/schedule`,
      });
    }
  } catch (pushErr) {
    console.error("[cancelLessonBooking] Failed to send push notification:", pushErr);
  }
  
  // 1. Send cancellation confirmation email to the parent
  try {
    const { sendBookingCancellationEmail } = await import(
      "@/lib/notifications/booking-update"
    );
    const { formatSlotRange } = await import("@/lib/format");
    const slotLabel = formatSlotRange(slotRow.starts_at, slotRow.ends_at);
    
    await sendBookingCancellationEmail({
      to: booking.parent_email,
      tutorName: profile?.display_name || "Tutor",
      studentName: booking.student_name,
      slotLabel,
      cancelledBy: input.cancelledBy,
    });
  } catch (err) {
    console.error("[cancelLessonBooking] Failed to send cancellation email to parent:", err);
  }

  // 2. If parent cancelled, notify the tutor as well
  if (input.cancelledBy === "parent") {
    try {
      const { data: tutorUser } = await admin.auth.admin.getUserById(input.tutorId);
      const tutorEmail = tutorUser?.user?.email;
      if (tutorEmail) {
        const { sendTutorCancellationEmail } = await import(
          "@/lib/notifications/booking-update"
        );
        const { formatSlotRange } = await import("@/lib/format");
        const slotLabel = formatSlotRange(slotRow.starts_at, slotRow.ends_at);
        
        await sendTutorCancellationEmail({
          to: tutorEmail,
          tutorName: profile?.display_name || "Tutor",
          studentName: booking.student_name,
          slotLabel,
          parentEmail: booking.parent_email,
        });
      }
    } catch (err) {
      console.error("[cancelLessonBooking] Failed to send cancellation email to tutor:", err);
    }
  }

  // 3. Notify other alert subscribers that a slot has reopened
  if (profile) {
    await notifyFamiliesSlotOpened({
      tutorId: input.tutorId,
      tutorUsername: profile.username,
      tutorDisplayName: profile.display_name,
      slotStartsAt: slotRow.starts_at,
      slotEndsAt: slotRow.ends_at,
      excludeParentEmail: booking.parent_email,
    });
  }

  return { ok: true };
}
