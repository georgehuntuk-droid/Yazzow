/** Platform branding — always "Yazzow" (capital Y). */
export const BRAND_NAME = "Yazzow" as const;

export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://yazzow.com";

export const PLATFORM_FEES = {
  /** Lesson bookings: 2% platform fee; remainder to tutor via Stripe Connect. */
  lessonBookingPercent: 2,
  /** Digital worksheet packs: 5% platform fee. */
  digitalGoodsPercent: 5,
} as const;

export const TUTOR_PUBLIC_PATH = "/tutor" as const;

export const SUPPORTED_CURRENCIES = ["gbp", "usd", "eur"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const LESSON_PRICE_LIMITS = {
  minCents: 500,
  maxCents: 999_00,
} as const;

export function publicSiteHost(): string {
  try {
    return new URL(PUBLIC_SITE_URL).host;
  } catch {
    return "yazzow.com";
  }
}

export function tutorPublicUrl(username: string): string {
  return `${PUBLIC_SITE_URL}${TUTOR_PUBLIC_PATH}/${username}`;
}
