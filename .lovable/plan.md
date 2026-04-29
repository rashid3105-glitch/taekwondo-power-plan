## Plan

1. Isolate the exact dashboard component causing the render loop
   - Trace the native `/dashboard` mount path across `src/App.tsx`, `src/pages/Dashboard.tsx`, and the widgets that mount immediately there.
   - Focus first on components with async effects and state writes on mount: `FloatingDiaryButton`, `EventRemindersDropdown`, `ReadinessCard`, `RecoveryTile`, `ReflectionPromptCard`, and the app-open wearable sync path.
   - If needed, temporarily narrow the mounted set to identify which component is repeatedly updating state on iPhone.

2. Fix the unstable update path
   - Remove or guard the repeated state update that is causing React error #185 (`Maximum update depth exceeded`).
   - Make the offending effect idempotent so it cannot retrigger endlessly from native lifecycle changes, auth callbacks, or remount churn.
   - If the issue comes from a shared primitive or wrapper, patch it there so the fix applies system-wide instead of only on one page.

3. Validate the native flow that was crashing
   - Verify `/dashboard` opens without the crash on the native build path.
   - Check the likely trigger interactions after load: opening the menu sheet, opening reminders, and loading wearable/readiness widgets.
   - Confirm there are no new console/runtime errors tied to the same route.

## What I believe the problem is

React error `#185` decodes to:
`Maximum update depth exceeded`

So this is not a Health permission error by itself. It means a mounted dashboard component is repeatedly calling state updates during a render/effect cycle. Based on the current code, the highest-risk areas are the dashboard-mounted components that do async auth/data reads on mount plus the native app-open wearable sync hook.

## Technical details

Primary files to inspect and likely adjust:
- `src/App.tsx`
- `src/pages/Dashboard.tsx`
- `src/components/FloatingDiaryButton.tsx`
- `src/components/EventRemindersDropdown.tsx`
- `src/components/ReadinessCard.tsx`
- `src/components/RecoveryTile.tsx`
- `src/components/ReflectionPromptCard.tsx`
- potentially `src/lib/wearables/index.ts` if native foreground sync is causing repeated remount/update pressure

Stabilization approach:
- ensure mount effects do not indirectly retrigger themselves
- avoid repeated state writes when values have not changed
- guard async callbacks after unmount/remount
- prevent native visibility/auth listeners from causing a feedback loop into the dashboard tree