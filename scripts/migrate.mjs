import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  buildConnectionCandidates,
  describeDatabaseUrlProblem,
  getDbPassword,
  getProjectRef,
  normalizeDatabaseUrl,
} from "./db-connection.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

function listMigrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function getAppliedMigrations(client) {
  try {
    const { rows } = await client.query(
      "select filename from public._schema_migrations order by filename",
    );
    return new Set(rows.map((row) => row.filename));
  } catch {
    return new Set();
  }
}

async function recordMigration(client, filename) {
  await client.query(
    "insert into public._schema_migrations (filename) values ($1) on conflict (filename) do nothing",
    [filename],
  );
}

async function connectWithFallback() {
  const candidates = buildConnectionCandidates();
  const ref = getProjectRef();
  const passwordLen = getDbPassword().length;

  if (process.env.DATABASE_URL?.trim() && !normalizeDatabaseUrl(process.env.DATABASE_URL)) {
    console.error(`\n${describeDatabaseUrlProblem()}\n`);
    process.exit(1);
  }

  if (candidates.length === 0) {
    console.error(
      "Missing DATABASE_URL or SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL.\n" +
        "Easiest fix: Supabase → Connect → Session pooler → copy URI into .env.local:\n" +
        "  DATABASE_URL=postgresql://postgres.PROJECT_REF:...@aws-0-REGION.pooler.supabase.com:5432/postgres\n" +
        "Do not paste publishable or secret API keys into DATABASE_URL.\n" +
        "Then run: npm run db:migrate\n" +
        "Or run SQL in Supabase → SQL Editor (supabase/migrations/*.sql in order).",
    );
    process.exit(1);
  }

  const errors = [];
  let authFailures = 0;

  for (const candidate of candidates) {
    const client = new pg.Client({
      connectionString: candidate.url,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log(`Connected via ${candidate.label}.`);
      return client;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate.label}: ${message}`);
      if (/password authentication failed/i.test(message)) {
        authFailures += 1;
      }
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }

  console.error("Could not connect to Supabase Postgres:\n");
  for (const line of errors.slice(0, 8)) {
    console.error(`  • ${line}`);
  }
  if (errors.length > 8) {
    console.error(`  • …and ${errors.length - 8} more`);
  }

  if (authFailures > 0) {
    console.error(
      `\nProject ${ref ?? "?"} — password rejected by pooler (${passwordLen} chars in .env.local).\n` +
        "This is NOT caused by .env.example (that file is never loaded).\n\n" +
        "Try these in order:\n" +
        "  1. Supabase → Connect → Session pooler → copy the FULL URI into .env.local as DATABASE_URL=...\n" +
        "     (do not re-type the password — paste the whole string from the dashboard)\n" +
        "  2. Settings → Database → Reset password → use a simple alphanumeric password only\n" +
        "  3. Settings → General → Restart project, wait 2 min, retry npm run db:migrate\n" +
        "  4. SQL Editor: run each file in supabase/migrations/ (001 … 008) — no CLI needed\n",
    );
  } else {
    console.error(
      "\nTry DATABASE_URL from Supabase → Connect, or run migrations via SQL Editor.",
    );
  }
  process.exit(1);
}

const files = listMigrationFiles();

if (files.length === 0) {
  console.error(`No .sql files found in ${migrationsDir}`);
  process.exit(1);
}

const client = await connectWithFallback();

try {
  console.log(`Running ${files.length} migration file(s)…`);

  await client.query(`
    create table if not exists public._schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = await getAppliedMigrations(client);
  let ran = 0;

  for (const filename of files) {
    if (applied.has(filename)) {
      console.log(`  skip ${filename} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(migrationsDir, filename), "utf8");
    console.log(`  run  ${filename}…`);
    await client.query(sql);
    await recordMigration(client, filename);
    ran += 1;
    console.log(`  done ${filename}`);
  }

  if (ran === 0) {
    console.log("All migrations already applied.");
  } else {
    console.log(`Applied ${ran} migration(s) successfully.`);
  }
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
