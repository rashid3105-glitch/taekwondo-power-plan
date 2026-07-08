// Native language persistence bridge.
// On iOS/Android (Capacitor), WebView localStorage can be cleared by the OS
// (low storage, app updates, "Clear Website Data"). We mirror the selected
// UI language to Capacitor Preferences so the user's choice survives those
// events — same pattern as nativeAuthStorage.ts.
//
// Web users are unaffected: all functions are no-ops outside native runtime.

import { Capacitor } from "@capacitor/core";

const LANG_KEY = "tkd-lang";

export async function hydrateLangFromPreferences(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const { value } = await Preferences.get({ key: LANG_KEY });
    if (value && !window.localStorage.getItem(LANG_KEY)) {
      window.localStorage.setItem(LANG_KEY, value);
    }
  } catch {
    /* preferences unavailable — fall back silently */
  }
}

export async function writeLangToPreferences(locale: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: LANG_KEY, value: locale });
  } catch {
    /* ignore */
  }
}
