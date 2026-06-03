import { NextResponse } from "next/server";

import { createAuthCallbackClient } from "@/lib/supabase/route-handler";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=auth_callback&next=${encodeURIComponent(next)}`,
    );
  }

  if (code) {
    const redirectUrl = `${origin}${next}`;
    const { supabase, response } = await createAuthCallbackClient(redirectUrl);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback&next=${encodeURIComponent(next)}`,
  );
}
