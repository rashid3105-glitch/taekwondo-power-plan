# Help page: "Back to dashboard" when logged in

## Problem
`/help` (and other public pages using `PublicNav`) shows a "Sign in" button regardless of auth state. Signed-in users have no in-app way back to their dashboard.

## Change
Update `src/components/PublicNav.tsx`:
- Track session via `supabase.auth.getSession()` + `onAuthStateChange` subscription.
- When a session exists, replace the "Sign in" button (desktop + mobile menu) with a "Back to dashboard" button that navigates to `/dashboard` (Dashboard already redirects coaches/parents appropriately).
- When no session, keep current "Sign in" behavior.

This fixes Help and every other public page using `PublicNav` in one place.

## Translations
Add `backToDashboard` to `src/i18n/translations.ts` for all 7 locales (en, da, sv, de, ar, no, es).

## Files
- `src/components/PublicNav.tsx`
- `src/i18n/translations.ts`
