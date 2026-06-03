import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

config({ path: ".env" });
config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "supabase", "setup_storage_buckets.sql");

const POOLER_REGIONS = [
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
];

function buildConnectionCandidates() {
  if (process.env.DATABASE_URL) {
    return [{ label: "DATABASE_URL", url: process.env.DATABASE_URL }];
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !supabaseUrl) return [];

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const encoded = encodeURIComponent(password);

  return POOLER_REGIONS.map((region) => ({
    label: region,
    url: `postgresql://postgres.${projectRef}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
  }));
}

const candidates = buildConnectionCandidates();
if (candidates.length === 0) {
  console.error(
    "Missing DATABASE_URL or SUPABASE_DB_PASSWORD.\n" +
      "Easiest fix: open Supabase → SQL Editor and paste supabase/setup_storage_buckets.sql",
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
let connected = false;

for (const candidate of candidates) {
  const client = new pg.Client({
    connectionString: candidate.url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(`Connected (${candidate.label}). Creating storage buckets…`);
    await client.query(sql);
    console.log('Done. Buckets "avatars" and "worksheets" should now exist.');
    await client.end();
    connected = true;
    break;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  skip ${candidate.label}: ${message.split("\n")[0]}`);
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

if (!connected) {
  console.error(
    "\nCould not connect. Use Supabase SQL Editor instead:\n" +
      "  1. Dashboard → SQL Editor → New query\n" +
      "  2. Paste contents of supabase/setup_storage_buckets.sql\n" +
      "  3. Run\n" +
      "  4. Check Storage sidebar for avatars + worksheets buckets",
  );
  process.exit(1);
}
