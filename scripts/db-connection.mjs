import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local" });

const POOLER_REGIONS = [
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "ap-southeast-1",
];

export function getProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return new URL(supabaseUrl).hostname.split(".")[0];
}

export function getDbPassword() {
  return process.env.SUPABASE_DB_PASSWORD?.trim() ?? "";
}

/** Strip quotes; reject API keys or other values pasted by mistake. */
export function normalizeDatabaseUrl(raw) {
  const value = raw?.trim().replace(/^["']|["']$/g, "") ?? "";
  if (!value) return null;

  if (!/^postgres(ql)?:\/\//i.test(value)) {
    return null;
  }

  if (value.length < 80) {
    return null;
  }

  if (!/\.(pooler\.supabase\.com|supabase\.co)/i.test(value)) {
    return null;
  }

  if (/^postgres(ql)?:\/\/sb_(publishable|secret)_/i.test(value)) {
    return null;
  }

  try {
    const probe = value.replace(/^postgresql:/i, "http:");
    new URL(probe);
    return value;
  } catch {
    return null;
  }
}

export function describeDatabaseUrlProblem() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    return "DATABASE_URL is not set. Supabase → Connect → Session pooler → copy URI.";
  }

  const pub =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    "";

  if (raw === pub || raw.replace(/^postgresql:\/\//, "") === pub) {
    return "DATABASE_URL contains your publishable API key, not a Postgres URI. Use Connect → Session pooler.";
  }

  if (raw.length < 80) {
    return `DATABASE_URL is only ${raw.length} characters; a real pooler URI is usually 120+. Copy the full string from Connect.`;
  }

  if (!/pooler\.supabase\.com|db\.[a-z0-9]+\.supabase\.co/i.test(raw)) {
    return "DATABASE_URL does not look like a Supabase Postgres host. Copy Session pooler URI from Connect.";
  }

  return "DATABASE_URL format is invalid. Paste one line from Connect → Session pooler (port 5432).";
}

/** Connection strings to try, in order. Prefer DATABASE_URL from Supabase → Connect. */
export function buildConnectionCandidates() {
  const candidates = [];

  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (databaseUrl) {
    candidates.push({
      label: "DATABASE_URL",
      url: databaseUrl,
    });
  }

  const password = getDbPassword();
  const projectRef = getProjectRef();

  if (!password || !projectRef) {
    return candidates;
  }

  const encodedPassword = encodeURIComponent(password);
  const preferredRegion = process.env.SUPABASE_DB_REGION?.trim();

  const regions = preferredRegion
    ? [preferredRegion, ...POOLER_REGIONS.filter((r) => r !== preferredRegion)]
    : POOLER_REGIONS;

  for (const region of regions) {
    for (const prefix of ["aws-0", "aws-1"]) {
      candidates.push({
        label: `pooler ${prefix} (${region}, session :5432)`,
        url: `postgresql://postgres.${projectRef}:${encodedPassword}@${prefix}-${region}.pooler.supabase.com:5432/postgres`,
      });
    }
  }

  candidates.push({
    label: "direct db.*.supabase.co :5432",
    url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  });

  return candidates;
}
