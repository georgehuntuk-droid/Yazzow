import "server-only";

import { BRAND_NAME, PUBLIC_SITE_URL, TUTOR_PUBLIC_PATH } from "@/lib/constants";
import { formatSlotRange } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TutorProfileRow } from "@/lib/supabase/database.types";

export type SlotOpenedPayload = {
  tutorId: string;
  tutorUsername: string;
  tutorDisplayName: string;
  slotStartsAt: string;
  slotEndsAt: string;
  excludeParentEmail?: string | null;
};

export async function notifyFamiliesSlotOpened(
  payload: SlotOpenedPayload,
): Promise<{ recipientCount: number; emailsSent: number }> {
  const admin = createAdminClient();

  // STstrictly fetch only families who have explicitly opted in for slot alerts
  const [subscribersRes] = await Promise.all([
    admin
      .from("slot_alert_subscribers")
      .select("parent_email, student_name")
      .eq("tutor_id", payload.tutorId),
  ]);

  const exclude = payload.excludeParentEmail?.trim().toLowerCase();
  const recipients = new Map<string, string | null>();

  for (const row of (subscribersRes.data ?? [])) {
    const email = row.parent_email.trim().toLowerCase();
    if (!email || email === exclude) continue;
    if (!recipients.has(email)) {
      recipients.set(email, row.student_name ?? null);
    }
  }

  const slotLabel = formatSlotRange(payload.slotStartsAt, payload.slotEndsAt);
  const portalUrl = `${PUBLIC_SITE_URL}${TUTOR_PUBLIC_PATH}/${payload.tutorUsername}`;
  let emailsSent = 0;

  for (const [email, studentName] of recipients) {
    const sent = await sendSlotOpenedEmail({
      to: email,
      tutorName: payload.tutorDisplayName,
      studentName,
      slotLabel,
      portalUrl,
    });
    if (sent) emailsSent += 1;
  }

  return { recipientCount: recipients.size, emailsSent };
}

async function sendSlotOpenedEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  portalUrl: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <bookings@yazzow.com>`;
  const greeting = input.studentName
    ? `A lesson time with ${input.tutorName} is open for ${input.studentName}.`
    : `A lesson time with ${input.tutorName} is now available.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `Lesson slot available · ${input.tutorName}`,
      html: `
        <p>${greeting}</p>
        <p><strong>${input.slotLabel}</strong></p>
        <p><a href="${input.portalUrl}">Book on ${BRAND_NAME}</a></p>
        <p style="color:#666;font-size:12px;">You're receiving this because you're in this tutor's family group or asked for slot alerts.</p>
      `,
    }),
  });

  return response.ok;
}

export async function getTutorNotifyProfile(tutorId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tutor_profiles")
    .select("username, display_name")
    .eq("id", tutorId)
    .maybeSingle();

  return data as Pick<TutorProfileRow, "username" | "display_name"> | null;
}
