## Problem

When a coach user opens `/dashboard` (the "I dag" tab), the page only shows the readiness banner, greeting, and footer. All module cards (Today's session, Next event, Diary, Messages, Quick access) are gone.

## Root cause

`src/components/hub/AthleteDashboard.tsx` line 174:

```ts
if (activeRole !== "athlete") return null;
```

The component renders the entire athlete hub content, but bails out when `activeRole === "coach"`. Coaches still need to use the athlete dashboard as their own personal home (Dashboard.tsx already gates rendering — it only mounts `<AthleteDashboard />` inside the hub tab, never on `/coach`).

The data-loading `useEffect` is also gated by the same `activeRole !== "athlete"` check, so even if we removed the render guard, the data wouldn't load.

## Fix

In `src/components/hub/AthleteDashboard.tsx`:

1. Remove the `if (activeRole !== "athlete") return null;` early-return (line 174).
2. Remove the `if (activeRole !== "athlete") return;` guard inside the data-loading `useEffect` (line 68), and drop `activeRole` from that effect's dependency array.

This makes `AthleteDashboard` render and load data for every signed-in user that mounts it. Dashboard.tsx already decides when it should mount (only on the hub tab of `/dashboard`), so removing the internal role check is safe and does not affect `/coach`.

## Files to edit

- `src/components/hub/AthleteDashboard.tsx`

## Out of scope

No changes to `CoachDashboard`, role context, routing, RLS, or data fetching logic.
