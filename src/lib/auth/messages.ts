/** Map Supabase auth errors to clearer copy for tutors and parents. */
export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect. Try again or reset your password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email first — check your inbox for the link from Yazzow.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in or reset your password.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Wait a minute and try again.";
  }
  if (lower.includes("signup is disabled")) {
    return "New sign-ups are paused. Contact support if you need access.";
  }

  return message;
}

export function authConfigErrorMessage(): string {
  return "Sign-in is not configured. Add Supabase keys in Netlify and redeploy.";
}

export const AUTH_CALLBACK_ERRORS: Record<string, string> = {
  auth_callback:
    "That sign-in link expired or was already used. Request a new link or try signing in again.",
  session_expired: "Your session expired. Sign in again to continue.",
};
