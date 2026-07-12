import "server-only";

import { sendResendEmail } from "@/lib/notifications/auth-email";

export async function sendLessonReportEmail(input: {
  to: string;
  tutorName: string;
  studentName: string;
  feedbackText: string;
  businessName: string;
}): Promise<boolean> {
  const subject = `Progress Report: Lesson feedback for ${input.studentName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
      <!-- Logo Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">${input.businessName.toLowerCase()}</span>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 800; color: #446152; margin-top: 0; margin-bottom: 8px; text-align: center; font-family: sans-serif;">Lesson Progress Report</h2>
      <p style="font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
        Feedback from your lesson with <strong>${input.tutorName}</strong>.
      </p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-family: sans-serif; color: #334155; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">${input.feedbackText}</div>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      
      <p style="font-size: 11px; text-align: center; color: #94a3b8; margin: 0; font-family: sans-serif;">
        This progress report was reviewed and approved by the management at ${input.businessName}.
      </p>
    </div>
  `;

  try {
    return await sendResendEmail({
      to: input.to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send lesson report email:", err);
    return false;
  }
}
