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
    portalAnnouncement: (row as any).portal_announcement ?? "",
    portalAnnouncementActive: (row as any).portal_announcement_active === true,
    paymentReminderAmountThresholdCents: (row as any).payment_reminder_amount_threshold_cents ?? 0,
    paymentReminderDaysAfter: (row as any).payment_reminder_days_after ?? 0,
    portalBgStyle: row.portal_bg_style ?? "grid",
    portalSideBannerUrl: row.portal_side_banner_url ?? undefined,
    portalSideBannerLink: row.portal_side_banner_link ?? undefined,
    portalSideWidgetTitle: row.portal_side_widget_title ?? undefined,
    portalSideWidgetContent: row.portal_side_widget_content ?? undefined,
    automatedLessonReminders: (row as any).automated_lesson_reminders === true,
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
