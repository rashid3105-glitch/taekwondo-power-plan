---
name: Default language preference
description: LanguageSwitcher selection (localStorage tkd-lang) is authoritative; profiles.default_locale only seeds first load
type: feature
---
- Active locale lives in `localStorage["tkd-lang"]`. Once set, it is **authoritative** and never overridden on subsequent sessions.
- `profiles.default_locale` (text, nullable) is only a **seed**: applied once per user when there is no `tkd-lang` in localStorage. After seeding it's persisted to localStorage and the switcher controls things from then on.
- Final fallback when neither exists: `"en"`.
- `src/i18n/LanguageContext.tsx` tracks seeded user IDs in `seededUsersRef`; cleared on `SIGNED_OUT` so a different account on the same browser gets its own one-time seed.
- Editable in Profile (ProfileSetup) via flag-emoji `<select>`, saved through `update-my-profile` Edge Function (zod enum: en/da/sv/no/de/ar/es).
