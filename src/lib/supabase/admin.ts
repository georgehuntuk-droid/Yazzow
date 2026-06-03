import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminKey } from "@/lib/supabase/admin-key";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSupabaseAdminKey();

  if (!url || !key) {
    throw new Error(
      "Missing admin Supabase key. Use SUPABASE_SECRET_KEY (sb_secret_...) or SUPABASE_SERVICE_ROLE_KEY (legacy JWT) — not the publishable key.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
