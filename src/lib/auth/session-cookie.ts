import type { CookieOptions } from "@supabase/ssr";

/** Tutor preference: stay signed in across browser restarts. */
export const REMEMBER_ME_COOKIE = "yazzow-remember-me";

/** 30 days — matches typical Supabase refresh token lifetime. */
export const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isRememberMeEnabled(
  value: string | undefined | null,
): boolean {
  if (value === "0" || value === "false") return false;
  return true;
}

export function rememberMeCookieValue(rememberMe: boolean): "1" | "0" {
  return rememberMe ? "1" : "0";
}

export function rememberMePreferenceOptions(
  rememberMe: boolean,
): CookieOptions {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? REMEMBER_ME_MAX_AGE_SECONDS : undefined,
  };
}

export function applyAuthCookieOptions(
  options: CookieOptions,
  rememberMe: boolean,
): CookieOptions {
  if (rememberMe) {
    return {
      ...options,
      maxAge: REMEMBER_ME_MAX_AGE_SECONDS,
    };
  }

  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions;
}
