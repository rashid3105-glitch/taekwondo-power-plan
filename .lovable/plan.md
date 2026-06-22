## Goal
Make the existing burger menu (currently only in `Dashboard.tsx`) available in the top-right corner on every page where a user is signed in.

## Approach
Extract the menu into a single reusable component and mount it once globally, so we don't have to add it to each page header manually.

### 1. New component: `src/components/GlobalAppMenu.tsx`
- Owns the trigger button **and** the `Sheet`.
- Button is `position: fixed; top: env(safe-area-inset-top); right: 12px; z-index: 50`, with the same look as the current header button (`Button variant="ghost" size="icon"` + `Menu` icon, red dot indicator).
- Loads its own data via existing hooks/contexts:
  - `useAuth` / current session → if no user, render nothing.
  - `useLanguage` (`t`), `useRole` (`isCoach`, `isAdmin`, `isDemo`), `useActiveClub` (clubName), `useCoachMode` (`coachAthleteMode`), profile fetch (same query Dashboard uses) for avatar + name + belt.
- Re-uses all current menu items, dot-seen logic, sign-out and chat-open behavior.
  - For the chat item: instead of `setChatOpen(true)` (Dashboard-local), navigate to `/messages` (already a route). On Dashboard the bottom-nav still opens the in-page chat sheet; this is only the menu entry.
  - For tab items (Hub/Plan/Calendar/Diary/Mental/etc.): navigate to `/dashboard?tab=<tab>` so they work from any page. Dashboard already reads `activeTab` via its existing `handleTabChange`; we add support for an initial `?tab=` query param if not present (small read of `useSearchParams` in Dashboard).
- Visibility rules: hidden on fully public/marketing/auth routes. Use a `useLocation` pathname check against a denylist: `/`, `/v1`, `/landing`, `/coach-landing`, `/auth`, `/reset-password`, `/signup*`, `/invite*`, `/join*`, `/parent/join`, `/consent`, `/pricing`, `/priser`, `/funktioner`, `/about`, `/platform*`, `/methodology`, `/blog*`, `/contact`, `/terms`, `/privacy*`, `/unsubscribe`, `/seo/*`, `/m/*` (match share), `/a/*` (public athlete), `/payment-success`. Everything else (dashboard, coach, profile, admin, library, season-calendar, diary, competitions, etc.) shows it.

### 2. Mount globally in `src/App.tsx`
- Render `<GlobalAppMenu />` once inside `ConsentGate`, next to `OfflineBanner` / `AppUpdateBanner`, so it sits above all routed pages.

### 3. Remove duplicate from `src/pages/Dashboard.tsx`
- Delete the existing top-right `Menu` trigger button and the `<Sheet open={menuOpen}…>` block (lines ~664 and ~680–809), plus the now-unused `menuOpen` state and related imports.
- Dashboard's own avatar/header row stays as-is; only the burger trigger + Sheet are removed (they live in the global component now).

### 4. No backend / schema changes
- No migrations, edge functions or RLS changes.

## Out of scope
- Visual redesign of the menu itself (same items, same look).
- Changes to bottom navigation, public site nav, or coach top-tab navigation.
- Translations (re-uses existing keys).