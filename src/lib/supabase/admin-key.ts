import "server-only";

/** Server-only Supabase key (bypasses RLS). Never use publishable/anon here. */
export function getSupabaseAdminKey(): string | null {
  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key || key.startsWith("sb_publishable_")) {
    return null;
  }

  return key;
}

export function describeAdminKeyProblem(): string {
  const secret = process.env.SUPABASE_SECRET_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (secret?.startsWith("sb_publishable_")) {
    return (
      "SUPABASE_SECRET_KEY is set to your publishable key (same as line 6). " +
      "In Supabase go to Project Settings → API Keys → Create new secret key, " +
      "or copy the legacy service_role JWT to SUPABASE_SERVICE_ROLE_KEY instead."
    );
  }

  if (!secret && !serviceRole) {
    return (
      "Missing server key. Add SUPABASE_SECRET_KEY (sb_secret_...) or " +
      "SUPABASE_SERVICE_ROLE_KEY (legacy eyJ... JWT) from Project Settings → API."
    );
  }

  return "Server key is configured.";
}

export function hasSupabaseAdminKey(): boolean {
  return getSupabaseAdminKey() !== null;
}
