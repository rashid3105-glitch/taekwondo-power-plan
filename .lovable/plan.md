## What I found

Tommy Mortensen (`UC Copenhagen`, user `40edad3a…`) has the `coach` role correctly in the database. The screenshot shows him on `/dashboard` (athlete view), so he gets the **athlete bottom nav**: `I dag · Træn · Sæsonkalender · Dagbog · Match-analyse`.

The "Fremmøde" rename only applies to the **coach** bottom nav (`CoachDashboard`/`CoachToday`), reached at `/coach`. So this isn't an old/cached menu — it's the athlete nav, which is what `/dashboard` always renders.

Why he's stuck on the athlete view:

- `CoachModeContext` reads `localStorage["tkd-coach-mode"]`. If the key is missing or set to `"athlete"`, `isCoachMode === false`.
- `Dashboard.tsx` only auto-redirects coaches to `/coach` when `isCoachMode` is already `true` (lines 196–208).
- Result: a coach whose flag has never been set (new device, cleared storage, or who once clicked "Home" in the side menu — which explicitly calls `setCoachMode(false)`) lands on `/dashboard` with athlete nav and no obvious way back.

## Fix

Default users with the coach role into coach mode whenever they haven't explicitly chosen athlete mode.

1. **`src/contexts/CoachModeContext.tsx`** — change the stored value from a 2-state string (`"coach"`/`"athlete"`) to a 3-state: `"coach"`, `"athlete"`, or absent (unset). Initial `isCoachMode` stays `false` (we don't know role yet), but expose a setter that's used by a small bootstrapper.

2. **`src/pages/Dashboard.tsx`** — in the existing coach-bounce effect, also trigger when:
   - `hasCoachRole === true`, AND
   - `localStorage.getItem("tkd-coach-mode")` is `null` (user never explicitly chose athlete mode), AND
   - they're on the bare hub tab.
   In that case call `setCoachMode(true)` and `navigate("/coach", { replace: true })`.

   This means: a coach who has never toggled stays a coach. A coach who deliberately clicked "Hjem" (which sets `"athlete"`) keeps the athlete view — the Home button still works as designed.

3. **No DB changes, no translation changes, no UI rewrites.**

## Verification

- Reload preview as Tommy → expect immediate redirect to `/coach` with the coach bottom nav showing "Fremmøde · Træning · Stævner · Beskeder · Mig".
- Click "Hjem" in the side menu → still goes to `/dashboard` athlete view (preserves the recent fix).
- Existing coaches who already have `"coach"` stored → unchanged.
- Athletes (no coach role) → unchanged.
