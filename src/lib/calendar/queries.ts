import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_SITE_URL } from "@/lib/constants";

export type CalendarBookingEvent = {
  bookingId: string;
  startsAt: string;
  endsAt: string;
  studentName: string | null;
  parentEmail: string;
};

export type TutorCalendarSettings = {
  feedToken: string;
  googleConnected: boolean;
  feedUrl: string;
  webcalUrl: string;
};

export async function getTutorCalendarSettings(
  tutorId: string,
): Promise<TutorCalendarSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("calendar_feed_token, google_refresh_token")
    .eq("id", tutorId)
    .maybeSingle();

  if (error || !data?.calendar_feed_token) return null;

  const feedUrl = `${PUBLIC_SITE_URL}/api/calendar/${data.calendar_feed_token}`;
  const webcalUrl = feedUrl.replace(/^https:/, "webcal:");

  return {
    feedToken: data.calendar_feed_token,
    googleConnected: Boolean(data.google_refresh_token),
    feedUrl,
    webcalUrl,
  };
}

export async function getTutorIdByFeedToken(token: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_profiles")
    .select("id")
    .eq("calendar_feed_token", token)
    .maybeSingle();

  return data?.id ?? null;
}

export async function getCalendarEventsForFeed(
  tutorId: string,
): Promise<{ tutorName: string; events: CalendarBookingEvent[] }> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("tutor_profiles")
    .select("display_name")
    .eq("id", tutorId)
    .maybeSingle();

  const { data: bookings } = await admin
    .from("bookings")
    .select(
      `
      id,
      student_name,
      parent_email,
      availability_slots!inner (
        starts_at,
        ends_at
      )
    `,
    )
    .eq("tutor_id", tutorId)
    .in("status", ["confirmed", "pending"]);

  const now = Date.now();
  const events: CalendarBookingEvent[] = [];

  for (const row of bookings ?? []) {
    const slot = row.availability_slots as
      | { starts_at: string; ends_at: string }
      | { starts_at: string; ends_at: string }[]
      | null;

    const slotData = Array.isArray(slot) ? slot[0] : slot;
    if (!slotData) continue;
    if (new Date(slotData.ends_at).getTime() < now) continue;

    events.push({
      bookingId: row.id,
      startsAt: slotData.starts_at,
      endsAt: slotData.ends_at,
      studentName: row.student_name,
      parentEmail: row.parent_email,
    });
  }

  events.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return {
    tutorName: profile?.display_name ?? "Yazzow tutor",
    events,
  };
}

export async function getGoogleCalendarCredentials(
  tutorId: string,
): Promise<{ refreshToken: string; calendarId: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_profiles")
    .select("google_refresh_token, google_calendar_id")
    .eq("id", tutorId)
    .maybeSingle();

  if (!data?.google_refresh_token) return null;

  return {
    refreshToken: data.google_refresh_token,
    calendarId: data.google_calendar_id ?? "primary",
  };
}
