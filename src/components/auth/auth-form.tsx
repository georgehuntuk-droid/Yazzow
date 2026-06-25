"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, User, Users } from "lucide-react";

import {
  signInAction,
  signUpAction,
} from "@/lib/auth/auth-actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  mode: "login" | "signup";
};

const REMEMBER_ME_STORAGE_KEY = "yazzow-remember-me";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [role, setRole] = useState<"tutor" | "parent">("tutor");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "parent" || roleParam === "student") {
      setRole("parent");
    }
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const defaultNext = role === "parent" 
    ? "/onboarding?role=parent" 
    : (mode === "signup" ? "/onboarding" : "/dashboard");
  const next = searchParams.get("next") ?? defaultNext;
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <Card className="yazz-surface border-primary/10 shadow-[0_8px_32px_oklch(0.42_0.15_286/0.1)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="font-heading text-2xl font-bold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to your Yazzow dashboard."
            : "Free to join — claim your username and portal link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border/40">
          <button
            type="button"
            onClick={() => setRole("tutor")}
            className={cn(
              "py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              role === "tutor"
                ? "bg-background text-foreground shadow-sm font-bold border border-border/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="size-3.5" />
            I am a Tutor
          </button>
          <button
            type="button"
            onClick={() => setRole("parent")}
            className={cn(
              "py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer",
              role === "parent"
                ? "bg-background text-foreground shadow-sm font-bold border border-border/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="size-3.5" />
            I am a Parent / Student
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {mode === "signup" ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-primary/60" />
                Must be at least 8 characters.
              </p>
            ) : null}
          </div>

          {mode === "login" ? (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm py-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => handleRememberMeChange(event.target.checked)}
                className="size-4 rounded border-border accent-primary cursor-pointer"
              />
              <span className="text-muted-foreground select-none hover:text-foreground transition-colors">
                Remember me on this device
              </span>
            </label>
          ) : null}

          {error ? (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive font-medium">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-sm text-primary font-medium">
              {info}
            </div>
          ) : null}

          <Button type="submit" className="w-full h-10 text-sm font-semibold" disabled={loading}>
            {loading ? (
              "Please wait…"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {mode === "login" ? "Sign in" : "Create account"}
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </form>



        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              New to Yazzow?{" "}
              <Link
                href={`/auth/signup?next=${encodeURIComponent(next)}`}
                className="font-semibold text-primary hover:underline"
              >
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href={`/auth/login?next=${encodeURIComponent(next)}`}
                className="font-semibold text-primary hover:underline"
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
