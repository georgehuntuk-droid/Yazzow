import "server-only";

import { createGoogleCalendarEvent, isGoogleCalendarConfigured } from "@/lib/calendar/google";
import { getGoogleCalendarCredentials } from "@/lib/calendar/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { BRAND_NAME } from "@/lib/constants";

export async function syncBookingToGoogleCalendar(bookingId: string): Promise<void> {
  if (!isGoogleCalendarConfigured()) return;

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      `
      id,
      tutor_id,
      student_name,
      parent_email,
      google_calendar_event_id,
      availability_slots (starts_at, ends_at)
    `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.google_calendar_event_id) return;

  const slot = booking.availability_slots as
    | { starts_at: string; ends_at: string }
    | { starts_at: string; ends_at: string }[]
    | null;
  const slotData = Array.isArray(slot) ? slot[0] : slot;
  if (!slotData) return;

  const credentials = await getGoogleCalendarCredentials(booking.tutor_id);
  if (!credentials) return;

  const studentLabel = booking.student_name?.trim() || "Student";
  const summary = `${BRAND_NAME} lesson · ${studentLabel}`;
  const description = [
    `Student: ${studentLabel}`,
    `Parent: ${booking.parent_email}`,
    `Booked via ${BRAND_NAME}`,
  ].join("\n");

  const eventId = await createGoogleCalendarEvent({
    refreshToken: credentials.refreshToken,
    calendarId: credentials.calendarId,
    summary,
    description,
    startsAt: slotData.starts_at,
    endsAt: slotData.ends_at,
  });

  if (eventId) {
    await admin
      .from("bookings")
      .update({ google_calendar_event_id: eventId })
      .eq("id", bookingId);
  }
}
