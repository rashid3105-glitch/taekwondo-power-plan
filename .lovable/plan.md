## Problem

In the new athlete hub, the 2×2 "Pinned modules" grid has 4 tiles: **Træningsplan, Fremgang, Konkurrencer, Match-analyse**. Two of them don't work:

- **Træningsplan** tile → `navigate("/dashboard")` — user is already on `/dashboard`, so nothing happens.
- **Fremgang** tile → `navigate("/dashboard?tab=progress")` — `Dashboard.tsx` never reads the `tab` query param, so the page reloads on the Hub tab and the Progress view is never shown.
- Konkurrencer (`/competitions`) and Match-analyse (`/match-analysis/me`) are real routes and should already work; will verify.

## Fix

Update `src/components/hub/HubPinnedModules.tsx` and the call site in `src/pages/Dashboard.tsx` so the **plan** and **progress** tiles switch the in-page tab instead of navigating.

### `HubPinnedModules.tsx`
- Add an `onTab(tab: "plan" | "progress")` prop.
- Replace the `navigate("/dashboard")` and `navigate("/dashboard?tab=progress")` `onClick`s with `onTab("plan")` and `onTab("progress")`.
- Keep `navigate("/competitions")` and `navigate("/match-analysis/me")` for the other two tiles.

### `src/pages/Dashboard.tsx` (call site, ~line 637)
- Pass `onTab={(tab) => handleTabChange(tab)}` so clicking the tile activates the existing tab logic (which also handles entitlement gates).

## Out of scope
- No changes to OtherModules chips, Today hero, Recovery strip, or any other tab.
- No new routes, no query-param routing, no business-logic changes.
