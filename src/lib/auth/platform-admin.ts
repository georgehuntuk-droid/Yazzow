import "server-only";

import { PLATFORM_OWNER_EMAILS } from "@/lib/constants";
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

  if (!user?.email) {
    return false;
  }

  const email = user.email.toLowerCase();
  const allowlist = parseAdminAllowlist();

  if (allowlist.includes(email)) {
    return true;
  }

  // Database-backed admin (survives missing env vars after migration 011)
  const { data: profile, error } = await supabase
    .from("tutor_profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error?.code === "42703" || error?.message?.includes("does not exist")) {
    return false;
  }

  return profile?.is_platform_admin === true;
}
