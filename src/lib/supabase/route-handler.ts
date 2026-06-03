import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for Route Handlers that must persist auth cookies on redirects
 * (e.g. email confirmation callback). Without this, the session can be lost.
 */
export async function createAuthCallbackClient(redirectUrl: string) {
  const cookieStore = await cookies();
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}
