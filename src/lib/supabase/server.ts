import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  applyAuthCookieOptions,
  isRememberMeEnabled,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/session-cookie";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const rememberMe = isRememberMeEnabled(
    cookieStore.get(REMEMBER_ME_COOKIE)?.value,
  );

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(
              name,
              value,
              applyAuthCookieOptions(options, rememberMe),
            );
          });
        } catch {
          // setAll from a Server Component — middleware handles session refresh.
        }
      },
    },
  });
}
