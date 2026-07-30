// Offline-safe auth helpers.
//
// `supabase.auth.getUser()` performs a NETWORK request to /auth/v1/user.
// Offline it rejects (or hangs), which used to leave screens empty or bounce
// the user to /auth. `getSession()` reads the persisted session from local
// storage and works with no connectivity, so it is the correct primitive for
// every screen that must render offline.

import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine !== false;
}

/**
 * Returns the current user without requiring connectivity.
 * Online: verifies against the server, but falls back to the local session
 * if the verification call fails (flaky network, captive portal, timeout).
 * Offline: reads the locally persisted session only.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const localUser = session?.user ?? null;

  if (!isOnline()) return localUser;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return localUser;
    return data.user ?? localUser;
  } catch {
    return localUser;
  }
}

/** Convenience: just the user id, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * True only when we can be sure the user is signed out (i.e. there is no
 * persisted session at all). Use this before redirecting to /auth so that a
 * missing network connection never logs anybody out.
 */
export async function isDefinitelySignedOut(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !session?.user;
}
