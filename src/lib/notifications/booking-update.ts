import "server-only";

import { BRAND_NAME, PUBLIC_SITE_URL, TUTOR_PUBLIC_PATH } from "@/lib/constants";
import { formatSlotRange } from "@/lib/format";

export async function sendRunningLateEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  tutorUsername: string;
  note?: string | null;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <bookings@yazzow.com>`;
  const portalUrl = `${PUBLIC_SITE_URL}${TUTOR_PUBLIC_PATH}/${input.tutorUsername}`;
  const greeting = input.studentName
    ? `Update for ${input.studentName}'s lesson with ${input.tutorName}:`
    : `Update from ${input.tutorName}:`;
  const noteBlock = input.note
    ? `<p><strong>Message:</strong> ${escapeHtml(input.note)}</p>`
    : "<p>They are running a little late — the lesson is still on.</p>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `Running late · ${input.tutorName} · ${input.slotLabel}`,
      html: `
        <p>${greeting}</p>
        <p><strong>${escapeHtml(input.slotLabel)}</strong></p>
        ${noteBlock}
        <p><a href="${portalUrl}">View your tutor portal</a></p>
      `,
    }),
  });

  return response.ok;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatRunningLateSlotLabel(startsAt: string, endsAt: string): string {
  return formatSlotRange(startsAt, endsAt);
}
