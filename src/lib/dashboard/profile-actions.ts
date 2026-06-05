"use server";

import { revalidatePath } from "next/cache";

import { requireTutorProfile } from "@/lib/auth/session";
import {
  LESSON_PRICE_LIMITS,
  PORTAL_ACCENT_PRESETS,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/constants";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_BUCKET,
  getPublicStorageUrl,
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  storagePathFromPublicUrl,
} from "@/lib/supabase/storage";
import { removeTutorFiles, uploadTutorFile } from "@/lib/supabase/tutor-storage";
import { isValidUsername, slugifyUsername } from "@/lib/tutors/utils";

async function revalidatePortal(username: string, previousUsername?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  revalidatePath(`/tutor/${username}`);
  if (previousUsername && previousUsername !== username) {
    revalidatePath(`/tutor/${previousUsername}`);
  }
}

function parsePriceToCents(raw: string): number | null {
  const normalized = raw.replace(/[£$€,\s]/g, "");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function extForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

async function removeStorageObject(tutorId: string, path: string | null) {
  if (!path) return;
  await removeTutorFiles(tutorId, AVATAR_BUCKET, [path]);
}

export async function updatePortalProfile(input: {
  displayName: string;
  headline: string;
  bio: string;
  lessonPrice: string;
  currency: string;
}) {
  const { profile } = await requireTutorProfile();

  const displayName = input.displayName.trim();
  const headline = input.headline.trim();
  const bio = input.bio.trim();
  const lessonPriceCents = parsePriceToCents(input.lessonPrice);
  const currency = input.currency.toLowerCase() as SupportedCurrency;

  if (!displayName) {
    return { ok: false as const, error: "Display name is required." };
  }

  if (lessonPriceCents === null) {
    return { ok: false as const, error: "Enter a valid lesson price." };
  }

  if (
    lessonPriceCents < LESSON_PRICE_LIMITS.minCents ||
    lessonPriceCents > LESSON_PRICE_LIMITS.maxCents
  ) {
    return {
      ok: false as const,
      error: `Lesson price must be between ${LESSON_PRICE_LIMITS.minCents / 100} and ${LESSON_PRICE_LIMITS.maxCents / 100}.`,
    };
  }

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return { ok: false as const, error: "Unsupported currency." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      display_name: displayName,
      headline: headline || null,
      bio: bio || null,
      lesson_price_cents: lessonPriceCents,
      currency,
    })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidatePortal(profile.username);
  return { ok: true as const };
}

export async function updateBlockPackagePricing(input: {
  lessonsCount: number;
  discountPercent: number;
}) {
  const { profile } = await requireTutorProfile();

  if (input.lessonsCount < 2 || input.lessonsCount > 50) {
    return { ok: false as const, error: "Lessons package size must be between 2 and 50." };
  }

  if (input.discountPercent < 0 || input.discountPercent > 90) {
    return { ok: false as const, error: "Discount percent must be between 0% and 90%." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      block_package_lessons_count: input.lessonsCount,
      block_package_discount_percent: input.discountPercent,
    })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidatePortal(profile.username);
  return { ok: true as const };
}

export async function updatePortalStyle(input: {
  portalWelcomeMessage: string;
  portalAccentPresetId: string;
}) {
  const { profile } = await requireTutorProfile();

  const portalWelcomeMessage = input.portalWelcomeMessage.trim();
  const preset = PORTAL_ACCENT_PRESETS.find((p) => p.id === input.portalAccentPresetId);
  const portalAccentOklch = preset?.oklch ?? null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({
      portal_welcome_message: portalWelcomeMessage || null,
      portal_accent_oklch: portalAccentOklch,
    })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidatePortal(profile.username);
  return { ok: true as const };
}

export async function changePortalUsername(rawUsername: string) {
  const { profile } = await requireTutorProfile();
  const username = slugifyUsername(rawUsername);
  const previousUsername = profile.username;

  if (!isValidUsername(username)) {
    return {
      ok: false as const,
      error: "Username must be 3+ characters, lowercase letters, numbers, and hyphens only.",
    };
  }

  if (username === profile.username) {
    return { ok: true as const, username };
  }

  const supabase = await createClient();
  const { data: taken } = await supabase
    .from("tutor_profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (taken) {
    return { ok: false as const, error: "That portal link is already taken." };
  }

  const { error } = await supabase
    .from("tutor_profiles")
    .update({ username })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await revalidatePortal(username, previousUsername);
  return { ok: true as const, username };
}

export async function uploadPortalAvatar(formData: FormData) {
  const { profile } = await requireTutorProfile();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Choose a photo to upload." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "Photo must be 5 MB or smaller." };
  }

  if (!IMAGE_MIME_TYPES.has(file.type)) {
    return { ok: false as const, error: "Use JPG, PNG, WebP, or GIF." };
  }

  const ext = extForMime(file.type);
  const storagePath = `${profile.id}/avatar.${ext}`;
  const supabase = await createClient();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await uploadTutorFile({
    tutorId: profile.id,
    bucket: AVATAR_BUCKET,
    path: storagePath,
    bytes,
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    return { ok: false as const, error: formatSupabaseError(uploadError.message) };
  }

  const publicUrl = getPublicStorageUrl(AVATAR_BUCKET, storagePath);
  const oldPath = storagePathFromPublicUrl(AVATAR_BUCKET, profile.avatarUrl);

  const { error: updateError } = await supabase
    .from("tutor_profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", profile.id);

  if (updateError) {
    return { ok: false as const, error: formatSupabaseError(updateError.message) };
  }

  if (oldPath && oldPath !== storagePath) {
    await removeStorageObject(profile.id, oldPath);
  }

  await revalidatePortal(profile.username);
  return { ok: true as const, url: publicUrl };
}

export async function uploadPortalCover(formData: FormData) {
  const { profile } = await requireTutorProfile();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Choose a cover image to upload." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "Cover image must be 5 MB or smaller." };
  }

  if (!IMAGE_MIME_TYPES.has(file.type)) {
    return { ok: false as const, error: "Use JPG, PNG, WebP, or GIF." };
  }

  const ext = extForMime(file.type);
  const storagePath = `${profile.id}/cover.${ext}`;
  const supabase = await createClient();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await uploadTutorFile({
    tutorId: profile.id,
    bucket: AVATAR_BUCKET,
    path: storagePath,
    bytes,
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    return { ok: false as const, error: formatSupabaseError(uploadError.message) };
  }

  const publicUrl = getPublicStorageUrl(AVATAR_BUCKET, storagePath);
  const oldPath = storagePathFromPublicUrl(AVATAR_BUCKET, profile.coverUrl);

  const { error: updateError } = await supabase
    .from("tutor_profiles")
    .update({ cover_url: publicUrl })
    .eq("id", profile.id);

  if (updateError) {
    return { ok: false as const, error: formatSupabaseError(updateError.message) };
  }

  if (oldPath && oldPath !== storagePath) {
    await removeStorageObject(profile.id, oldPath);
  }

  await revalidatePortal(profile.username);
  return { ok: true as const, url: publicUrl };
}

export async function removePortalAvatar() {
  const { profile } = await requireTutorProfile();
  const path = storagePathFromPublicUrl(AVATAR_BUCKET, profile.avatarUrl);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({ avatar_url: null })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await removeStorageObject(profile.id, path);
  await revalidatePortal(profile.username);
  return { ok: true as const };
}

export async function removePortalCover() {
  const { profile } = await requireTutorProfile();
  const path = storagePathFromPublicUrl(AVATAR_BUCKET, profile.coverUrl);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_profiles")
    .update({ cover_url: null })
    .eq("id", profile.id);

  if (error) {
    return { ok: false as const, error: formatSupabaseError(error.message) };
  }

  await removeStorageObject(profile.id, path);
  await revalidatePortal(profile.username);
  return { ok: true as const };
}
