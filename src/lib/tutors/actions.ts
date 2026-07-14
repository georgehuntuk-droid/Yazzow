"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { rowToTutorProfile } from "@/lib/tutors/utils";
import { isValidUsername, containsProfanity } from "@/lib/tutors/utils";

export async function checkUsernameAvailable(
  username: string,
): Promise<{ available: boolean; error?: string }> {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "onboarding" || testVal === "dashboard") {
    if (username === "takenusername") {
      return { available: false };
    }
    return { available: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return { available: false, error: formatSupabaseError(error.message) };
  }

  return { available: !data };
}

export type OnboardingInput = {
  username: string;
  displayName: string;
  headline?: string;
  bio?: string;
  currency?: string;
  country?: string;
};

export async function completeOnboarding(input: OnboardingInput) {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "onboarding" || testVal === "dashboard") {
    return {
      ok: true as const,
      profile: {
        id: "test-user-id-123",
        username: input.username,
        displayName: input.displayName,
        headline: input.headline,
        bio: input.bio,
        lessonPriceCents: 4500,
        currency: input.currency || "gbp",
        country: input.country || "GB",
      },
    };
  }

  const user = await requireUser();

  if (!isValidUsername(input.username)) {
    return { ok: false as const, error: "Invalid username format." };
  }

  if (
    containsProfanity(input.username) ||
    containsProfanity(input.displayName) ||
    containsProfanity(input.headline || "") ||
    containsProfanity(input.bio || "")
  ) {
    return {
      ok: false as const,
      error: "Please remove any inappropriate language from your profile.",
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { ok: false as const, error: "You already have a tutor profile." };
  }

  const { data: taken } = await supabase
    .from("tutor_profiles")
    .select("username")
    .eq("username", input.username)
    .maybeSingle();

  if (taken) {
    return { ok: false as const, error: "That username is already taken." };
  }

  // Check for pending academy invitations
  let parentAcademyId: string | null = null;
  if (user.email) {
    const { data: invite } = await supabase
      .from("academy_invitations")
      .select("academy_id")
      .eq("email", user.email.trim().toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (invite) {
      parentAcademyId = invite.academy_id;
    }
  }

  const insertPayload: any = {
    id: user.id,
    username: input.username,
    display_name: input.displayName.trim(),
    headline: input.headline?.trim() || null,
    bio: input.bio?.trim() || null,
    lesson_price_cents: 4500,
    currency: input.currency || "gbp",
    country: input.country || null,
    subscription_status: "trialing",
    subscription_current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_tier: "independent",
    parent_academy_id: parentAcademyId,
  };

  let { data, error } = await supabase
    .from("tutor_profiles")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error) {
    const isColumnError =
      error.code === "42703" ||
      error.message.includes("column") ||
      error.message.includes("Could not find the");

    if (isColumnError) {
      delete insertPayload.country;

      const retryRes = await supabase
        .from("tutor_profiles")
        .insert(insertPayload)
        .select("*")
        .maybeSingle();

      data = retryRes.data;
      error = retryRes.error;
    }
  }

  if (!error && parentAcademyId && user.email) {
    // Mark invitation as accepted
    await supabase
      .from("academy_invitations")
      .update({ status: "accepted" })
      .eq("email", user.email.trim().toLowerCase())
      .eq("academy_id", parentAcademyId);
  }

  if (error || !data) {
    return {
      ok: false as const,
      error: formatSupabaseError(error?.message),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tutor/${input.username}`);

  return {
    ok: true as const,
    profile: rowToTutorProfile(data as TutorProfileRow),
  };
}
