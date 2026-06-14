import pg from "pg";
import { buildConnectionCandidates } from "./db-connection.mjs";

const candidates = buildConnectionCandidates();
if (candidates.length === 0) {
  console.error("No database connection candidates found in environment.");
  process.exit(1);
}

const url = candidates[0].url;
console.log("Connecting using candidate URL:", candidates[0].label);

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected successfully to DB!");

  // List all columns in tutor_profiles
  const tableInfo = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tutor_profiles'
  `);
  console.log("Tutor Profiles table columns:");
  tableInfo.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

  // Fetch profiles and print them
  const profiles = await client.query(`
    SELECT id, username, display_name, is_platform_admin 
    FROM tutor_profiles
  `);
  console.log("\nRegistered Tutor Profiles:");
  profiles.rows.forEach(p => {
    console.log(`  Profile ID: ${p.id}, Username: ${p.username}, Display Name: ${p.display_name}, IsPlatformAdmin: ${p.is_platform_admin}`);
  });

  // Let's query auth.users if possible
  try {
    const authUsers = await client.query(`
      SELECT id, email FROM auth.users
    `);
    console.log("\nAuth Users:");
    authUsers.rows.forEach(u => {
      console.log(`  User ID: ${u.id}, Email: ${u.email}`);
    });
  } catch (err) {
    console.log("Could not query auth.users directly (might not have enough privileges or schema access):", err.message);
  }

} catch (err) {
  console.error("Database query failed:", err);
} finally {
  await client.end();
}
