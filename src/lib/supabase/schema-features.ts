import { createClient } from "@/lib/supabase/server";

let cached: Promise<{
  studentStatus: boolean;
  lessonFeedback: boolean;
  tutorSubscription: boolean;
  portalWelcome: boolean;
}> | null = null;

/** Detect optional columns so the app works before migrations 004–008 are applied. */
export async function getSchemaFeatures() {
  if (!cached) {
    cached = detectSchemaFeatures();
  }
  return cached;
}

async function detectSchemaFeatures() {
  const supabase = await createClient();

  const [studentStatus, lessonFeedback, tutorSubscription, portalWelcome] =
    await Promise.all([
      columnExists(supabase, "students", "status"),
      columnExists(supabase, "bookings", "tutor_lesson_feedback"),
      columnExists(supabase, "tutor_profiles", "subscription_status"),
      columnExists(supabase, "tutor_profiles", "portal_welcome_message"),
    ]);

  return {
    studentStatus,
    lessonFeedback,
    tutorSubscription,
    portalWelcome,
  };
}

async function columnExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  column: string,
): Promise<boolean> {
  const { error } = await supabase.from(table).select(column).limit(0);
  if (!error) return true;
  if (error.message.includes("does not exist") || error.code === "42703") {
    return false;
  }
  return true;
}
