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
    .select("id, slot_id, tutor_id, parent_email, status")
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

  const profile = await getTutorNotifyProfile(input.tutorId);
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
