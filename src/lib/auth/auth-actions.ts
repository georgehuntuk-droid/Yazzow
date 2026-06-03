"use server";

import { cookies, headers } from "next/headers";

import { PUBLIC_SITE_URL } from "@/lib/constants";
import { authConfigErrorMessage, friendlyAuthError } from "@/lib/auth/messages";
import {
  rememberMeCookieValue,
  rememberMePreferenceOptions,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/session-cookie";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnvHint, isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthActionResult =
  | { ok: true; needsEmailConfirmation?: boolean; message?: string }
  | { ok: false; error: string };

function sanitizeNext(next: string | undefined, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}

async function getAuthRedirectOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (host) {
    return `${proto}://${host}`;
  }

  return PUBLIC_SITE_URL.replace(/\/$/, "");
}

function supabaseSetupError(): string {
  return getSupabaseEnvHint() || authConfigErrorMessage();
}

export async function signInAction(
  email: string,
  password: string,
  rememberMe = true,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: supabaseSetupError() };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    REMEMBER_ME_COOKIE,
    rememberMeCookieValue(rememberMe),
    rememberMePreferenceOptions(rememberMe),
  );

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  return { ok: true };
}

export async function signUpAction(
  email: string,
  password: string,
  nextPath?: string,
  rememberMe = true,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: supabaseSetupError() };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    REMEMBER_ME_COOKIE,
    rememberMeCookieValue(rememberMe),
    rememberMePreferenceOptions(rememberMe),
  );

  const next = sanitizeNext(nextPath, "/onboarding");
  const origin = await getAuthRedirectOrigin();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  if (data.session) {
    return { ok: true };
  }

  return {
    ok: true,
    needsEmailConfirmation: true,
    message: "Check your inbox for a confirmation link to finish creating your account.",
  };
}

export async function requestPasswordResetAction(
  email: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: supabaseSetupError() };
  }

  const origin = await getAuthRedirectOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
    },
  );

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  return {
    ok: true,
    message:
      "If an account exists for that email, we sent a reset link. Check spam too — it expires after a while.",
  };
}

export async function updatePasswordAction(
  password: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: supabaseSetupError() };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "This reset link is invalid or expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  return { ok: true };
}

export async function resendConfirmationEmailAction(
  email: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: supabaseSetupError() };
  }

  const origin = await getAuthRedirectOrigin();
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/onboarding")}`,
    },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  return {
    ok: true,
    message: "Confirmation email sent. Check your inbox and spam folder.",
  };
}
