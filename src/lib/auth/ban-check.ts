import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Checks if a user is globally banned or suspended.
 * Queries the `banned_users` table by email, and also checks `tutor_profiles` if an ID is provided.
 */
export async function isUserBanned(email: string, id?: string): Promise<boolean> {
  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check if email exists in banned_users table
  const { data: bannedRow, error: bannedError } = await admin
    .from("banned_users")
    .select("email")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (bannedRow) {
    return true;
  }

  // 2. If it's a tutor with a known ID, also check if their tutor profile is banned
  if (id) {
    const { data: tutor } = await admin
      .from("tutor_profiles")
      .select("is_banned")
      .eq("id", id)
      .maybeSingle();

    if (tutor?.is_banned) {
      return true;
    }
  }

  return false;
}
