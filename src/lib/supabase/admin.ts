import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminKey } from "@/lib/supabase/admin-key";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/supabase/env";

export function createAdminClient() {
  let url: string;
  try {
    url = getSupabaseUrl();
  } catch {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  }

  let key = getSupabaseAdminKey();

  if (!key) {
    console.warn(
      "[Admin Client Warning] SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not defined in this environment. Falling back to the client publishable key to prevent a server-side 500 crash."
    );
    try {
      key = getSupabasePublishableKey();
    } catch {
      key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
    }
  }

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

