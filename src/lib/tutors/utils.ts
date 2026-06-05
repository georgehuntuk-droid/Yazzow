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
