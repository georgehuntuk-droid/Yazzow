import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  applyAuthCookieOptions,
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/session-cookie";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
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
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
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

  // Optimize: Skip auth network call for anonymous visitors who do not have any Supabase cookies.
  const cookiesList = request.cookies.getAll();
  const hasSbCookie = cookiesList.some((c) => c.name.startsWith("sb-"));
  if (!hasSbCookie) {
    return supabaseResponse;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const allCookies = request.cookies.getAll();
      const hasSbCookie = allCookies.some((c) => c.name.startsWith("sb-"));
      if (hasSbCookie) {
        allCookies.forEach((c) => {
          if (c.name.startsWith("sb-")) {
            supabaseResponse.cookies.set(c.name, "", { maxAge: -1, path: "/" });
          }
        });
      }
    }
  } catch (err) {
    console.warn("[middleware] Supabase connection is offline, skipping user refresh.", err instanceof Error ? err.message : err);
  }

  return supabaseResponse;
}
