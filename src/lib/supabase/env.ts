function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/** First non-empty env var from the list (server runtime vars checked before NEXT_PUBLIC). */
function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = trimEnv(process.env[key]);
    if (value) return value;
  }
  return undefined;
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to Netlify environment variables (Supabase → Project Settings → API).`,
    );
  }
  return value;
}

const URL_KEYS = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;

const PUBLISHABLE_KEYS = [
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

/** Supabase project URL, e.g. https://abcdefgh.supabase.co */
export function getSupabaseUrl(): string {
  return required("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL", readEnv(...URL_KEYS));
}

/**
 * Publishable (sb_publishable_…) or legacy anon JWT.
 * Prefer runtime SUPABASE_ANON_KEY on Netlify so auth works without a rebuild.
 */
export function getSupabasePublishableKey(): string {
  return required(
    "SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    readEnv(...PUBLISHABLE_KEYS),
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(readEnv(...URL_KEYS) && readEnv(...PUBLISHABLE_KEYS));
}

/** Names of env vars still missing on this server (for setup hints). */
export function getMissingSupabaseEnvVars(): string[] {
  const missing: string[] = [];
  if (!readEnv(...URL_KEYS)) {
    missing.push("SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  }
  if (!readEnv(...PUBLISHABLE_KEYS)) {
    missing.push(
      "SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return missing;
}

export function getSupabaseEnvHint(): string {
  const missing = getMissingSupabaseEnvVars();
  if (missing.length === 0) return "";

  return `Missing on this server: ${missing.join(" and ")}. In Netlify → Environment variables, add them (copy from Supabase → Project Settings → API), scope to All, then Deploys → Clear cache and deploy site.`;
}
