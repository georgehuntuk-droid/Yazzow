import "server-only";

import {
  PLATFORM_OWNER_EMAILS,
  PLATFORM_OWNER_USER_IDS,
  PLATFORM_OWNER_USERNAMES,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

type AdminUser = {
  id: string;
  email?: string | null;
};

type AdminProfile = {
  username: string;
  isPlatformAdmin?: boolean;
};

function parseAdminAllowlist(): string[] {
  const fromEnv =
    process.env.PLATFORM_ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().replace(/^["']|["']$/g, "").toLowerCase())
      .filter(Boolean) ?? [];

  const merged = new Set<string>([
    ...PLATFORM_OWNER_EMAILS.map((email) => email.toLowerCase()),
    ...fromEnv,
  ]);

  return [...merged];
}

import { cookies } from "next/headers";

/** Synchronous admin check using session user + tutor profile already loaded in layout. */
export function isPlatformAdminUser(
  user: AdminUser,
  profile?: AdminProfile | null,
): boolean {
  if ((PLATFORM_OWNER_USER_IDS as readonly string[]).includes(user.id)) {
    return true;
  }

  if (user.email) {
    const emailLower = user.email.toLowerCase();
    const allowlist = parseAdminAllowlist();
    if (
      allowlist.includes(emailLower) ||
      emailLower === "george.huntuk@gmail.com" ||
      emailLower === "george.huntuk@googlemail.com"
    ) {
      return true;
    }
  }

  if (
    profile?.username &&
    (PLATFORM_OWNER_USERNAMES as readonly string[]).includes(profile.username)
  ) {
    return true;
  }

  if (profile?.isPlatformAdmin === true) {
    return true;
  }

  return false;
}

export async function isPlatformAdmin(): Promise<boolean> {
  // 1. Check admin session cookie first
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("yazzow_admin_session")?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminPassword && adminSession && adminSession === adminPassword) {
      return true;
    }
  } catch {
    // ignore cookie failure in static rendering context
  }

  // 2. Fallback to Supabase User session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile, error } = await supabase
    .from("tutor_profiles")
    .select("username, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error?.code === "42703" || error?.message?.includes("does not exist")) {
    const { data: usernameOnly } = await supabase
      .from("tutor_profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    return isPlatformAdminUser(user, usernameOnly ?? null);
  }

  return isPlatformAdminUser(
    user,
    profile
      ? {
          username: profile.username,
          isPlatformAdmin: profile.is_platform_admin === true,
        }
      : null,
  );
}
