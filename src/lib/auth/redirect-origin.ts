import "server-only";

import { headers } from "next/headers";

import { PUBLIC_SITE_URL } from "@/lib/constants";

function isLocalHost(host: string): boolean {
  const lower = host.toLowerCase();
  return lower.includes("localhost") || lower.startsWith("127.0.0.1");
}

function configuredSiteOrigin(): string {
  return PUBLIC_SITE_URL.replace(/\/$/, "");
}

/** Origin used in Supabase email links — must match dashboard redirect allow list. */
export async function getAuthRedirectOrigin(): Promise<string> {
  const configured = configuredSiteOrigin();
  const configuredIsProduction =
    configured.startsWith("https://") && !isLocalHost(new URL(configured).host);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (host) {
    const requestOrigin = `${proto}://${host}`;

    // Production deploy: never put localhost in confirmation emails.
    if (configuredIsProduction && isLocalHost(host)) {
      return configured;
    }

    return requestOrigin;
  }

  return configured;
}

export function authConfirmUrl(origin: string, nextPath: string): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}
