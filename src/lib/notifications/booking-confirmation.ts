import "server-only";

import { sendResendEmail } from "@/lib/notifications/auth-email";
import { formatSlotRange, formatMoney } from "@/lib/format";
import { PUBLIC_SITE_URL } from "@/lib/constants";

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
  paymentInstructions?: string | null;
  status?: string;
  isApprovedNotice?: boolean;
}): Promise<boolean> {
  const recipient = input.to || input.parentEmail;
  if (!recipient) return false;

  const starts = input.startsAt || input.slotStartsAt;
  const ends = input.endsAt || input.slotEndsAt;
  if (!starts || !ends) return false;

  const slotLabel = formatSlotRange(starts, ends);
  const formattedAmount = formatMoney(input.amountCents, input.currency);
  const workspaceUrl = `${PUBLIC_SITE_URL}/tutor/${input.tutorUsername}/workspace`;

  const subject = `Booking Confirmed: Lesson with ${input.tutorName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #446152; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Booking Confirmed!</h2>
      
      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        Your lesson booking with <strong>${input.tutorName}</strong> is confirmed.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-family: sans-serif;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Lesson Time</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${slotLabel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Student</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${input.studentName || "GCSE Student"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Amount Paid</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${formattedAmount}</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${workspaceUrl}" style="background-color: #446152; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; display: inline-block; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(68, 97, 82, 0.15); font-family: sans-serif;">Open Student Workspace</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
        To view your schedule, lesson records, or message your tutor, click the button above to access your student classroom workspace.
      </p>
    </div>
  `;
  return sendResendEmail({ to: recipient, subject, html });
}
