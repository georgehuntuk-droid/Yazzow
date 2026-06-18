import { NextResponse } from "next/server";
import pg from "pg";

const POOLER_REGIONS = [
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "ap-southeast-1",
];

function getProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    return null;
  }
}

function buildConnectionCandidates(password: string, ref: string) {
  const candidates = [];
  const encodedPassword = encodeURIComponent(password);

  for (const region of POOLER_REGIONS) {
    for (const prefix of ["aws-0", "aws-1"]) {
      candidates.push({
        label: `pooler ${prefix} (${region}, session :5432)`,
        url: `postgresql://postgres.${ref}:${encodedPassword}@${prefix}-${region}.pooler.supabase.com:5432/postgres`,
      });
    }
  }

  candidates.push({
    label: "direct db.*.supabase.co :5432",
    url: `postgresql://postgres:${encodedPassword}@db.${ref}.supabase.co:5432/postgres`,
  });

  return candidates;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // Protect the route using a strong secret token
  if (token !== "run_migrations_xyz_9988") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = getProjectRef();

  if (!password || !ref) {
    return NextResponse.json(
      {
        error: "Missing database credentials or project reference in production environment.",
        hasPassword: !!password,
        hasRef: !!ref,
      },
      { status: 500 }
    );
  }

  const candidates = buildConnectionCandidates(password, ref);
  let client: pg.Client | null = null;
  let connectedLabel = "";
  const errors: string[] = [];

  for (const candidate of candidates) {
    const testClient = new pg.Client({
      connectionString: candidate.url,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await testClient.connect();
      client = testClient;
      connectedLabel = candidate.label;
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${candidate.label}: ${msg}`);
      try {
        await testClient.end();
      } catch {
        // ignore
      }
    }
  }

  if (!client) {
    return NextResponse.json(
      {
        error: "Failed to connect to the database with any connection candidate.",
        connectionAttempts: errors,
      },
      { status: 500 }
    );
  }

  try {
    const results: string[] = [];

    // Run the migrations
    const queries = [
      // 1. Ensure cover_url exists
      `alter table public.tutor_profiles add column if not exists cover_url text;`,

      // 2. Drop worksheets policies
      `drop policy if exists "Tutors upload own worksheets" on storage.objects;`,
      `drop policy if exists "Tutors read own worksheets" on storage.objects;`,
      `drop policy if exists "Tutors update own worksheets" on storage.objects;`,
      `drop policy if exists "Tutors delete own worksheets" on storage.objects;`,
      `drop policy if exists "worksheets_tutor_all" on storage.objects;`,

      // 3. Create worksheets policy
      `create policy "worksheets_tutor_all"
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
        );`,

      // 4. Drop avatar policies
      `drop policy if exists "Tutors upload own avatars" on storage.objects;`,
      `drop policy if exists "Public read avatars" on storage.objects;`,
      `drop policy if exists "Tutors update own avatars" on storage.objects;`,
      `drop policy if exists "Tutors delete own avatars" on storage.objects;`,
      `drop policy if exists "avatars_public_read" on storage.objects;`,
      `drop policy if exists "avatars_tutor_all" on storage.objects;`,

      // 5. Create avatar policies
      `create policy "avatars_public_read"
        on storage.objects
        for select
        to public
        using (bucket_id = 'avatars');`,

      `create policy "avatars_tutor_all"
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
        );`,

      // 6. Digital resources policies
      `drop policy if exists "Tutors insert own resources" on public.digital_resources;`,
      `create policy "Tutors insert own resources"
        on public.digital_resources
        for insert
        to authenticated
        with check (auth.uid() = tutor_id);`,

      `drop policy if exists "Tutors update own resources" on public.digital_resources;`,
      `create policy "Tutors update own resources"
        on public.digital_resources
        for update
        to authenticated
        using (auth.uid() = tutor_id)
        with check (auth.uid() = tutor_id);`,

      `drop policy if exists "Tutors delete own resources" on public.digital_resources;`,
      `create policy "Tutors delete own resources"
        on public.digital_resources
        for delete
        to authenticated
        using (auth.uid() = tutor_id);`,

      // 7. Reload schema cache
      `notify pgrst, 'reload schema';`
    ];

    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      try {
        await client.query(q);
        results.push(`Success query ${i + 1}`);
      } catch (qErr) {
        const msg = qErr instanceof Error ? qErr.message : String(qErr);
        results.push(`Failed query ${i + 1}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      connectedVia: connectedLabel,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Migration execution error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}
