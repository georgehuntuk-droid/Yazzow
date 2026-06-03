import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Sign-in is not configured on this site yet. Add Supabase keys to the host environment.",
    );
  }
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
