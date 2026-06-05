import "server-only";

import {
  PLATFORM_OWNER_EMAILS,
  PLATFORM_OWNER_USERNAMES,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

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

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  if (user.email && parseAdminAllowlist().includes(user.email.toLowerCase())) {
    return true;
  }

  const { data: profile } = await supabase
    .from("tutor_profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profile?.username &&
    (PLATFORM_OWNER_USERNAMES as readonly string[]).includes(profile.username)
  ) {
    return true;
  }

  // Optional DB flag after migration 011 (column may not exist yet)
  const { data: adminRow, error: adminError } = await supabase
    .from("tutor_profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !adminError &&
    adminRow?.is_platform_admin === true
  ) {
    return true;
  }

  return false;
}
