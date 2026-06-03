/**
 * Applies pending SQL migrations using Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN in .env.local (Account → Access Tokens).
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import "./db-connection.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "supabase", "migrations");
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const ref = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]
  : null;

if (!token || !ref) {
  console.error(
    "Add SUPABASE_ACCESS_TOKEN to .env.local (supabase.com/dashboard/account/tokens), then rerun.",
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((n) => n.endsWith(".sql"))
  .sort();

for (const filename of files) {
  const sql = readFileSync(join(migrationsDir, filename), "utf8");
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`Failed ${filename}:`, res.status, body.slice(0, 400));
    process.exit(1);
  }

  console.log(`Applied ${filename}`);
}

console.log("Done.");
