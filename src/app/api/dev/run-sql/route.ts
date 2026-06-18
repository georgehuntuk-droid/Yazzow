import { NextResponse } from "next/server";
import pg from "pg";

export const dynamic = "force-dynamic";

export async function GET() {
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
    
    const sql = `
      -- 1. Secure Worksheets (private)
      drop policy if exists "Tutors upload own worksheets" on storage.objects;
      drop policy if exists "Tutors read own worksheets" on storage.objects;
      drop policy if exists "Tutors update own worksheets" on storage.objects;
      drop policy if exists "Tutors delete own worksheets" on storage.objects;
      drop policy if exists "worksheets_tutor_all" on storage.objects;

      create policy "worksheets_tutor_all"
        on storage.objects
        for all
        to authenticated
        using (
          bucket_id = 'worksheets'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'worksheets'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- 2. Secure Avatars / Cover Banners (public read, tutor write to own folder)
      drop policy if exists "Tutors upload own avatars" on storage.objects;
      drop policy if exists "Public read avatars" on storage.objects;
      drop policy if exists "Tutors update own avatars" on storage.objects;
      drop policy if exists "Tutors delete own avatars" on storage.objects;
      drop policy if exists "avatars_public_read" on storage.objects;
      drop policy if exists "avatars_tutor_all" on storage.objects;

      create policy "avatars_public_read"
        on storage.objects
        for select
        to public
        using (bucket_id = 'avatars');

      create policy "avatars_tutor_all"
        on storage.objects
        for all
        to authenticated
        using (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        );

      -- 3. Secure digital_resources
      drop policy if exists "Tutors insert own resources" on public.digital_resources;
      create policy "Tutors insert own resources"
        on public.digital_resources
        for insert
        to authenticated
        with check (auth.uid() = tutor_id);

      drop policy if exists "Tutors update own resources" on public.digital_resources;
      create policy "Tutors update own resources"
        on public.digital_resources
        for update
        to authenticated
        using (auth.uid() = tutor_id)
        with check (auth.uid() = tutor_id);

      drop policy if exists "Tutors delete own resources" on public.digital_resources;
      create policy "Tutors delete own resources"
        on public.digital_resources
        for delete
        to authenticated
        using (auth.uid() = tutor_id);
    `;

    await client.query(sql);
    await client.end();
    
    return NextResponse.json({ ok: true, message: "Storage RLS policies applied successfully on Live DB!" });
  } catch (err) {
    try {
      await client.end();
    } catch {}
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
