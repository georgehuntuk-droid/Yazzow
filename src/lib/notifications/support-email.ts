import "server-only";

import { BRAND_NAME, publicSiteHost } from "@/lib/constants";

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Something broken",
  billing: "Payments & billing",
  account: "Account & login",
  feature: "Feature request",
  other: "General",
};

export type SupportTicketPayload = {
  name: string;
  email: string;
  category: string;
  message: string;
  source?: string;
};

/** Where support form submissions are delivered (e.g. support@yazzow.com). */
export function getSupportInboxEmail(): string {
  const configured = process.env.SUPPORT_INBOX_EMAIL?.trim();
  if (configured) return configured;
  return `support@${publicSiteHost()}`;
}

export function isSupportEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getSupportInboxEmail());
}

export async function sendSupportTicketEmail(
  payload: SupportTicketPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Support email is not configured yet (missing RESEND_API_KEY).");
  }

  const inbox = getSupportInboxEmail();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? `${BRAND_NAME} <noreply@${publicSiteHost()}>`;
  const categoryLabel = CATEGORY_LABELS[payload.category] ?? payload.category;
  const source = payload.source?.trim() || "support page";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: inbox,
      reply_to: payload.email,
      subject: `[${BRAND_NAME} support] ${categoryLabel} — ${payload.name}`,
      html: `
        <p><strong>New support message</strong> (${escapeHtml(source)})</p>
        <p><strong>From:</strong> ${escapeHtml(payload.name)} &lt;${escapeHtml(payload.email)}&gt;</p>
        <p><strong>Category:</strong> ${escapeHtml(categoryLabel)}</p>
        <hr />
        <p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>
        <hr />
        <p style="color:#666;font-size:12px">Reply to this email to respond directly to the customer.</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not send support email (${response.status}).`);
  }
}

export async function sendSupportTicketConfirmationEmail(
  payload: SupportTicketPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const inbox = getSupportInboxEmail();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? `${BRAND_NAME} <support@${publicSiteHost()}>`;
  const categoryLabel = CATEGORY_LABELS[payload.category] ?? payload.category;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      reply_to: inbox,
      subject: `[Yazzow Support] Ticket Received: ${categoryLabel}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
          <!-- Logo Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Support Ticket Received</h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; text-align: center; font-family: sans-serif;">
            Hi ${escapeHtml(payload.name)}, thanks for reaching out to Yazzow! We have received your support ticket and our team is looking into it.
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0; font-family: sans-serif;">
              Ticket Details:
            </p>
            <p style="font-size: 13px; color: #475569; margin: 0 0 6px 0; font-family: sans-serif;">
              <strong>Category:</strong> ${escapeHtml(categoryLabel)}
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
            <p style="font-size: 13px; color: #475569; margin: 0; white-space: pre-wrap; font-family: sans-serif;">
              ${escapeHtml(payload.message)}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #475569; text-align: center; font-family: sans-serif;">
            You can reply directly to this email if you need to add any additional details.
          </p>
          
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5; margin: 0; font-family: sans-serif;">
            This is an automated confirmation of your request.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    console.error(`[sendSupportTicketConfirmationEmail] Failed to send confirmation email (${response.status}).`);
  }
}

export async function sendSupportTicketReplyEmail(payload: {
  ticketId: string;
  name: string;
  email: string;
  category: string;
  originalMessage: string;
  replyMessage: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Support email is not configured yet (missing RESEND_API_KEY).");
  }

  const inbox = getSupportInboxEmail();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? `${BRAND_NAME} Support <support@${publicSiteHost()}>`;
  const categoryLabel = CATEGORY_LABELS[payload.category] ?? payload.category;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      reply_to: inbox,
      subject: `Re: [Yazzow Support] Ticket #${payload.ticketId.slice(0, 8)} - ${categoryLabel}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
          <!-- Logo Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Support Update</h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; font-family: sans-serif;">
            Hi ${escapeHtml(payload.name)},
          </p>
          
          <div style="font-size: 15px; line-height: 1.6; color: #0f172a; font-family: sans-serif; white-space: pre-wrap; margin-bottom: 24px; padding: 4px 0;">
${escapeHtml(payload.replyMessage)}
          </div>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px;">
            <p style="font-size: 13px; font-weight: 700; color: #475569; margin: 0 0 10px 0; font-family: sans-serif;">
              Original Request (Ticket #${payload.ticketId.slice(0, 8)}):
            </p>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; font-family: sans-serif;">
              <strong>Category:</strong> ${escapeHtml(categoryLabel)}
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
            <p style="font-size: 12px; color: #64748b; margin: 0; white-space: pre-wrap; font-family: sans-serif;">
              ${escapeHtml(payload.originalMessage)}
            </p>
          </div>
          
          <p style="font-size: 13px; color: #94a3b8; text-align: center; font-family: sans-serif; margin-top: 32px;">
            You can reply directly to this email if you have any follow-up questions.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send support reply email (${response.status}).`);
  }
}

export async function sendAdminDirectMessageEmail(payload: {
  recipientName: string;
  recipientEmail: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Support email is not configured yet (missing RESEND_API_KEY).");
  }

  const inbox = getSupportInboxEmail();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ?? `${BRAND_NAME} Support <support@${publicSiteHost()}>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.recipientEmail,
      reply_to: inbox,
      subject: `[${BRAND_NAME} Support] Message from Platform Support`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
          <!-- Logo Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 900; color: #446152; letter-spacing: -0.5px; font-family: sans-serif;">yazzow</span>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center; font-family: sans-serif;">Support Update</h2>
          
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; font-family: sans-serif;">
            Hi ${escapeHtml(payload.recipientName)},
          </p>
          
          <div style="font-size: 15px; line-height: 1.6; color: #0f172a; font-family: sans-serif; white-space: pre-wrap; margin-bottom: 24px; padding: 4px 0;">
${escapeHtml(payload.message)}
          </div>
          
          <p style="font-size: 13px; color: #94a3b8; text-align: center; font-family: sans-serif; margin-top: 32px;">
            You can reply directly to this email to contact our support team.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send support message email (${response.status}).`);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
