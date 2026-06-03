"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { resendConfirmationEmailAction } from "@/lib/auth/auth-actions";
import { Button } from "@/components/ui/button";
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
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setMessage(result.message ?? "Email sent.");
    }
    setLoading(false);
  }

  return (
    <Card className="yazz-surface w-full border-border/80">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">Check your inbox</CardTitle>
        <CardDescription>
          Account emails (sign-up confirm, password reset) are sent by Supabase — not the same
          as booking alerts on Netlify. Until Resend SMTP is connected in Supabase, mail may not
          arrive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Check spam/junk. Wait a few minutes, then resend below. To fix delivery permanently:
          Supabase → Authentication → Email → SMTP Settings → use Resend (
          <code className="text-xs">smtp.resend.com</code>, user{" "}
          <code className="text-xs">resend</code>, password = your Resend API key, sender{" "}
          <code className="text-xs">bookings@yazzow.com</code>).
        </p>
        <p className="text-sm text-muted-foreground">
          If you already signed up, try{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            signing in again
          </Link>{" "}
          — your account may already be active.
        </p>
        <div className="space-y-2">
          <label htmlFor="confirm-email" className="text-sm font-medium">
            Your email
          </label>
          <Input
            id="confirm-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}
        <Button type="button" variant="outline" onClick={handleResend} disabled={loading}>
          {loading ? "Sending…" : "Resend confirmation email"}
        </Button>
        <Link
          href="/auth/login"
          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
