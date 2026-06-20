import { NextResponse } from "next/server";
import pg from "pg";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("secret") !== "yazzow-deploy-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    const password = process.env.SUPABASE_DB_PASSWORD;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (password && url) {
      const projectRef = new URL(url).hostname.split(".")[0];
      connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`;
    }
  }

  if (!connectionString) {
    return NextResponse.json({ error: "Missing connection details in environment." }, { status: 500 });
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log("Connected successfully! Running migration 028 and 029...");

    const sql = `
      -- 1. Migration 028: Add push_subscriptions table
      CREATE TABLE IF NOT EXISTS public.push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- Enable RLS
      ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if any
      DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
      DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
      DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;

      -- Policies for push_subscriptions
      CREATE POLICY "Users can view their own push subscriptions"
          ON public.push_subscriptions FOR SELECT
          USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own push subscriptions"
          ON public.push_subscriptions FOR INSERT
          WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own push subscriptions"
          ON public.push_subscriptions FOR DELETE
          USING (auth.uid() = user_id);

      -- Create index on user_id
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

      -- 2. Migration 029: Alter tutor_profiles
      ALTER TABLE public.tutor_profiles
        ADD COLUMN IF NOT EXISTS portal_bg_style TEXT DEFAULT 'grid',
        ADD COLUMN IF NOT EXISTS portal_side_banner_url TEXT,
        ADD COLUMN IF NOT EXISTS portal_side_banner_link TEXT,
        ADD COLUMN IF NOT EXISTS portal_side_widget_title TEXT,
        ADD COLUMN IF NOT EXISTS portal_side_widget_content TEXT;

      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(sql);
    await client.end();
    
    return NextResponse.json({ ok: true, message: "Database SQL migrations 028 & 029 executed successfully on Live DB!" });
  } catch (err) {
    try {
      await client.end();
    } catch {}
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
