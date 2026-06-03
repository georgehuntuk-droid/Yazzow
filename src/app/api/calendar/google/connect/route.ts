import { redirect } from "next/navigation";

import { requireTutorProfile } from "@/lib/auth/session";
import { getGoogleCalendarAuthUrl, isGoogleCalendarConfigured } from "@/lib/calendar/google";

export async function GET() {
  if (!isGoogleCalendarConfigured()) {
    redirect("/dashboard?calendar=google-not-configured");
  }

  const { profile } = await requireTutorProfile();
  const url = getGoogleCalendarAuthUrl(profile.id);
  redirect(url);
}
