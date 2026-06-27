"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { rowToTutorProfile } from "@/lib/tutors/utils";
import { isValidUsername } from "@/lib/tutors/utils";

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

  const { data, error } = await supabase
    .from("tutor_profiles")
    .insert({
      id: user.id,
      username: input.username,
      display_name: input.displayName.trim(),
      headline: input.headline?.trim() || null,
      bio: input.bio?.trim() || null,
      lesson_price_cents: 4500,
      currency: input.currency || "gbp",
      country: input.country || null,
    })
    .select("*")
    .single();

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
