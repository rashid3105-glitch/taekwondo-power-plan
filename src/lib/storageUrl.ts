import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts a storage object path from either a stored public/signed URL or a raw path.
 */
export function extractStoragePath(bucket: string, urlOrPath: string): string {
  for (const marker of [`/object/public/${bucket}/`, `/object/sign/${bucket}/`]) {
    const idx = urlOrPath.indexOf(marker);
    if (idx !== -1) return urlOrPath.substring(idx + marker.length).split("?")[0];
  }
  return urlOrPath.split("?")[0];
}

/**
 * Creates a short-lived signed URL for a private bucket object.
 * Accepts either a raw path or a legacy stored public URL.
 */
export async function getSignedStorageUrl(
  bucket: string,
  urlOrPath: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!urlOrPath) return null;
  const path = extractStoragePath(bucket, urlOrPath);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}
