// Native auth persistence bridge.
// On iOS/Android (Capacitor), WebView localStorage can be cleared by the OS
// (low storage, app updates, "Clear Website Data"). We mirror the Supabase
// auth token to Capacitor Preferences (native secure-ish persistent KV) so
// users stay signed in across those events.
//
// Web users are unaffected: the bridge is a no-op outside native runtime.
//
// Strategy:
//   1) Before React mounts on native, hydrate localStorage from Preferences.
//   2) Subscribe to supabase.auth.onAuthStateChange and mirror the session
//      token back to Preferences on every change.
//
// The auto-generated supabase client (src/integrations/supabase/client.ts)
// uses `storage: localStorage`. We do NOT modify that file. Instead we keep
// localStorage as the source of truth at runtime and use Preferences as
// durable backup.

import { Capacitor } from "@capacitor/core";

const PROJECT_REF =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) ?? "";
const AUTH_STORAGE_KEY = PROJECT_REF ? `sb-${PROJECT_REF}-auth-token` : "";

export async function hydrateAuthFromPreferences(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AUTH_STORAGE_KEY) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: AUTH_STORAGE_KEY });
    if (value && !window.localStorage.getItem(AUTH_STORAGE_KEY)) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, value);
    }
  } catch {
    /* preferences unavailable — fall back silently */
  }
}

export async function bindAuthPersistence(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !AUTH_STORAGE_KEY) return;
  try {
    const [{ Preferences }, { supabase }] = await Promise.all([
      import("@capacitor/preferences"),
      import("@/integrations/supabase/client"),
    ]);

    const writeFromLocalStorage = async () => {
      try {
        const v = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (v) {
          await Preferences.set({ key: AUTH_STORAGE_KEY, value: v });
        } else {
          await Preferences.remove({ key: AUTH_STORAGE_KEY });
        }
      } catch {
        /* ignore */
      }
    };

    supabase.auth.onAuthStateChange(() => {
      // Defer so supabase has already written the new token to localStorage.
      setTimeout(writeFromLocalStorage, 0);
    });

    // Also do an initial sync in case localStorage already has a token
    // that Preferences doesn't yet (first install after web→native upgrade).
    await writeFromLocalStorage();
  } catch {
    /* ignore */
  }
}
