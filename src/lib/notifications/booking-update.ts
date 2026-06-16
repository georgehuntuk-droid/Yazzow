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

export async function sendStudentRunningLateEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  note?: string | null;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <bookings@yazzow.com>`;
  const student = input.studentName || "Your student";
  const greeting = `Update from ${student} (parent contact):`;
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
      subject: `Student running late · ${student} · ${input.slotLabel}`,
      html: `
        <p>${greeting}</p>
        <p><strong>${escapeHtml(input.slotLabel)}</strong></p>
        ${noteBlock}
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

export async function sendAnnouncementNotificationEmail(input: {
  to: string;
  tutorName: string;
  tutorUsername: string;
  announcementText: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <bookings@yazzow.com>`;
  const portalUrl = `${PUBLIC_SITE_URL}${TUTOR_PUBLIC_PATH}/${input.tutorUsername}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: `Notice from ${input.tutorName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid oklch(0.92 0.01 250); border-radius: 16px; background-color: oklch(0.99 0.005 250);">
          <h2 style="color: oklch(0.55 0.18 250); margin-top: 0; font-size: 20px;">Notice from ${escapeHtml(input.tutorName)}</h2>
          <p style="font-size: 15px; color: oklch(0.2 0.02 250); line-height: 1.6; white-space: pre-wrap; margin-bottom: 24px;">${escapeHtml(input.announcementText)}</p>
          <hr style="border: none; border-top: 1px solid oklch(0.92 0.01 250); margin: 24px 0;" />
          <p style="font-size: 12px; color: oklch(0.5 0.02 250); text-align: center; margin-bottom: 0;">
            You are receiving this because you are an active student of ${input.tutorName}.
            <br />
            <a href="${portalUrl}" style="color: oklch(0.55 0.18 250); font-weight: bold; text-decoration: none; display: inline-block; margin-top: 8px;">View Tutor Portal</a>
          </p>
        </div>
      `,
    }),
  });

  return response.ok;
}
