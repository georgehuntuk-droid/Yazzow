"use server";

import { cookies } from "next/headers";

import { authConfigErrorMessage, friendlyAuthError } from "@/lib/auth/messages";
import { authConfirmUrl, getAuthRedirectOrigin } from "@/lib/auth/redirect-origin";
import {
  rememberMeCookieValue,
  rememberMePreferenceOptions,
  REMEMBER_ME_COOKIE,
} from "@/lib/auth/session-cookie";
import { confirmUserEmail, confirmUserEmailByAddress } from "@/lib/auth/confirm-email";
import {
  sendMagicLinkViaResend,
  sendRecoveryLinkViaResend,
} from "@/lib/auth/send-auth-email";
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
  const normalizedEmail = email.trim().toLowerCase();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("email not confirmed")) {
      const confirmed = await confirmUserEmailByAddress(normalizedEmail);
      if (confirmed) {
        const retry = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (!retry.error) {
          return { ok: true };
        }
      }
    }

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
  const normalizedEmail = email.trim().toLowerCase();

  const confirmUrl = authConfirmUrl(origin, next);

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: confirmUrl,
    },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  if (data.session) {
    return { ok: true };
  }

  if (data.user?.id && (await confirmUserEmail(data.user.id))) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (!signInError) {
      return { ok: true };
    }
  }

  const redirectTo = authConfirmUrl(origin, next);
  const emailed = await sendMagicLinkViaResend({
    email: normalizedEmail,
    redirectTo,
  });

  if (emailed) {
    return {
      ok: true,
      needsEmailConfirmation: true,
      message: "Check your inbox for a confirmation link from Yazzow.",
    };
  }

  return {
    ok: true,
    needsEmailConfirmation: true,
    message:
      "Account created. Try signing in — if that fails, add RESEND_API_KEY on Netlify and redeploy.",
  };
}

export async function requestPasswordResetAction(
  email: string,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: supabaseSetupError() };
  }

  const origin = await getAuthRedirectOrigin();
  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo = authConfirmUrl(origin, "/auth/reset-password");

  const emailed = await sendRecoveryLinkViaResend({
    email: normalizedEmail,
    redirectTo,
  });

  if (emailed) {
    return {
      ok: true,
      message:
        "If an account exists for that email, we sent a reset link. Check spam too — it expires after a while.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

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
  const normalizedEmail = email.trim().toLowerCase();
  const redirectTo = authConfirmUrl(origin, "/onboarding");

  if (await confirmUserEmailByAddress(normalizedEmail)) {
    return {
      ok: true,
      message: "Your email is confirmed. You can sign in now.",
    };
  }

  const emailed = await sendMagicLinkViaResend({ email: normalizedEmail, redirectTo });

  if (emailed) {
    return {
      ok: true,
      message: "Confirmation email sent. Check your inbox and spam folder.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  return {
    ok: true,
    message: "Confirmation email sent. Check your inbox and spam folder.",
  };
}
