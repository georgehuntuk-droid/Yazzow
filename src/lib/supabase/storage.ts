import { getSupabaseUrl } from "@/lib/supabase/env";

export const AVATAR_BUCKET = "avatars" as const;
export const MAX_IMAGE_BYTES = 5_242_880;
export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function getPublicStorageUrl(bucket: string, path: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

export function storagePathFromPublicUrl(
  bucket: string,
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}
