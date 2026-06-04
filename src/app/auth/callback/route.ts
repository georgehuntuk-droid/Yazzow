import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createAuthCallbackClient } from "@/lib/supabase/route-handler";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/onboarding";
  }
  return next;
}

const OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=auth_callback&next=${encodeURIComponent(next)}`,
    );
  }

  const redirectUrl = `${origin}${next}`;

  if (code || (tokenHash && typeParam && OTP_TYPES.has(typeParam))) {
    const { supabase, response } = await createAuthCallbackClient(redirectUrl);

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return response;
      }
    }

    if (tokenHash && typeParam && OTP_TYPES.has(typeParam)) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: typeParam as EmailOtpType,
      });
      if (!error) {
        return response;
      }
    }
  }

  // Implicit flow (#access_token=…) is client-only — finish on /auth/confirm.
  const confirmParams = new URLSearchParams({ next });
  if (code) confirmParams.set("code", code);
  if (tokenHash) confirmParams.set("token_hash", tokenHash);
  if (typeParam) confirmParams.set("type", typeParam);

  return NextResponse.redirect(`${origin}/auth/confirm?${confirmParams.toString()}`);
}
