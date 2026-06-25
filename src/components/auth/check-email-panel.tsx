"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Mail, ArrowRight } from "lucide-react";

import { resendConfirmationEmailAction } from "@/lib/auth/auth-actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function CheckEmailPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams.get("email") ?? "";
  const next = searchParams.get("next") ?? "/onboarding";

  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push(next);
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router, next]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDev = process.env.NODE_ENV === "development";

  async function handleResend() {
    if (!email.trim()) {
      setError("Enter your email to resend the confirmation link.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await resendConfirmationEmailAction(email);
    if (!result.ok) {
      setError(result.error);
    } else {
      setMessage(result.message ?? "Confirmation email sent successfully.");
    }
    setLoading(false);
  }

  return (
    <Card className="yazz-surface w-full border-primary/10 shadow-[0_8px_32px_oklch(0.42_0.15_286/0.1)]">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-6" />
        </div>
        <CardTitle className="font-heading text-2xl font-bold">Check your inbox</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          We&apos;ve sent a secure confirmation link to your email address to verify your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
          <p>
            Please click the link in the email to confirm your address and claim your private tutor portal.
          </p>
          <p>
            Don&apos;t see it? Check your spam or junk folder, or wait a couple of minutes.
          </p>
        </div>

        <div className="rounded-xl bg-muted/50 p-4 space-y-3 border border-border/40">
          <div className="space-y-1.5">
            <label htmlFor="confirm-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Resend verification link
            </label>
            <div className="flex gap-2">
              <Input
                id="confirm-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleResend} 
                disabled={loading}
                className="shrink-0"
              >
                {loading ? "Sending…" : "Resend"}
              </Button>
            </div>
          </div>
          {error ? <p className="text-xs text-destructive font-medium">{error}</p> : null}
          {message ? <p className="text-xs text-primary font-medium">{message}</p> : null}
        </div>

        {isDev && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 dark:text-amber-300">
            <p className="font-semibold mb-1">Developer Notice (visible in dev mode only):</p>
            <p>
              Until SMTP is configured in Supabase, mail may not arrive. Configure it in Supabase → Authentication → Email → SMTP Settings using smtp.resend.com.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/auth/login"
            className="yazz-btn-secondary w-full h-10 inline-flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            Back to sign in
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
