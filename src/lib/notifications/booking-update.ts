import "server-only";

import { formatSlotRange } from "@/lib/format";
import { sendResendEmail } from "@/lib/notifications/auth-email";

export async function sendRunningLateEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  tutorUsername: string;
  note?: string | null;
}): Promise<boolean> {
  return true;
}

export async function sendStudentRunningLateEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  note?: string | null;
}): Promise<boolean> {
  return true;
}

export function formatRunningLateSlotLabel(startsAt: string, endsAt: string): string {
  return formatSlotRange(startsAt, endsAt);
}

export async function sendBookingCancellationEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  cancelledBy: "tutor" | "parent";
}): Promise<boolean> {
  const subject = `Lesson cancelled: ${input.slotLabel} with ${input.tutorName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #dc2626; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Lesson Cancelled</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        ${
          input.cancelledBy === "parent"
            ? `You have successfully cancelled the scheduled lesson for <strong>${input.studentName || "GCSE Student"}</strong>.`
            : `Your scheduled lesson for <strong>${input.studentName || "GCSE Student"}</strong> has been cancelled by the tutor, <strong>${input.tutorName}</strong>.`
        }
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; font-family: sans-serif;">
          ${input.slotLabel}
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 8px 0 0 0; font-family: sans-serif;">
          Tutor: ${input.tutorName}
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        If you believe this is an error or would like to reschedule, please contact your tutor directly.
      </p>
    </div>
  `;
  return sendResendEmail({ to: input.to, subject, html });
}

export async function sendTutorCancellationEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  slotLabel: string;
  parentEmail: string;
}): Promise<boolean> {
  const subject = `Lesson cancelled by parent: ${input.slotLabel}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #dc2626; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Lesson Cancelled by Parent</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        A lesson booking has been cancelled by the parent (${input.parentEmail}).
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; font-family: sans-serif;">
          ${input.slotLabel}
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 8px 0 0 0; font-family: sans-serif;">
          Student: ${input.studentName || "GCSE Student"}
        </p>
      </div>
      
      <p style="font-size: 14px; color: #475569; text-align: center; font-family: sans-serif;">
        The hour slot has been automatically reopened on your public calendar and other families subscribed to slot alerts have been notified.
      </p>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
    </div>
  `;
  return sendResendEmail({ to: input.to, subject, html });
}

export async function sendBookingMovedEmail(input: {
  to: string;
  tutorName: string;
  studentName: string | null;
  oldSlotLabel: string;
  newSlotLabel: string;
}): Promise<boolean> {
  const subject = `Lesson rescheduled: ${input.newSlotLabel} with ${input.tutorName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #2563eb; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Lesson Rescheduled</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        Your scheduled lesson for <strong>${input.studentName || "GCSE Student"}</strong> with <strong>${input.tutorName}</strong> has been moved to a new time.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 100px;">Old Time:</td>
            <td style="padding: 6px 0; color: #0f172a; text-decoration: line-through;">${input.oldSlotLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">New Time:</td>
            <td style="padding: 6px 0; color: #2563eb; font-weight: 700;">${input.newSlotLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Tutor:</td>
            <td style="padding: 6px 0; color: #0f172a;">${input.tutorName}</td>
          </tr>
        </table>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        If you have any questions or this new time does not work for you, please contact your tutor directly to coordinate.
      </p>
    </div>
  `;
  return sendResendEmail({ to: input.to, subject, html });
}

export async function sendNewMessageEmail(input: {
  to: string;
  senderName: string;
  messageContent: string;
  actionUrl: string;
}): Promise<boolean> {
  const subject = `New message from ${input.senderName} on Yazzow`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #446152; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">New Message Received</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        You have received a new message from <strong>${input.senderName}</strong>.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px; font-family: sans-serif; font-style: italic; color: #334155; line-height: 1.5; font-size: 14px;">
        &ldquo;${input.messageContent}&rdquo;
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${input.actionUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Reply on Yazzow</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        Please do not reply directly to this email. Click the button above to view and reply on your portal.
      </p>
    </div>
  `;
  return sendResendEmail({ to: input.to, subject, html });
}

export async function sendResourcePurchaseEmail(input: {
  to: string;
  tutorName: string;
  resourceTitle: string;
  downloadUrl: string;
}): Promise<boolean> {
  const subject = `Your digital download: ${input.resourceTitle} from ${input.tutorName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #3b82f6; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 8px; text-align: center; font-family: sans-serif;">Your Purchase is Ready!</h2>
      <p style="font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        Thank you for purchasing <strong>${input.resourceTitle}</strong> from ${input.tutorName}.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${input.downloadUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #3b82f6; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 10px rgba(59,130,246,0.3); font-family: sans-serif;">
          Download Worksheet Pack
        </a>
      </div>
      
      <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; font-family: sans-serif;">
        If the button above does not work, copy and paste this URL into your browser:<br />
        <a href="${input.downloadUrl}" style="color: #3b82f6; text-decoration: underline;">${input.downloadUrl}</a>
      </p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="font-size: 11px; text-align: center; color: #94a3b8; margin: 0; font-family: sans-serif;">
        This is an automated purchase delivery from Yazzow. All storefront purchases are digital files and strictly non-refundable.
      </p>
    </div>
  `;

  return sendResendEmail({
    to: input.to,
    subject,
    html,
  });
}

