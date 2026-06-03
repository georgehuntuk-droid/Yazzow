import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminKey } from "@/lib/supabase/admin-key";

/** Confirm a tutor email server-side when Supabase SMTP is not set up yet. */
export async function confirmUserEmail(userId: string): Promise<boolean> {
  if (!hasSupabaseAdminKey()) return false;

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function confirmUserEmailByAddress(email: string): Promise<boolean> {
  if (!hasSupabaseAdminKey()) return false;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error || !data.users.length) return false;

    const user = data.users.find(
      (row) => row.email?.trim().toLowerCase() === normalized,
    );

    if (!user?.id) return false;

    return confirmUserEmail(user.id);
  } catch {
    return false;
  }
}
