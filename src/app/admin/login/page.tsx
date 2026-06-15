"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAsAdmin } from "@/lib/dashboard/admin-actions";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await loginAsAdmin(password);
        if (res.ok) {
          window.location.href = "/admin";
        } else {
          setError(res.error ?? "Incorrect admin password.");
        }
      } catch {
        setError("An error occurred during authentication.");
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_right,var(--color-primary-100),transparent_50%)] p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>

        {/* Login Card */}
        <Card className="yazz-surface border-border/80 shadow-2xl relative overflow-hidden">
          {/* Decorative glowing edge */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          <CardHeader className="space-y-2 pb-4 pt-6 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="font-heading text-2xl font-bold tracking-tight">
              Admin Access
            </CardTitle>
            <CardDescription className="text-xs font-medium max-w-[280px] mx-auto text-muted-foreground">
              Please enter the platform administrator password to unlock console operations.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 relative">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
                >
                  Passphrase / Password
                </label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="pl-10 h-11 rounded-xl bg-muted/30 border-border/60 focus:border-amber-500/50 focus:ring-amber-500/10"
                  />
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                </div>
              </div>

              {error && (
                <p className="text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/10 transition-all active:scale-[0.98]"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4.5 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Unlock Console"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
