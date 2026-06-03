import "server-only";

import { BRAND_NAME } from "@/lib/constants";
import { getResendFromAddress } from "@/lib/notifications/resend-from";

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  return response.ok;
}

export async function sendSignupConfirmationEmail(input: {
  to: string;
  confirmUrl: string;
}): Promise<boolean> {
  return sendResendEmail({
    to: input.to,
    subject: `Confirm your ${BRAND_NAME} account`,
    html: `
      <p>Welcome to ${BRAND_NAME}.</p>
      <p><a href="${input.confirmUrl}">Confirm your email and finish setup</a></p>
      <p style="color:#666;font-size:12px;">If you did not request this, you can ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<boolean> {
  return sendResendEmail({
    to: input.to,
    subject: `Reset your ${BRAND_NAME} password`,
    html: `
      <p>Reset your password:</p>
      <p><a href="${input.resetUrl}">Choose a new password</a></p>
      <p style="color:#666;font-size:12px;">This link expires after a while. If you did not ask for a reset, ignore this email.</p>
    `,
  });
}
