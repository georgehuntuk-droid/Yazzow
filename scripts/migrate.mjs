import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");

const POOLER_REGIONS = [
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
];

function getProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return new URL(supabaseUrl).hostname.split(".")[0];
}

function buildConnectionCandidates() {
  const candidates = [];

  if (process.env.DATABASE_URL) {
    candidates.push({ label: "DATABASE_URL", url: process.env.DATABASE_URL });
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const projectRef = getProjectRef();

  if (!password || !projectRef) {
    return candidates;
  }

  const encodedPassword = encodeURIComponent(password);
  const preferredRegion = process.env.SUPABASE_DB_REGION;

  const regions = preferredRegion
    ? [preferredRegion, ...POOLER_REGIONS.filter((r) => r !== preferredRegion)]
    : POOLER_REGIONS;

  for (const region of regions) {
    candidates.push({
      label: `pooler (${region})`,
      url: `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    });
  }

  candidates.push({
    label: "direct (IPv6)",
    url: `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
  });

  return candidates;
}

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

  if (candidates.length === 0) {
    console.error(
      "Missing DATABASE_URL or SUPABASE_DB_PASSWORD + NEXT_PUBLIC_SUPABASE_URL.\n" +
        "Option A — add to .env.local:\n" +
        "  SUPABASE_DB_PASSWORD=your-password\n" +
        "  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co\n" +
        "Option B — Supabase → Connect → copy Session pooler URI as DATABASE_URL\n" +
        "Option C — run SQL in Supabase Dashboard → SQL Editor (see README)",
    );
    process.exit(1);
  }

  const errors = [];

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
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }

  console.error("Could not connect to Supabase Postgres:\n");
  for (const line of errors.slice(0, 4)) {
    console.error(`  • ${line}`);
  }
  if (errors.length > 4) {
    console.error(`  • …and ${errors.length - 4} more`);
  }
  console.error(
    "\nIf you see 'password authentication failed', reset the DB password in Supabase,\n" +
      "update .env.local, save the file (Ctrl+S), wait 1–2 minutes, and retry.\n" +
      "Or paste both SQL files in Supabase → SQL Editor (no CLI password needed).",
  );
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
