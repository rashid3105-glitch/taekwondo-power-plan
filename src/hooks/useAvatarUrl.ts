import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Extracts the storage path from a stored avatar_url.
 * Handles both full public URLs and raw paths.
 */
function extractPath(avatarUrl: string): string {
  const publicMarker = "/object/public/avatars/";
  const signMarker = "/object/sign/avatars/";
  for (const marker of [publicMarker, signMarker]) {
    const idx = avatarUrl.indexOf(marker);
    if (idx !== -1) {
      return avatarUrl.substring(idx + marker.length).split("?")[0];
    }
  }
  return avatarUrl.split("?")[0];
}

// Simple in-memory cache so lists don't re-sign the same avatar repeatedly.
const cache = new Map<string, { url: string; expires: number }>();
const TTL_SECONDS = 60 * 60;

/** Drops a cached signed URL so the next render re-signs it (used on <img> errors). */
export function invalidateAvatarUrl(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return;
  cache.delete(extractPath(avatarUrl));
}


/**
 * Returns a signed URL for a given avatar_url stored in profiles.
 * The avatars bucket is private, so access is granted per RLS relationship.
 */
export function useAvatarUrl(avatarUrl: string | null | undefined, nonce = 0): string | null {
  const path = avatarUrl ? extractPath(avatarUrl) : null;
  const cached = path ? cache.get(path) : undefined;
  const initial = cached && cached.expires > Date.now() ? cached.url : null;
  const [url, setUrl] = useState<string | null>(initial);


  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    const hit = cache.get(path);
    if (hit && hit.expires > Date.now()) {
      setUrl(hit.url);
      return;
    }
    void supabase.storage
      .from("avatars")
      .createSignedUrl(path, TTL_SECONDS)
      .then(({ data }) => {
        if (!active) return;
        const signed = data?.signedUrl ?? null;
        if (signed) {
          cache.set(path, { url: signed, expires: Date.now() + (TTL_SECONDS - 60) * 1000 });
        }
        setUrl(signed);
      })
      .catch(() => {
        if (active) setUrl(null);
      });
    return () => {
      active = false;
    };
  }, [path, nonce]);

  return url;
}
