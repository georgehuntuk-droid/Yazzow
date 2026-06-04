"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/onboarding";
  }
  return raw;
}

export function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming your email…");

  useEffect(() => {
    const supabase = createClient();
    const next = safeNext(searchParams.get("next"));

    async function finish() {
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          router.refresh();
          return;
        }
        setMessage(error.message);
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "email" | "recovery" | "magiclink" | "invite",
        });
        if (!error) {
          router.replace(next);
          router.refresh();
          return;
        }
        setMessage(error.message);
        return;
      }

      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            router.replace(next);
            router.refresh();
            return;
          }
          setMessage(error.message);
          return;
        }
      }

      setMessage("This confirmation link is invalid or has expired.");
    }

    void finish();
  }, [router, searchParams]);

  const failed = message !== "Confirming your email…";

  return (
    <div className="space-y-4 text-center">
      <p className={failed ? "text-destructive" : "text-muted-foreground"}>{message}</p>
      {failed ? (
        <Link href="/auth/login" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      ) : null}
    </div>
  );
}
