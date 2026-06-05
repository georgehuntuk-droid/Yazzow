import "server-only";

import { bookingManageUrl } from "@/lib/bookings/manage-token";
import { BRAND_NAME, PUBLIC_SITE_URL, TUTOR_PUBLIC_PATH } from "@/lib/constants";
import { formatMoney, formatSlotRange } from "@/lib/format";

export async function sendBookingConfirmationEmail(input: {
  bookingId: string;
  parentEmail?: string; // support old parameter names gracefully
  to?: string;
  tutorName: string;
  tutorUsername: string;
  studentName: string | null;
  slotStartsAt?: string; // support old parameter names gracefully
  startsAt?: string;
  slotEndsAt?: string; // support old parameter names gracefully
  endsAt?: string;
  amountCents: number;
  currency: string;
  isCreditPayment?: boolean;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const targetEmail = input.to || input.parentEmail;
  if (!targetEmail) return false;

  const startsAt = input.slotStartsAt || input.startsAt;
  const endsAt = input.slotEndsAt || input.endsAt;
  if (!startsAt || !endsAt) return false;

  const manageUrl = bookingManageUrl(input.bookingId);
  if (!manageUrl) return false;

  const from =
    process.env.RESEND_FROM_EMAIL ?? `${BRAND_NAME} <bookings@yazzow.com>`;
  const portalUrl = `${PUBLIC_SITE_URL}${TUTOR_PUBLIC_PATH}/${input.tutorUsername}`;
  const slotLabel = formatSlotRange(startsAt, endsAt);
  const amountLabel = input.isCreditPayment
    ? "Prepaid Credit"
    : formatMoney(input.amountCents, input.currency);
  const studentLine = input.studentName
    ? `<p><strong>Student:</strong> ${escapeHtml(input.studentName)}</p>`
    : "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: targetEmail,
      subject: `Lesson booked · ${input.tutorName} · ${slotLabel}`,
      html: `
        <p>Your lesson with ${escapeHtml(input.tutorName)} is confirmed.</p>
        ${studentLine}
        <p><strong>When:</strong> ${escapeHtml(slotLabel)}</p>
        <p><strong>Paid:</strong> ${escapeHtml(amountLabel)}</p>
        <p><a href="${portalUrl}">View tutor portal</a></p>
        <p style="margin-top:24px;"><a href="${manageUrl}">Manage or cancel this booking</a></p>
        <p style="color:#666;font-size:12px;">Need to free the slot? Cancel from the link above — other families on the alert list will be notified when the hour reopens. Refunds are arranged with your tutor if applicable.</p>
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
