import { redirect } from "next/navigation";

import { requireTutorProfile } from "@/lib/auth/session";
import { exchangeGoogleCode, isGoogleCalendarConfigured } from "@/lib/calendar/google";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!isGoogleCalendarConfigured()) {
    redirect("/dashboard?calendar=google-not-configured");
  }

  const { profile } = await requireTutorProfile();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    redirect("/dashboard?calendar=google-denied");
  }

  if (!code || state !== profile.id) {
    redirect("/dashboard?calendar=google-failed");
  }

  try {
    const tokens = await exchangeGoogleCode(code);

    if (!tokens.refreshToken) {
      redirect("/dashboard?calendar=google-no-refresh");
    }

    const supabase = await createClient();
    await supabase
      .from("tutor_profiles")
      .update({
        google_refresh_token: tokens.refreshToken,
        google_calendar_id: "primary",
      })
      .eq("id", profile.id);

    redirect("/dashboard?calendar=google-connected");
  } catch {
    redirect("/dashboard?calendar=google-failed");
  }
}
