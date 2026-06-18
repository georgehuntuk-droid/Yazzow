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
