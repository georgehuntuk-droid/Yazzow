const SCHEMA_NOT_READY_PATTERN =
  /schema cache|relation .* does not exist|Could not find the table/i;

const BUCKET_NOT_FOUND_PATTERN = /bucket not found|Bucket not found/i;

const RLS_VIOLATION_PATTERN = /row-level security|violates row-level security/i;

export function isDatabaseSchemaMissingError(message: string | undefined): boolean {
  if (!message) return false;
  return SCHEMA_NOT_READY_PATTERN.test(message);
}

export function isStorageBucketMissingError(message: string | undefined): boolean {
  if (!message) return false;
  return BUCKET_NOT_FOUND_PATTERN.test(message);
}

export const DATABASE_NOT_MIGRATED_MESSAGE =
  "Database tables are not set up yet. Run the migration in Supabase (see README) or add SUPABASE_DB_PASSWORD to .env.local and run: npm run db:migrate";

export const STORAGE_BUCKET_NOT_FOUND_MESSAGE =
  'Storage bucket missing. In Supabase → SQL Editor, run the file supabase/setup_storage_buckets.sql (creates "avatars" and "worksheets" buckets).';

export const STORAGE_RLS_MESSAGE =
  'Upload blocked by storage permissions. In Supabase → SQL Editor, run supabase/fix_storage_rls.sql then try again.';

export function formatSupabaseError(message: string | undefined): string {
  if (isDatabaseSchemaMissingError(message)) {
    return DATABASE_NOT_MIGRATED_MESSAGE;
  }
  if (isStorageBucketMissingError(message)) {
    return STORAGE_BUCKET_NOT_FOUND_MESSAGE;
  }
  if (message && RLS_VIOLATION_PATTERN.test(message)) {
    return STORAGE_RLS_MESSAGE;
  }
  return message ?? "Something went wrong. Please try again.";
}
