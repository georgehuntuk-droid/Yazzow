import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminKey } from "@/lib/supabase/admin-key";
import { createClient } from "@/lib/supabase/server";

function assertTutorPath(tutorId: string, path: string) {
  if (!path.startsWith(`${tutorId}/`)) {
    throw new Error("Invalid storage path for tutor.");
  }
}

function hasAdminClient() {
  return hasSupabaseAdminKey();
}

type UploadInput = {
  tutorId: string;
  bucket: string;
  path: string;
  bytes: ArrayBuffer;
  contentType: string;
  upsert?: boolean;
};

export async function uploadTutorFile(input: UploadInput) {
  assertTutorPath(input.tutorId, input.path);

  const options = {
    contentType: input.contentType,
    upsert: input.upsert ?? false,
  };

  if (hasAdminClient()) {
    const admin = createAdminClient();
    return admin.storage.from(input.bucket).upload(input.path, input.bytes, options);
  }

  const supabase = await createClient();
  return supabase.storage.from(input.bucket).upload(input.path, input.bytes, options);
}

export async function removeTutorFiles(
  tutorId: string,
  bucket: string,
  paths: string[],
) {
  for (const path of paths) {
    assertTutorPath(tutorId, path);
  }

  if (paths.length === 0) return { error: null };

  if (hasAdminClient()) {
    const admin = createAdminClient();
    return admin.storage.from(bucket).remove(paths);
  }

  const supabase = await createClient();
  return supabase.storage.from(bucket).remove(paths);
}
