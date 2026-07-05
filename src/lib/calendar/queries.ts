import "server-only";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_SITE_URL } from "@/lib/constants";

export type CalendarBookingEvent = {
  bookingId: string;
  startsAt: string;
  endsAt: string;
  studentName: string | null;
  parentEmail: string;
  meetingLink?: string;
  lessonType?: string;
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
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "dashboard") {
    const feedUrl = `${PUBLIC_SITE_URL}/api/calendar/mock-feed-token-123`;
    const webcalUrl = feedUrl.replace(/^https:/, "webcal:");
    return {
      feedToken: "mock-feed-token-123",
      googleConnected: false,
      feedUrl,
      webcalUrl,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("calendar_feed_token, google_refresh_token")
    .eq("id", tutorId)
    .maybeSingle();

  if (error) return null;

  let feedToken = data?.calendar_feed_token;
  if (!feedToken) {
    feedToken = randomUUID();
    const { error: updateError } = await supabase
      .from("tutor_profiles")
      .update({ calendar_feed_token: feedToken })
      .eq("id", tutorId);
    if (updateError) return null;
  }

  const feedUrl = `${PUBLIC_SITE_URL}/api/calendar/${feedToken}`;
  const webcalUrl = feedUrl.replace(/^https:/, "webcal:");

  return {
    feedToken,
    googleConnected: Boolean(data?.google_refresh_token),
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

  const [{ data: profile }, { data: students }] = await Promise.all([
    admin
      .from("tutor_profiles")
      .select("display_name, meeting_link")
      .eq("id", tutorId)
      .maybeSingle(),
    admin
      .from("students")
      .select("parent_email, student_name, lesson_type")
      .eq("tutor_id", tutorId),
  ]);

  const meetingLink = profile?.meeting_link || "";

  const studentTypeMap = new Map<string, string>();
  for (const s of students ?? []) {
    if (s.parent_email && s.student_name) {
      const key = `${s.parent_email.toLowerCase()}|${s.student_name.trim().toLowerCase()}`;
      studentTypeMap.set(key, s.lesson_type || "online");
    }
  }

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

    const sName = row.student_name || "";
    const pEmail = row.parent_email || "";
    const key = `${pEmail.toLowerCase()}|${sName.trim().toLowerCase()}`;
    const lessonType = studentTypeMap.get(key) || "online";

    events.push({
      bookingId: row.id,
      startsAt: slotData.starts_at,
      endsAt: slotData.ends_at,
      studentName: row.student_name,
      parentEmail: row.parent_email,
      lessonType,
      meetingLink: lessonType === "online" ? meetingLink : "",
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
