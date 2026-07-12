import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { TutorProfileRow } from "@/lib/supabase/database.types";
import { rowToTutorProfile } from "@/lib/tutors/utils";
import type { TutorProfile, TutorPackage } from "@/lib/types";

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

    const profileData = { ...data };
    if (profileData.parent_academy_id) {
      const { data: parentData } = await supabase
        .from("tutor_profiles")
        .select("portal_accent_oklch, portal_bg_style, portal_side_banner_url, portal_side_banner_link, portal_side_widget_title, portal_side_widget_content, portal_announcement, portal_announcement_active, portal_announcement_updated_at, portal_announcement_duration_hours")
        .eq("id", profileData.parent_academy_id)
        .maybeSingle();

      if (parentData) {
        profileData.portal_accent_oklch = parentData.portal_accent_oklch ?? profileData.portal_accent_oklch;
        profileData.portal_bg_style = parentData.portal_bg_style ?? profileData.portal_bg_style;
        profileData.portal_side_banner_url = parentData.portal_side_banner_url ?? profileData.portal_side_banner_url;
        profileData.portal_side_banner_link = parentData.portal_side_banner_link ?? profileData.portal_side_banner_link;
        profileData.portal_side_widget_title = parentData.portal_side_widget_title ?? profileData.portal_side_widget_title;
        profileData.portal_side_widget_content = parentData.portal_side_widget_content ?? profileData.portal_side_widget_content;
        profileData.portal_announcement = parentData.portal_announcement ?? profileData.portal_announcement;
        profileData.portal_announcement_active = parentData.portal_announcement_active ?? profileData.portal_announcement_active;
        profileData.portal_announcement_updated_at = parentData.portal_announcement_updated_at ?? profileData.portal_announcement_updated_at;
        profileData.portal_announcement_duration_hours = parentData.portal_announcement_duration_hours ?? profileData.portal_announcement_duration_hours;
      }
    }

    return rowToTutorProfile(profileData as TutorProfileRow);
  } catch (err) {
    console.warn(`[getTutorByUsername] Offline or paused database fallback for username: ${username}`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getTutorProfileForUser(
  userId: string,
): Promise<TutorProfile | null> {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (
    testVal === "dashboard" ||
    testVal === "unsubscribed" ||
    testVal === "trialing-active" ||
    testVal === "trialing-expired"
  ) {
    return {
      id: "test-user-id-123",
      username: "testtutor",
      displayName: "Test Tutor",
      headline: "Math Specialist",
      bio: "GCSE math tutor with 10 years experience",
      lessonPriceCents: 4500,
      currency: "gbp",
    };
  }
  if (testVal === "onboarding") {
    return null;
  }

  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutor_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const profileData = { ...data };
    if (profileData.parent_academy_id) {
      const { data: parentData } = await supabase
        .from("tutor_profiles")
        .select("portal_accent_oklch, portal_bg_style, portal_side_banner_url, portal_side_banner_link, portal_side_widget_title, portal_side_widget_content, portal_announcement, portal_announcement_active, portal_announcement_updated_at, portal_announcement_duration_hours")
        .eq("id", profileData.parent_academy_id)
        .maybeSingle();

      if (parentData) {
        profileData.portal_accent_oklch = parentData.portal_accent_oklch ?? profileData.portal_accent_oklch;
        profileData.portal_bg_style = parentData.portal_bg_style ?? profileData.portal_bg_style;
        profileData.portal_side_banner_url = parentData.portal_side_banner_url ?? profileData.portal_side_banner_url;
        profileData.portal_side_banner_link = parentData.portal_side_banner_link ?? profileData.portal_side_banner_link;
        profileData.portal_side_widget_title = parentData.portal_side_widget_title ?? profileData.portal_side_widget_title;
        profileData.portal_side_widget_content = parentData.portal_side_widget_content ?? profileData.portal_side_widget_content;
        profileData.portal_announcement = parentData.portal_announcement ?? profileData.portal_announcement;
        profileData.portal_announcement_active = parentData.portal_announcement_active ?? profileData.portal_announcement_active;
        profileData.portal_announcement_updated_at = parentData.portal_announcement_updated_at ?? profileData.portal_announcement_updated_at;
        profileData.portal_announcement_duration_hours = parentData.portal_announcement_duration_hours ?? profileData.portal_announcement_duration_hours;
      }
    }

    return rowToTutorProfile(profileData as TutorProfileRow);
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

export async function getPackagesForTutor(tutorId: string): Promise<TutorPackage[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tutor_packages")
      .select("*")
      .eq("tutor_id", tutorId)
      .order("lessons_count", { ascending: true });

    if (error || !data) return [];
    
    return data.map((row: any) => ({
      id: row.id,
      tutorId: row.tutor_id,
      name: row.name,
      lessonsCount: row.lessons_count,
      priceCents: row.price_cents,
      currency: row.currency,
      isActive: row.is_active,
    }));
  } catch (err) {
    console.warn(`[getPackagesForTutor] Failed to fetch packages for tutorId: ${tutorId}`, err);
    return [];
  }
}

export type OnboardingProgress = {
  isProfileCustomized: boolean;
  isScheduleSetup: boolean;
  isStripeConnected: boolean;
  isStorefrontSetup: boolean;
  totalSteps: number;
  completedSteps: number;
};

export async function getTutorOnboardingStatus(
  tutorId: string,
): Promise<OnboardingProgress> {
  const cookieStore = await cookies();
  const testVal = cookieStore.get("yazzow-test-session")?.value;
  if (testVal === "dashboard" || testVal === "trialing-active" || testVal === "trialing-expired") {
    return {
      isProfileCustomized: true,
      isScheduleSetup: true,
      isStripeConnected: false,
      isStorefrontSetup: false,
      totalSteps: 4,
      completedSteps: 2,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      isProfileCustomized: false,
      isScheduleSetup: false,
      isStripeConnected: false,
      isStorefrontSetup: false,
      totalSteps: 4,
      completedSteps: 0,
    };
  }

  try {
    const supabase = await createClient();

    // Query profile details
    const { data: profile } = await supabase
      .from("tutor_profiles")
      .select("bio, avatar_url, stripe_account_id")
      .eq("id", tutorId)
      .maybeSingle();

    // Query availability slot count
    const { count: slotsCount } = await supabase
      .from("availability_slots")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId);

    // Query storefront digital resources count
    const { count: resourcesCount } = await supabase
      .from("digital_resources")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId);

    const isProfileCustomized = !!(profile?.bio && profile.bio.trim().length > 0) || !!profile?.avatar_url;
    const isScheduleSetup = (slotsCount ?? 0) > 0;
    const isStripeConnected = !!profile?.stripe_account_id;
    const isStorefrontSetup = (resourcesCount ?? 0) > 0;

    const completedSteps = [
      isProfileCustomized,
      isScheduleSetup,
      isStripeConnected,
      isStorefrontSetup,
    ].filter(Boolean).length;

    return {
      isProfileCustomized,
      isScheduleSetup,
      isStripeConnected,
      isStorefrontSetup,
      totalSteps: 4,
      completedSteps,
    };
  } catch (err) {
    console.error("Error in getTutorOnboardingStatus:", err);
    return {
      isProfileCustomized: false,
      isScheduleSetup: false,
      isStripeConnected: false,
      isStorefrontSetup: false,
      totalSteps: 4,
      completedSteps: 0,
    };
  }
}


