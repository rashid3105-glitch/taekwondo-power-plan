import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the storage path from a stored avatar_url.
 * Handles both full public URLs and raw paths.
 */
function extractPath(avatarUrl: string): string {
  const marker = "/object/public/avatars/";
  const idx = avatarUrl.indexOf(marker);
  if (idx !== -1) {
    return avatarUrl.substring(idx + marker.length).split("?")[0];
  }
  return avatarUrl.split("?")[0];
}

/**
 * Returns a public URL for a given avatar_url stored in profiles.
 * The avatars bucket is public, so we use getPublicUrl (synchronous).
 */
export function useAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  const path = extractPath(avatarUrl);
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  if (!data?.publicUrl) return null;
  // Preserve cache-busting suffix if present
  const qIdx = avatarUrl.indexOf("?");
  if (qIdx !== -1) {
    return data.publicUrl + avatarUrl.substring(qIdx);
  }
  return data.publicUrl;
}
