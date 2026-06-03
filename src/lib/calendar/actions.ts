"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";

import { requireTutorProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function formatSupabaseError(message: string): string {
  if (message.includes("calendar_feed_token")) {
    return "Run the latest database migration (003_calendar_integration.sql) first.";
  }
  return message;
}

export async function rotateCalendarFeedToken() {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tutor_profiles")
    .update({ calendar_feed_token: randomUUID() })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function disconnectGoogleCalendar() {
  const { profile } = await requireTutorProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      google_refresh_token: null,
      google_calendar_id: "primary",
    })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}
