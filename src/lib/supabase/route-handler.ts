import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  applyAuthCookieOptions,
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/session-cookie";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for Route Handlers that must persist auth cookies on redirects
 * (e.g. email confirmation callback). Without this, the session can be lost.
 */
export async function createAuthCallbackClient(redirectUrl: string) {
  const cookieStore = await cookies();
  const rememberMe = isRememberMeEnabled(
    cookieStore.get(REMEMBER_ME_COOKIE)?.value,
  );
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = applyAuthCookieOptions(options, rememberMe);
          cookieStore.set(name, value, cookieOptions);
          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  return { supabase, response };
}
