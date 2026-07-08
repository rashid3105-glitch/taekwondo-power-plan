## Problem

On Android (and iOS) the language you pick in `LanguageSwitcher` doesn't stick between app launches. The switcher writes to `localStorage["tkd-lang"]`, but the Android WebView periodically clears `localStorage` (OS storage pressure, app updates, "Clear website data"). When the app relaunches, `localStorage` is empty, so `LanguageContext` falls back to timezone/navigator detection — which on many Android devices reports `en-US` even for Danish users — and the language appears to "reset".

We already handle this exact problem for the Supabase auth token in `src/lib/nativeAuthStorage.ts` by mirroring `localStorage` → `@capacitor/preferences` (native durable KV) and hydrating it back before React mounts. Language preference needs the same treatment; it's currently the only user setting that's not mirrored, which is why auth survives a WebView wipe but locale doesn't.

## Fix

Mirror `tkd-lang` to Capacitor Preferences alongside the auth token, following the same pattern.

### 1. New helper: `src/lib/nativeLangStorage.ts`

- `hydrateLangFromPreferences()` — before React mounts, if `Capacitor.isNativePlatform()` and `localStorage["tkd-lang"]` is empty, read from Preferences and copy into `localStorage`. No-op on web.
- `writeLangToPreferences(locale)` — write current value to Preferences. No-op on web.

### 2. `src/main.tsx`

Call `hydrateLangFromPreferences()` in the existing pre-mount async IIFE, right next to `hydrateAuthFromPreferences()`.

### 3. `src/i18n/LanguageContext.tsx`

- In `setLocale`, after `localStorage.setItem("tkd-lang", l)`, fire-and-forget `writeLangToPreferences(l)`.
- In the profile-seed path (when we set locale from `profiles.default_locale`), also mirror to Preferences so the seeded value survives a WebView wipe.

### Out of scope

- No change to `LanguageSwitcher.tsx` — the UI already works; only persistence is broken on native.
- No new dependency — `@capacitor/preferences` is already in use.
- No web behavior change — all new code is guarded by `Capacitor.isNativePlatform()`.

## Verification

- Web: locale still lives in `localStorage`, unchanged.
- Android: after picking Danish, force-stop app, clear WebView storage from device settings, relaunch → app opens in Danish because Preferences rehydrated it before React mounted.

write what to do after the update (release to ios and android?)