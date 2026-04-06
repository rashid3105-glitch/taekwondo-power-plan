import { useState, useEffect } from "react";
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
  // Already a path
  return avatarUrl.split("?")[0];
}

/**
 * Returns a signed URL for a given avatar_url stored in profiles.
 * Falls back to null if signing fails.
 */
export function useAvatarUrl(avatarUrl: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarUrl) {
      setSignedUrl(null);
      return;
    }

    let cancelled = false;
    const path = extractPath(avatarUrl);

    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!cancelled) {
          setSignedUrl(error ? null : data?.signedUrl ?? null);
        }
      });

    return () => { cancelled = true; };
  }, [avatarUrl]);

  return signedUrl;
}
