import { NextResponse } from "next/server";

import { createAuthCallbackClient } from "@/lib/supabase/route-handler";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const redirectUrl = `${origin}${next.startsWith("/") ? next : `/${next}`}`;
    const { supabase, response } = await createAuthCallbackClient(redirectUrl);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback&next=${encodeURIComponent(next)}`);
}
