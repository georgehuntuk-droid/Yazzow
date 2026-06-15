import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  applyAuthCookieOptions,
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/session-cookie";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const rememberMe = isRememberMeEnabled(
    request.cookies.get(REMEMBER_ME_COOKIE)?.value,
  );

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(
            name,
            value,
            applyAuthCookieOptions(options, rememberMe),
          );
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (err) {
    console.warn("[middleware] Supabase connection is offline, skipping user refresh.", err instanceof Error ? err.message : err);
  }

  return supabaseResponse;
}
