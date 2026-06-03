"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  signInAction,
  signUpAction,
} from "@/lib/auth/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  mode: "login" | "signup";
};

const REMEMBER_ME_STORAGE_KEY = "yazzow-remember-me";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultNext = mode === "signup" ? "/onboarding" : "/dashboard";
  const next = searchParams.get("next") ?? defaultNext;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
      if (saved === "0") setRememberMe(false);
    } catch {
      // ignore
    }
  }, []);

  function handleRememberMeChange(checked: boolean) {
    setRememberMe(checked);
    try {
      localStorage.setItem(REMEMBER_ME_STORAGE_KEY, checked ? "1" : "0");
    } catch {
      // ignore
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result =
        mode === "signup"
          ? await signUpAction(email, password, next, rememberMe)
          : await signInAction(email, password, rememberMe);

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.needsEmailConfirmation) {
        router.push(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
        router.refresh();
        return;
      }

      if (result.message) {
        setInfo(result.message);
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="yazz-surface border-primary/10 shadow-[0_8px_32px_oklch(0.42_0.15_286/0.1)]">
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to your Yazzow dashboard."
            : "Free to join — claim your username and portal link."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              {mode === "login" ? (
                <Link
                  href={`/auth/forgot-password?next=${encodeURIComponent(next)}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "signup" ? (
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            ) : null}
          </div>
          {mode === "login" ? (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => handleRememberMeChange(event.target.checked)}
                className="size-4 rounded border-border accent-primary"
              />
              <span>Remember me on this device</span>
            </label>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link
                href={`/auth/signup?next=${encodeURIComponent(next)}`}
                className="text-primary hover:underline"
              >
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href={`/auth/login?next=${encodeURIComponent(next)}`}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
