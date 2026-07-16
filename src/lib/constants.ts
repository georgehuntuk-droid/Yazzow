/** Platform branding — always "Yazzow" (capital Y). */
export const BRAND_NAME = "Yazzow" as const;

/** Built-in platform owners — always admin even if PLATFORM_ADMIN_EMAILS is unset on Vercel. */
export const PLATFORM_OWNER_EMAILS = [
  "george.huntuk@gmail.com",
] as const;

/** Tutor portal usernames that always have platform admin access. */
export const PLATFORM_OWNER_USERNAMES = [] as const;

/** Auth user IDs that always have platform admin access (production Supabase project). */
export const PLATFORM_OWNER_USER_IDS = [] as const;

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const PUBLIC_SITE_URL =
  rawSiteUrl && rawSiteUrl !== ""
    ? (rawSiteUrl.includes("yazzow.com") && !rawSiteUrl.includes("www.yazzow.com")
        ? rawSiteUrl.replace("yazzow.com", "www.yazzow.com")
        : rawSiteUrl)
    : "https://www.yazzow.com";

/** Subscription tiers mapping for tutors based on features. */
export const SUBSCRIPTION_TIERS = {
  starter: {
    id: "starter",
    name: "Starter",
    maxStudents: 10,
    amountCents: 1000,
    priceLabel: "£10/mo",
    description: "Up to 10 active students, bookings, automated reminders, and the Cancellation Filler.",
    stripePriceId: process.env.STRIPE_PRICE_STARTER?.trim() || "",
  },
  growth: {
    id: "growth",
    name: "Growth",
    maxStudents: 25,
    amountCents: 2500,
    priceLabel: "£25/mo",
    description: "Up to 25 active students, bookings, automated reminders, and the Cancellation Filler.",
    stripePriceId: process.env.STRIPE_PRICE_GROWTH?.trim() || "",
  },
  academy: {
    id: "academy",
    name: "The Academy",
    maxStudents: null, // Unlimited students
    amountCents: 5000,
    priceLabel: "£50/mo",
    description: "Unlimited active students, Multi-Tutor Management (up to 5 staff accounts), and Custom Branding.",
    stripePriceId: process.env.STRIPE_PRICE_ACADEMY?.trim() || "",
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;

/** Tutor SaaS plan — billed to the tutor (Stripe Billing on the platform account). */
export const TUTOR_SUBSCRIPTION = {
  amountCents: 1999,
  currency: "gbp",
  interval: "month" as const,
  label: "£19.99/month",
} as const;

/** Per-sale platform cut (0 = subscription-only monetization). */
export const PLATFORM_FEES = {
  digitalGoodsPercent: 0,
} as const;

/** When false, packs are listed on the portal only — tutors sell them outside Yazzow. */
export const DIGITAL_PACK_IN_APP_CHECKOUT = true;

export const TUTOR_PUBLIC_PATH = "/tutor" as const;

export const SUPPORTED_CURRENCIES = [
  "gbp", "usd", "eur", "cad", "aud", "nzd", "jpy", "sgd", "hkd", "chf", "inr", "zar", "aed", "cny", "sek"
] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const LESSON_PRICE_LIMITS = {
  minCents: 500,
  maxCents: 999_00,
} as const;

/** Each bookable lesson slot is exactly one hour. */
export const LESSON_SLOT_DURATION_MINUTES = 60;

export const MAX_AVAILABILITY_BLOCK_HOURS = 12;

/** Tutor portal accent presets (OKLCH — applied on public /tutor/[username] pages). */
export const PORTAL_ACCENT_PRESETS = [
  { id: "violet", label: "Classic violet", oklch: "oklch(0.42 0.15 286)" },
  { id: "teal", label: "Calm teal", oklch: "oklch(0.45 0.12 195)" },
  { id: "rose", label: "Warm rose", oklch: "oklch(0.52 0.14 15)" },
  { id: "amber", label: "Golden amber", oklch: "oklch(0.62 0.14 75)" },
  { id: "forest", label: "Forest green", oklch: "oklch(0.45 0.1 155)" },
  { id: "slate", label: "Professional slate", oklch: "oklch(0.4 0.03 260)" },
] as const;

export const DEFAULT_PORTAL_ACCENT = PORTAL_ACCENT_PRESETS[0].oklch;

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
