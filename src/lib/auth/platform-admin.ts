import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function isPlatformAdmin(): Promise<boolean> {
  const allowlist = process.env.PLATFORM_ADMIN_EMAILS?.split(",")
    .map((email) => email.trim().replace(/^["']|["']$/g, "").toLowerCase())
    .filter(Boolean);

  console.log("[Admin Check] Allowlist:", allowlist);

  if (!allowlist?.length) {
    console.warn("[Admin Check] PLATFORM_ADMIN_EMAILS environment variable is not defined or is empty!");
    return false;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Admin Check] Logged-in user email:", user?.email);

  if (!user?.email) {
    console.warn("[Admin Check] No logged-in user email found!");
    return false;
  }
  
  const isMatch = allowlist.includes(user.email.toLowerCase());
  console.log("[Admin Check] Result for", user.email, "is:", isMatch);
  return isMatch;
}
