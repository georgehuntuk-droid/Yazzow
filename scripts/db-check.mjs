import pg from "pg";

import {
  buildConnectionCandidates,
  describeDatabaseUrlProblem,
  getDbPassword,
  getProjectRef,
  normalizeDatabaseUrl,
} from "./db-connection.mjs";

const ref = getProjectRef();
const password = getDbPassword();
const hasDbUrl = Boolean(process.env.DATABASE_URL?.trim());
const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? "";
const publishable =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  "";

console.log("Env check (secrets hidden):");
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${ref ? `set (ref ${ref})` : "MISSING"}`);
console.log(
  `  Publishable key: ${publishable ? `set (${publishable.length} chars)` : "MISSING"}`,
);
console.log(`  SUPABASE_SECRET_KEY: ${secret ? `set (${secret.length} chars)` : "MISSING"}`);
console.log(
  `  SUPABASE_DB_PASSWORD: ${password ? `set (${password.length} chars)` : "MISSING"}  ← only this is used for db:migrate`,
);
const dbUrlOk = Boolean(normalizeDatabaseUrl(process.env.DATABASE_URL));
console.log(
  `  DATABASE_URL: ${hasDbUrl ? (dbUrlOk ? "set (valid format)" : "set but INVALID") : "not set — recommended from Connect tab"}`,
);

if (hasDbUrl && !dbUrlOk) {
  console.error(`\n${describeDatabaseUrlProblem()}`);
  process.exit(1);
}

if (password && publishable && password === publishable) {
  console.error(
    "\nSUPABASE_DB_PASSWORD is the same as your publishable key. Use Settings → Database password instead.",
  );
  process.exit(1);
}
if (password && secret && password === secret) {
  console.error(
    "\nSUPABASE_DB_PASSWORD is the same as your secret key. Use Settings → Database password instead.",
  );
  process.exit(1);
}
if (password && password.length < 20) {
  console.log(
    "\nAPI keys look fine, but the DATABASE password line is only " +
      password.length +
      " characters. That is separate from API Keys:\n" +
      "  • API Keys page → publishable + secret (for the Next.js app)\n" +
      "  • Database page → Reset database password (for npm run db:migrate)\n" +
      "  • Or Connect → Session pooler → copy full URI → DATABASE_URL=...\n",
  );
}

if (!ref || (!password && !hasDbUrl)) {
  console.error("\nAdd credentials to .env.local (not .env.example).");
  process.exit(1);
}

if (password.length > 0 && password.length < 20) {
  console.log(
    "\nNote: Supabase generated passwords are usually longer than 20 characters.\n" +
      "If you typed your own password, ensure .env.local has the full value with no quotes.",
  );
}

const candidates = buildConnectionCandidates();
let authOnly = 0;

for (const candidate of candidates) {
  const client = new pg.Client({
    connectionString: candidate.url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query("select 1");
    console.log(`\nOK — connected via ${candidate.label}`);
    console.log("Run: npm run db:migrate");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password authentication failed/i.test(message)) {
      authOnly += 1;
      console.log(`  fail ${candidate.label}: wrong password`);
    } else {
      console.log(`  skip ${candidate.label}: ${message}`);
    }
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

console.error(
  "\nNo connection succeeded." +
    (authOnly > 0
      ? "\n\nPassword is still rejected. Paste DATABASE_URL from Supabase → Connect → Session pooler,\n" +
        "or restart the project after reset, or use SQL Editor for migrations."
      : ""),
);
process.exit(1);
