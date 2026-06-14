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

export async function sendStudentInvitationEmail(input: {
  to: string;
  tutorName: string;
  studentName: string;
  workspaceUrl: string;
}): Promise<boolean> {
  return sendResendEmail({
    to: input.to,
    subject: `Join ${input.tutorName}'s private classroom on Yazzow`,
    html: `
      <p>Hello,</p>
      <p>Your tutor, <strong>${input.tutorName}</strong>, has added <strong>${input.studentName}</strong> to their private classroom workspace on Yazzow.</p>
      <p>To view your remaining lesson credits, view homework tasks, and manage your lesson schedule, click the link below to sign in or create an account:</p>
      <p style="margin: 20px 0;"><a href="${input.workspaceUrl}" style="background-color:#446152;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;font-size:14px;">Open Student Workspace</a></p>
      <p>If you do not have a Yazzow account yet, simply sign up with this email address (${input.to}) to instantly link your children's profiles.</p>
      <p>Best regards,<br/>The Yazzow Team</p>
    `,
  });
}
