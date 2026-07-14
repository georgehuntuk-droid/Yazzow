import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/notifications/web-push";
import { PUBLIC_SITE_URL } from "@/lib/constants";
import { formatSlotRange } from "@/lib/format";

type BlastParams = {
  tutorId: string;
  bookingId: string;
  slotId: string;
};

export async function triggerWaitlistPushBlast({
  tutorId,
  bookingId,
  slotId,
}: BlastParams): Promise<{ ok: boolean; error?: string; recipientCount?: number }> {
  const admin = createAdminClient();

  // 1. Fetch tutor profile, booking, and slot details
  const [tutorRes, bookingRes, slotRes] = await Promise.all([
    admin
      .from("tutor_profiles")
      .select("display_name, last_sms_blast_at")
      .eq("id", tutorId)
      .maybeSingle(),
    admin
      .from("bookings")
      .select("subject_id, education_level, parent_email")
      .eq("id", bookingId)
      .maybeSingle(),
    admin
      .from("availability_slots")
      .select("starts_at, ends_at")
      .eq("id", slotId)
      .maybeSingle(),
  ]);

  if (tutorRes.error || !tutorRes.data) {
    return { ok: false, error: "tutor_not_found" };
  }
  if (bookingRes.error || !bookingRes.data) {
    return { ok: false, error: "booking_not_found" };
  }
  if (slotRes.error || !slotRes.data) {
    return { ok: false, error: "slot_not_found" };
  }

  const tutor = tutorRes.data;
  const booking = bookingRes.data;
  const slot = slotRes.data;

  // Enforce subject and education level requirement
  if (!booking.subject_id || !booking.education_level) {
    console.log("[triggerWaitlistPushBlast] Booking has no subject or education level. Skipping blast.");
    return { ok: false, error: "missing_subject_or_level" };
  }

  // 2. 24-Hour Cool-down check
  if (tutor.last_sms_blast_at) {
    const lastBlastTime = new Date(tutor.last_sms_blast_at).getTime();
    const msSinceLastBlast = Date.now() - lastBlastTime;
    const cooldownMs = 24 * 60 * 60 * 1000;

    if (msSinceLastBlast < cooldownMs) {
      const remainingHours = ((cooldownMs - msSinceLastBlast) / (1000 * 60 * 60)).toFixed(1);
      console.warn(`[triggerWaitlistPushBlast] Cooldown active for tutor ${tutorId}. Next blast available in ${remainingHours}h.`);

      // Log administrative notice
      await admin.from("admin_notices").insert({
        title: "Push Waitlist Blast Rate Limited",
        content: `Tutor ${tutor.display_name} (ID: ${tutorId}) attempted to send a waitlist push blast for slot starting ${slot.starts_at}, but it was blocked by the 24-hour rate limit. Last blast was sent at ${tutor.last_sms_blast_at}.`,
      });

      return { ok: false, error: "cooldown_active" };
    }
  }

  // 3. Query targeted matching students
  // Fetch up to 10 matching students who take this subject & level, and are not the cancelling parent
  const { data: students, error: studentsErr } = await admin
    .from("students")
    .select("parent_email, student_name")
    .eq("tutor_id", tutorId)
    .eq("subject_id", booking.subject_id)
    .eq("education_level", booking.education_level)
    .neq("parent_email", booking.parent_email)
    .limit(10);

  if (studentsErr) {
    return { ok: false, error: `failed_to_fetch_students: ${studentsErr.message}` };
  }

  if (!students || students.length === 0) {
    console.log("[triggerWaitlistPushBlast] No targeted students found.");
    return { ok: true, recipientCount: 0 };
  }

  // 4. Generate unique claim token and assign it to the slot
  const claimToken = crypto.randomUUID().replace(/-/g, "").substring(0, 12);
  const { error: slotUpdateErr } = await admin
    .from("availability_slots")
    .update({ claim_token: claimToken })
    .eq("id", slotId);

  if (slotUpdateErr) {
    return { ok: false, error: `failed_to_assign_token: ${slotUpdateErr.message}` };
  }

  // 5. Fire Push notifications to targeted cohort in parallel
  const claimUrl = `${PUBLIC_SITE_URL}/slots/claim/${claimToken}`;
  const slotFormatted = formatSlotRange(slot.starts_at, slot.ends_at);
  const subjectLevel = `${booking.education_level} ${booking.subject_id}`;
  
  const { data: usersData } = await admin.auth.admin.listUsers();
  const usersList = usersData?.users || [];

  const pushPromises = students.map(async (student) => {
    try {
      // Resolve student's parent_email to their auth user_id
      const parentUser = usersList.find(
        (u) => u.email?.toLowerCase() === student.parent_email.toLowerCase()
      );
      const userId = parentUser?.id;
      
      if (!userId) {
        console.warn(`[triggerWaitlistPushBlast] No registered auth user found for parent email: ${student.parent_email}`);
        return false;
      }

      const title = "⚡ Cancelled Lesson Opened!";
      const body = `A slot for ${subjectLevel} with ${tutor.display_name} on ${slotFormatted} has opened up. Tap to claim it instantly!`;
      
      const { successCount } = await sendPushNotification(userId, {
        title,
        body,
        url: claimUrl,
      });

      return successCount > 0;
    } catch (err: any) {
      console.error(`[triggerWaitlistPushBlast] Error sending push to parent ${student.parent_email}:`, err.message);
      return false;
    }
  });

  const results = await Promise.all(pushPromises);
  const successfulPushCount = results.filter(Boolean).length;

  console.log(`[triggerWaitlistPushBlast] Successfully sent push notifications to ${successfulPushCount}/${students.length} parents.`);

  // 6. Update last_sms_blast_at timestamp (used as general cooldown)
  await admin
    .from("tutor_profiles")
    .update({ last_sms_blast_at: new Date().toISOString() })
    .eq("id", tutorId);

  return { ok: true, recipientCount: successfulPushCount };
}
