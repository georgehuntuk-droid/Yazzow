import "server-only";

import { BRAND_NAME, publicSiteHost } from "@/lib/constants";

/** Resend "from" address — must use your verified domain in Resend. */
export function getResendFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;
  return `${BRAND_NAME} <bookings@${publicSiteHost()}>`;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
