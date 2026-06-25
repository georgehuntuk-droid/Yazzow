import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLessonReminder } from "@/lib/bookings/lesson-reminders";

export async function GET(request: Request) {
  // 1. Authenticate Cron Job
  const authHeader = request.headers.get("Authorization");
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || url.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const isAuthorized =
      authHeader === `Bearer ${expectedSecret}` || token === expectedSecret;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();
  // Fetch bookings starting in the 23-25 hours window
  const startsFrom = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const startsTo = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  console.log(`[Cron Lesson Reminders] Sweeping for lessons starting between ${startsFrom} and ${startsTo}`);

  // Query bookings with full inner joins
  let res: any = await admin
    .from("bookings")
    .select(`
      id,
      tutor_id,
      parent_email,
      status,
      lesson_reminder_sent_at,
      tutor_profiles!inner (
        id,
        automated_lesson_reminders
      ),
      availability_slots!inner (
        id,
        starts_at,
        ends_at
      )
    `)
    .eq("status", "confirmed")
    .eq("tutor_profiles.automated_lesson_reminders", true)
    .is("lesson_reminder_sent_at", null)
    .gte("availability_slots.starts_at", startsFrom)
    .lte("availability_slots.starts_at", startsTo);

  let hasLessonReminderSentAt = true;
  let hasAutomatedLessonReminders = true;

  if (res.error) {
    const isReminderErr = res.error.code === "42703" || res.error.message.includes("lesson_reminder_sent_at");
    const isAutoErr = res.error.code === "42703" || res.error.message.includes("automated_lesson_reminders");

    if (isReminderErr || isAutoErr) {
      console.log(`[Cron Lesson Reminders] Detected missing columns (ReminderErr: ${isReminderErr}, AutoErr: ${isAutoErr}). Falling back to safe query...`);
      
      const selectFields = [
        "id",
        "tutor_id",
        "parent_email",
        "status",
        "availability_slots!inner (id, starts_at, ends_at)"
      ];
      
      if (!isReminderErr) {
        selectFields.push("lesson_reminder_sent_at");
        hasLessonReminderSentAt = true;
      } else {
        hasLessonReminderSentAt = false;
      }

      if (!isAutoErr) {
        selectFields.push("tutor_profiles!inner (id, automated_lesson_reminders)");
        hasAutomatedLessonReminders = true;
      } else {
        hasAutomatedLessonReminders = false;
        selectFields.push("tutor_profiles!inner (id)");
      }

      let fallbackQuery = admin
        .from("bookings")
        .select(selectFields.join(","))
        .eq("status", "confirmed")
        .gte("availability_slots.starts_at", startsFrom)
        .lte("availability_slots.starts_at", startsTo);

      if (hasAutomatedLessonReminders) {
        fallbackQuery = fallbackQuery.eq("tutor_profiles.automated_lesson_reminders", true);
      }
      if (hasLessonReminderSentAt) {
        fallbackQuery = fallbackQuery.is("lesson_reminder_sent_at", null);
      }

      res = await fallbackQuery;
    }
  }

  if (res.error) {
    console.error("[Cron Lesson Reminders] Query failed:", res.error);
    return NextResponse.json({ error: res.error.message }, { status: 500 });
  }

  const bookings = res.data ?? [];
  console.log(`[Cron Lesson Reminders] Found ${bookings.length} potential bookings to remind.`);

  const results = [];
  for (const b of bookings) {
    // If we couldn't filter by automated_lesson_reminders in SQL, verify it in JS
    if (!hasAutomatedLessonReminders) {
      const tutor = Array.isArray(b.tutor_profiles) ? b.tutor_profiles[0] : b.tutor_profiles;
      const isEnabled = tutor && (tutor as any).automated_lesson_reminders === true;
      if (!isEnabled) {
        console.log(`[Cron Lesson Reminders] Skipping booking ${b.id}: tutor has automated reminders disabled or column missing.`);
        continue;
      }
    }

    try {
      console.log(`[Cron Lesson Reminders] Sending reminder for booking ${b.id}...`);
      const remindRes = await sendLessonReminder(b.id, b.tutor_id);
      results.push({ bookingId: b.id, ok: remindRes.ok, error: "error" in remindRes ? remindRes.error : null });
    } catch (err) {
      console.error(`[Cron Lesson Reminders] Failed to send reminder for booking ${b.id}:`, err);
      results.push({ bookingId: b.id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    processed: bookings.length,
    results,
  });
}
