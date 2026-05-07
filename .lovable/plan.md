## Goal
Translate the 8 new `/platform/:slug` pages (Coach Dashboard, Plan Builder, Squad Reports, Roster, Diary, Readiness, Progress, Library) into all 5 supported languages: Danish, English, Swedish, German, Arabic — matching the rest of the app.

## Current state
`src/pages/PlatformPage.tsx` hardcodes English strings in a `CONTENT` map (title, intro, 4 bullets, image alt, meta description per slug) plus a few fixed UI strings ("For Coaches", "For Athletes", "Real screenshot from inside Sportstalent.", "14-day trial · no credit card required", "Next: ...", "Start free"). None of it goes through the `t()` translator.

## Approach

1. **Move per-slug copy into a localized strings module** — `src/pages/platformPageStrings.ts`, mirroring the pattern already used by `coachLandingStrings.ts`. Shape:
   ```ts
   platformStrings[locale][slug] = { title, intro, bullets[4], imageAlt, metaDesc }
   ```
   Plus a small `platformUI[locale]` block for the shared chrome strings (audience badges, screenshot caption, trial line, "Next:", "Start free").

2. **Translate all content into DA, EN, SV, DE, AR.**
   - DA is the primary marketing language (matches club landing page memory).
   - AR uses the same RTL handling already in place via `LanguageContext` / `dir` attribute — no extra work needed in this page since layout is symmetric.
   - Keep terminology consistent with existing translations in `src/i18n/translations.ts` (e.g. "Træner", "Atlet", "Parathed", "Dagbog", "Sæsonplan", "Bibliotek").

3. **Refactor `PlatformPage.tsx`** to:
   - Read current locale from `useLanguage()`.
   - Look up content as `platformStrings[locale][slug]` with English fallback only for safety (memory rule: no English fallback for *generated* plans — this is static marketing copy, fallback is acceptable but every locale will be fully populated so it never triggers).
   - Replace the hardcoded "For Coaches/Athletes", "Real screenshot…", "14-day trial…", "Next: …", "Start free", "Back" labels with the localized UI block.
   - Keep images, routing, animations, audience colors unchanged.

4. **Verify** by switching locale on a platform page and checking each of the 8 slugs renders translated title + intro + bullets + meta.

## Files touched
- `src/pages/platformPageStrings.ts` — new, ~5 locales × 8 slugs of copy + shared UI strings
- `src/pages/PlatformPage.tsx` — swap hardcoded `CONTENT` for localized lookup

## Out of scope
- No changes to `coachLandingStrings.ts` (already localized).
- No changes to routes, images, or footer link mappings.
- No changes to `translations.ts` — platform marketing copy lives alongside the page like the coach landing strings do, to avoid bloating the global translations file.
