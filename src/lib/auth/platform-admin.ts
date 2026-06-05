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

/** Synchronous admin check using session user + tutor profile already loaded in layout. */
export function isPlatformAdminUser(
  user: AdminUser,
  profile?: AdminProfile | null,
): boolean {
  if ((PLATFORM_OWNER_USER_IDS as readonly string[]).includes(user.id)) {
    return true;
  }

  if (user.email && parseAdminAllowlist().includes(user.email.toLowerCase())) {
    return true;
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
