import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatSlotRange } from "@/lib/format";
import { sendResendEmail } from "@/lib/notifications/auth-email";
import { PUBLIC_SITE_URL } from "@/lib/constants";

export async function sendLessonReminder(
  bookingId: string,
  tutorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // 1. Fetch booking details and join tutor profiles / slots
  let res = await admin
    .from("bookings")
    .select(`
      id,
      parent_email,
      student_name,
      status,
      lesson_reminder_sent_at,
      slot_id,
      tutor_profiles!inner (
        display_name,
        username
      ),
      availability_slots!inner (
        starts_at,
        ends_at
      )
    `)
    .eq("id", bookingId)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  let hasLessonReminderSentAtColumn = true;
  if (res.error && (res.error.code === "42703" || res.error.message.includes("lesson_reminder_sent_at"))) {
    hasLessonReminderSentAtColumn = false;
    res = await admin
      .from("bookings")
      .select(`
        id,
        parent_email,
        student_name,
        status,
        slot_id,
        tutor_profiles!inner (
          display_name,
          username
        ),
        availability_slots!inner (
          starts_at,
          ends_at
        )
      `)
      .eq("id", bookingId)
      .eq("tutor_id", tutorId)
      .maybeSingle();
  }

  if (res.error || !res.data) {
    return { ok: false, error: "Booking not found." };
  }

  const booking = res.data;

  if (booking.status !== "confirmed") {
    return { ok: false, error: "Only confirmed lessons can be reminded." };
  }

  if (hasLessonReminderSentAtColumn && (booking as any).lesson_reminder_sent_at) {
    return { ok: false, error: "Lesson reminder has already been sent." };
  }

  const slot = Array.isArray(booking.availability_slots)
    ? booking.availability_slots[0]
    : booking.availability_slots;

  const tutor = Array.isArray(booking.tutor_profiles)
    ? booking.tutor_profiles[0]
    : booking.tutor_profiles;

  if (!slot || !tutor) {
    return { ok: false, error: "Associated lesson time or tutor profile not found." };
  }

  const lessonStart = new Date(slot.starts_at);
  if (lessonStart <= new Date()) {
    return { ok: false, error: "This lesson has already started or finished." };
  }

  // 2. Mark booking as reminded in the DB
  if (hasLessonReminderSentAtColumn) {
    const now = new Date().toISOString();
    const { error: updateErr } = await admin
      .from("bookings")
      .update({
        lesson_reminder_sent_at: now,
      })
      .eq("id", bookingId);

    if (updateErr) {
      return { ok: false, error: "Failed to save reminder timestamp." };
    }
  }

  const slotLabel = formatSlotRange(slot.starts_at, slot.ends_at);
  const studentNameLabel = booking.student_name ? ` for ${booking.student_name}` : "";

  // 3. Insert system chat message
  const chatMessageContent = `🔔 [Lesson Reminder] Hello! Just a friendly reminder that we have a lesson scheduled on ${slotLabel}${studentNameLabel}. See you then!`;
  await admin.from("messages").insert({
    tutor_id: tutorId,
    parent_email: booking.parent_email,
    sender: "tutor",
    content: chatMessageContent,
  });

  // 4. Send email notification via Resend
  const workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${tutor.username}/workspace`;
  const emailSubject = `Upcoming Lesson Reminder: ${slotLabel}`;
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #446152; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Lesson Reminder</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        This is a friendly reminder of your upcoming lesson with <strong>${tutor.display_name}</strong>.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-family: sans-serif;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Lesson Time</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${slotLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Student</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${booking.student_name || "GCSE Student"}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${workspaceUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Open Student Workspace</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        To join your lesson, view resources, or message your tutor, click the button above to access your student classroom workspace.
      </p>
    </div>
  `;

  try {
    await sendResendEmail({
      to: booking.parent_email,
      subject: emailSubject,
      html: emailHtml,
    });
  } catch (err) {
    console.error("Failed to send lesson reminder email:", err);
  }

  return { ok: true };
}
