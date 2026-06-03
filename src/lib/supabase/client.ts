import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

/** Browser client for realtime only — sign-in uses server actions. */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured in this build.");
  }
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
