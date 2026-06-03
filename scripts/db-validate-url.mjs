import "./db-connection.mjs";

const raw = process.env.DATABASE_URL ?? "";
const value = raw.trim().replace(/^["']|["']$/g, "");

console.log("DATABASE_URL diagnostics (value hidden):");
console.log(`  length: ${value.length}`);
console.log(`  starts with postgresql://: ${value.startsWith("postgresql://")}`);
console.log(`  starts with postgres://: ${value.startsWith("postgres://")}`);
console.log(`  contains spaces/newlines: ${/\s/.test(value)}`);
console.log(`  has pooler host: ${/\.pooler\.supabase\.com/.test(value)}`);
console.log(`  has user@host pattern: ${/postgres[^@]*@/.test(value)}`);

let parsed = false;
try {
  const u = new URL(value.replace(/^postgresql:/, "http:"));
  parsed = Boolean(u.hostname);
  console.log(`  URL parses: yes (host ${u.hostname})`);
} catch {
  console.log("  URL parses: NO — fix format in .env.local");
}

if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) {
  console.error(
    "\nFix: line must start with postgresql:// (copy from Supabase Connect, not the API page).",
  );
}
if (/\s/.test(value)) {
  console.error("\nFix: remove spaces or line breaks — URI must be one line.");
}
