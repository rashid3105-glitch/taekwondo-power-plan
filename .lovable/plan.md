# Add "Back to dashboard" on Help page when logged in

## Problem
`/help` renders `PublicNav` regardless of auth state, so signed-in users have no in-app way to return to their dashboard (only the browser back button).

## Change
In `src/pages/Help.tsx`:
- Check the current Supabase session (via `supabase.auth.getSession` + `onAuthStateChange`, matching the pattern used elsewhere).
- If a session exists, render a small "Back to dashboard" button (ArrowLeft icon + `t("backToDashboard")`) near the top of the hero, navigating to `/dashboard` (or `/coach` if the user is a coach — simplest: always `/dashboard`, which already routes coaches correctly).
- If no session, keep current behavior (PublicNav only).

## Translations
Add `backToDashboard` to `src/i18n/translations.ts` for all 7 locales:
- en: "Back to dashboard"
- da: "Tilbage til dashboard"
- sv: "Tillbaka till dashboard"
- de: "Zurück zum Dashboard"
- ar: "العودة إلى لوحة التحكم"
- no: "Tilbake til dashbordet"
- es: "Volver al panel"

## Files
- `src/pages/Help.tsx`
- `src/i18n/translations.ts`

No other changes.
