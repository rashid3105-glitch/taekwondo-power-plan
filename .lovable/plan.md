## Problem

Laila and Sami are coach-only users. Clicking **Testing** or **Rehab** in the side menu briefly flashes the tab content, then bounces back to `/coach`. Same for any other athlete-only tab the side menu surfaces.

## Root cause

`src/pages/Dashboard.tsx` lines 192–200:

```ts
useEffect(() => {
  if (activeClubLoading || !isCoachMode) return;
  const isActiveCoachClub = activeMembership
    ? activeMembership.role_in_club === "coach" || activeMembership.role_in_club === "admin"
    : memberships.length <= 1 && role === "coach";
  if (isActiveCoachClub) {
    navigate("/coach", { replace: true });
  }
}, [role, memberships.length, activeMembership, activeClubLoading, isCoachMode, navigate]);
```

This effect unconditionally hard-redirects any coach in coach-mode away from `/dashboard` — including when the user explicitly opened `/dashboard?tab=testing`. Since Testing and Rehab views only render inside Dashboard, coaches can never reach them while in coach mode.

The entitlements fix from the last turn (`coach` role → `team_small`) is correctly applied; the tier check itself already passes. The only thing blocking access is this route guard.

## Fix

### 1) Let coaches deep-link into athlete-tabs (Dashboard.tsx)

Skip the auto-redirect when the URL already specifies a non-hub tab. Only bounce coaches to `/coach` when they land on the bare Dashboard hub.

```ts
useEffect(() => {
  if (activeClubLoading || !isCoachMode) return;
  // Allow coaches to deep-link to athlete-only tabs (testing, rehab, etc.).
  // Only auto-bounce when they land on the bare hub.
  const requestedTab = searchParams.get("tab");
  if (requestedTab && requestedTab !== "hub") return;

  const isActiveCoachClub = activeMembership
    ? activeMembership.role_in_club === "coach" || activeMembership.role_in_club === "admin"
    : memberships.length <= 1 && role === "coach";
  if (isActiveCoachClub) {
    navigate("/coach", { replace: true });
  }
}, [role, memberships.length, activeMembership, activeClubLoading, isCoachMode, navigate, searchParams]);
```

### 2) Bust entitlements cache on auth/user change (useEntitlements.ts)

`cachedTier` is module-scoped, so a stale value can survive a sign-in/-out or role change until a hard reload. Add an `onAuthStateChange` listener that clears the cache + refetches when the user id changes.

```ts
useEffect(() => {
  // initial fetch (existing code)
  ...
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    cachedTier = null;
    cachedAt = 0;
    fetchTier();
  });
  return () => sub.subscription.unsubscribe();
}, []);
```

## Verification

1. As Laila (coach-only, in coach mode), open `/dashboard?tab=testing` directly — should render `PhysicalTesting` (coach mode), not bounce.
2. Click Testing and Rehab from the Dashboard side menu — should land on the respective tabs.
3. Going to bare `/dashboard` should still bounce to `/coach` (preserves existing UX).
4. Sign out and sign in as a different user → tier should refetch immediately (no stale `cachedTier`).

## Files touched

- `src/pages/Dashboard.tsx` — guard the redirect effect with `searchParams.get("tab")`.
- `src/hooks/useEntitlements.ts` — clear cache + refetch on `onAuthStateChange`.

No DB, RLS, or edge-function changes needed.
