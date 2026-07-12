import type { TutorProfile } from "@/lib/types";
import type { TutorProfileRow } from "@/lib/supabase/database.types";

export function rowToTutorProfile(row: TutorProfileRow): TutorProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    coverUrl: row.cover_url ?? undefined,
    portalWelcomeMessage: row.portal_welcome_message ?? undefined,
    portalAccentOklch: row.portal_accent_oklch ?? undefined,
    lessonPriceCents: row.lesson_price_cents,
    currency: row.currency,
    blockPackageLessonsCount: (row as any).block_package_lessons_count ?? 10,
    blockPackageDiscountPercent: (row as any).block_package_discount_percent ?? 10,
    isPlatformAdmin: row.is_platform_admin === true,
    allowPublicJoining: (row as any).allow_public_joining !== false,
    allowCashPayments: (row as any).allow_cash_payments !== false,
    paymentInstructions: (row as any).payment_instructions ?? "",
    portalAnnouncement: row.portal_announcement ?? "",
    portalAnnouncementActive: row.portal_announcement_active === true,
    portalAnnouncementUpdatedAt: row.portal_announcement_updated_at ?? undefined,
    portalAnnouncementDurationHours: row.portal_announcement_duration_hours ?? undefined,
    paymentReminderAmountThresholdCents: (row as any).payment_reminder_amount_threshold_cents ?? 0,
    paymentReminderDaysAfter: (row as any).payment_reminder_days_after ?? 0,
    portalBgStyle: row.portal_bg_style ?? "grid",
    portalSideBannerUrl: row.portal_side_banner_url ?? undefined,
    portalSideBannerLink: row.portal_side_banner_link ?? undefined,
    portalSideWidgetTitle: row.portal_side_widget_title ?? undefined,
    portalSideWidgetContent: row.portal_side_widget_content ?? undefined,
    automatedLessonReminders: (row as any).automated_lesson_reminders === true,
    country: (row as any).country ?? "",
    bankName: (row as any).bank_name ?? "",
    bankSortCode: (row as any).bank_sort_code ?? "",
    bankAccountNumber: (row as any).bank_account_number ?? "",
    isBanned: row.is_banned === true,
    meetingLink: (row as any).meeting_link ?? "",
    sendMeetingLinks: (row as any).send_meeting_links !== false,
    parentAcademyId: (row as any).parent_academy_id ?? undefined,
    role: (row as any).role ?? "independent",
    academyId: (row as any).academy_id ?? undefined,
    businessLogoUrl: (row as any).business_logo_url ?? undefined,
    primaryBrandColor: (row as any).primary_brand_color ?? undefined,
    businessName: (row as any).business_name ?? undefined,
  };
}

export function slugifyUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(username) && username.length >= 3;
}

const SWEAR_WORDS = new Set([
  "fuck", "fucking", "fucker", "shit", "shitting", "shitter",
  "bitch", "cunt", "asshole", "pussy", "dick", "bastard",
  "wanker", "twat", "cock", "bollocks", "motherfucker"
]);

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  // Normalize text: lowercase, remove special characters/spaces to catch bypassed spellings (e.g. f-u-c-k)
  const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  for (const word of SWEAR_WORDS) {
    if (normalized.includes(word)) {
      return true;
    }
  }

  // Split by whitespace and check individual words
  const words = text.toLowerCase().split(/\s+/);
  for (const w of words) {
    const cleanWord = w.replace(/[^a-z0-9]/g, "");
    if (SWEAR_WORDS.has(cleanWord)) {
      return true;
    }
  }

  return false;
}

