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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
