import { redirect } from "next/navigation";

import { disconnectGoogleCalendar } from "@/lib/calendar/actions";

export async function POST() {
  await disconnectGoogleCalendar();
  redirect("/dashboard?calendar=google-disconnected");
}
