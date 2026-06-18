import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminKey } from "@/lib/supabase/admin-key";
import {
  sendPasswordResetEmail,
  sendSignupConfirmationEmail,
} from "@/lib/notifications/auth-email";
import { isResendConfigured } from "@/lib/notifications/resend-from";

function getDirectConfirmLink(
  redirectTo: string,
  tokenHash: string | undefined,
  type: "signup" | "recovery" | "magiclink",
  fallbackLink: string | undefined,
): string | undefined {
  if (!tokenHash) return fallbackLink;
  try {
    const url = new URL(redirectTo);
    const origin = url.origin;
    const next = url.searchParams.get("next") || "/";
    return `${origin}/auth/callback?token_hash=${tokenHash}&type=${type}&next=${encodeURIComponent(next)}`;
  } catch {
    return fallbackLink;
  }
}

export async function sendSignupLinkViaResend(input: {
  email: string;
  password: string;
  redirectTo: string;
}): Promise<boolean> {
  if (!hasSupabaseAdminKey() || !isResendConfigured()) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email: input.email,
      password: input.password,
      options: { redirectTo: input.redirectTo },
    });

    if (error) {
      console.error("[sendSignupLinkViaResend] generateLink error:", error);
      return false;
    }

    const tokenHash = data?.properties?.hashed_token;
    const fallbackLink = data?.properties?.action_link;
    const link = getDirectConfirmLink(input.redirectTo, tokenHash, "signup", fallbackLink);

    if (!link) {
      console.error("[sendSignupLinkViaResend] failed to build confirm link");
      return false;
    }

    const sent = await sendSignupConfirmationEmail({ to: input.email, confirmUrl: link });
    if (!sent) {
      console.error("[sendSignupLinkViaResend] sendSignupConfirmationEmail returned false");
    }
    return sent;
  } catch (err) {
    console.error("[sendSignupLinkViaResend] exception:", err);
    return false;
  }
}

export async function sendRecoveryLinkViaResend(input: {
  email: string;
  redirectTo: string;
}): Promise<boolean> {
  if (!hasSupabaseAdminKey() || !isResendConfigured()) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: input.email,
      options: { redirectTo: input.redirectTo },
    });

    if (error) {
      console.error("[sendRecoveryLinkViaResend] generateLink error:", error);
      return false;
    }

    const tokenHash = data?.properties?.hashed_token;
    const fallbackLink = data?.properties?.action_link;
    const link = getDirectConfirmLink(input.redirectTo, tokenHash, "recovery", fallbackLink);

    if (!link) {
      console.error("[sendRecoveryLinkViaResend] failed to build recovery link");
      return false;
    }

    const sent = await sendPasswordResetEmail({ to: input.email, resetUrl: link });
    if (!sent) {
      console.error("[sendRecoveryLinkViaResend] sendPasswordResetEmail returned false");
    }
    return sent;
  } catch (err) {
    console.error("[sendRecoveryLinkViaResend] exception:", err);
    return false;
  }
}

export async function sendMagicLinkViaResend(input: {
  email: string;
  redirectTo: string;
}): Promise<boolean> {
  if (!hasSupabaseAdminKey() || !isResendConfigured()) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: input.email,
      options: { redirectTo: input.redirectTo },
    });

    if (error) {
      console.error("[sendMagicLinkViaResend] generateLink error:", error);
      return false;
    }

    const tokenHash = data?.properties?.hashed_token;
    const fallbackLink = data?.properties?.action_link;
    const link = getDirectConfirmLink(input.redirectTo, tokenHash, "magiclink", fallbackLink);

    if (!link) {
      console.error("[sendMagicLinkViaResend] failed to build magic link");
      return false;
    }

    const sent = await sendSignupConfirmationEmail({ to: input.email, confirmUrl: link });
    if (!sent) {
      console.error("[sendMagicLinkViaResend] sendSignupConfirmationEmail returned false");
    }
    return sent;
  } catch (err) {
    console.error("[sendMagicLinkViaResend] exception:", err);
    return false;
  }
}
