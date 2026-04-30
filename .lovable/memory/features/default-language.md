---
name: Default language preference
description: profiles.default_locale stores per-user starting language; LanguageContext applies it once per session
type: feature
---
- `profiles.default_locale` (text, nullable) holds the user's preferred starting language.
- Editable in Profile (ProfileSetup) via a flag-emoji `<select>`. Saved through `update-my-profile` Edge Function (zod enum: en/da/sv/no/de/ar).
- `src/i18n/LanguageContext.tsx` re-applies the saved `default_locale` once per fresh session via `supabase.auth.onAuthStateChange` + initial `getSession`. Mid-session switches via `LanguageSwitcher` still work but don't overwrite the stored default.
- localStorage key `tkd-lang` keeps the active locale; default_locale overrides it on each new session/load.
