import "server-only";

import { BRAND_NAME } from "@/lib/constants";
import { getResendFromAddress } from "@/lib/notifications/resend-from";

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[sendResendEmail] Missing RESEND_API_KEY");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getResendFromAddress(),
        to: input.to.trim(),
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[sendResendEmail] Resend API failed:", response.status, text);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[sendResendEmail] fetch exception:", err);
    return false;
  }
}

export async function sendSignupConfirmationEmail(input: {
  to: string;
  confirmUrl: string;
}): Promise<boolean> {
  return sendResendEmail({
    to: input.to,
    subject: `Confirm your ${BRAND_NAME} account`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <!-- Logo Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Confirm your account</h2>
        
        <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
          Welcome to ${BRAND_NAME}! Please confirm your email address to complete your registration and activate your tutor-pupil management dashboard.
        </p>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${input.confirmUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Confirm Email Address</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
          If you did not create a Yazzow account, you can safely ignore this email.
        </p>
      </div>
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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <!-- Logo Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Reset your password</h2>
        
        <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
          We received a request to reset the password associated with your Yazzow account. Click the button below to choose a new password.
        </p>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${input.resetUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Choose a New Password</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
          This link is temporary and will expire soon. If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendStudentInvitationEmail(input: {
  to: string;
  tutorName: string;
  studentName: string;
  workspaceUrl: string;
  isNewUser?: boolean;
}): Promise<boolean> {
  const buttonText = input.isNewUser ? "Set Up Password & Access Workspace" : "Open Student Workspace";
  const instructionText = input.isNewUser
    ? `Please click the link below to set up your password and access your private dashboard:`
    : `To view your remaining lesson credits, view homework tasks, and manage your lesson schedule, click the link below to sign in:`;

  return sendResendEmail({
    to: input.to,
    subject: `Join ${input.tutorName}'s private classroom on Yazzow`,
    html: `
      <p>Hello,</p>
      <p>Your tutor, <strong>${input.tutorName}</strong>, has added <strong>${input.studentName}</strong> to their private classroom workspace on Yazzow.</p>
      <p>${instructionText}</p>
      <p style="margin: 20px 0;"><a href="${input.workspaceUrl}" style="background-color:#446152;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;font-size:14px;">${buttonText}</a></p>
      ${!input.isNewUser ? `<p>If you do not have a Yazzow account yet, simply sign up with this email address (${input.to}) to instantly link your children's profiles.</p>` : ""}
      <p>Best regards,<br/>The Yazzow Team</p>
    `,
  });
}
