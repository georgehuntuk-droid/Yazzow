import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { join } from "node:path";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key (truncated):", supabaseKey?.slice(0, 10));

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profiles, error } = await supabase
    .from("tutor_profiles")
    .select("*");

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log("Total profiles found:", profiles.length);
  for (const p of profiles) {
    console.log(`- ID: ${p.id}, Username: ${p.username}, Name: ${p.display_name}, Status: ${p.subscription_status}`);
  }
}

check();
