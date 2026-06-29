## Goal
When a user has switched to coach mode, clicking Home (or any nav item) must keep them in coach mode. The only way to drop into athlete mode is the Athlete/Coach toggle in the side menu.

## Change
`src/components/GlobalAppMenu.tsx` — `goTab()` currently forces `setCoachMode(false)` when tab === "hub". Remove that block so coach mode is never silently flipped by navigation.

```diff
- if (tab === "hub" && isCoachMode) {
-   setCoachMode(false);
- }
  navigate(tab === "hub" ? "/dashboard" : `/dashboard?tab=${tab}`);
```

## Why this is enough (verified)
- `src/pages/Dashboard.tsx` (lines 200–221) already redirects to `/coach` when `isCoachMode` is true and the active club role is coach/admin. So navigating to `/dashboard` while in coach mode bounces straight back to the coach dashboard — no athlete UI flashes.
- For non-hub tabs (`plan`, `calendar`, etc.) the Dashboard intentionally lets coaches deep-link, which is the existing behaviour we keep.
- The explicit Athlete/Coach segmented control in the side menu (lines 232–280) still calls `setCoachMode(false/true)` directly — that remains the only way to switch.
- `CoachDashboard.tsx` only calls `setCoachMode(false)` when the user has no coach role / no active coach membership, which is correct and untouched.

## Out of scope
No DB, RLS, translations, or styling changes.
