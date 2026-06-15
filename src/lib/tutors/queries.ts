import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { rowToTutorProfile } from "@/lib/tutors/utils";
import type { TutorProfile } from "@/lib/types";

export async function getTutorByUsername(
  username: string,
): Promise<TutorProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      // Table missing or not migrated yet
      return null;
    }
    if (!data) return null;
    return rowToTutorProfile(data as TutorProfileRow);
  } catch (err) {
    console.warn(`[getTutorByUsername] Offline or paused database fallback for username: ${username}`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getTutorProfileForUser(
  userId: string,
): Promise<TutorProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return rowToTutorProfile(data as TutorProfileRow);
  } catch (err) {
    console.warn(`[getTutorProfileForUser] Offline database fallback for userId: ${userId}`);
    return null;
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (error) return false;
    return !data;
  } catch (err) {
    console.warn("[isUsernameAvailable] Offline check, assuming username is available");
    return true;
  }
}

export type CreateTutorProfileInput = {
  id: string;
  username: string;
  displayName: string;
  headline?: string;
  bio?: string;
  lessonPriceCents?: number;
};

export async function createTutorProfile(
  input: CreateTutorProfileInput,
): Promise<{ ok: true; profile: TutorProfile } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutor_profiles")
      .insert({
        id: input.id,
        username: input.username,
        display_name: input.displayName,
        headline: input.headline ?? null,
        bio: input.bio ?? null,
        lesson_price_cents: input.lessonPriceCents ?? 4500,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Could not create profile." };
    }

    return { ok: true, profile: rowToTutorProfile(data as TutorProfileRow) };
  } catch (err) {
    return { ok: false, error: "Database offline. Could not create profile." };
  }
}
