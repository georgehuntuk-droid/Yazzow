import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminKey } from "@/lib/supabase/admin-key";
import {
  sendPasswordResetEmail,
  sendSignupConfirmationEmail,
} from "@/lib/notifications/auth-email";
import { isResendConfigured } from "@/lib/notifications/resend-from";

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

    const link = data?.properties?.action_link;
    if (error || !link) return false;

    return sendSignupConfirmationEmail({ to: input.email, confirmUrl: link });
  } catch {
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

    const link = data?.properties?.action_link;
    if (error || !link) return false;

    return sendPasswordResetEmail({ to: input.email, resetUrl: link });
  } catch {
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

    const link = data?.properties?.action_link;
    if (error || !link) return false;

    return sendSignupConfirmationEmail({ to: input.email, confirmUrl: link });
  } catch {
    return false;
  }
}
