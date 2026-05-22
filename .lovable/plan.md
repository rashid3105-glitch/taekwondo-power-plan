# Why the pill is missing

The pill code is in place (`src/pages/Dashboard.tsx` lines 540–552) and renders when `isCoach && coachAthleteMode === "athlete"`. The reason you don't see it is that **`isCoach` is `false` for your account on the Dashboard page**, even though `CoachDashboard.tsx` treats you as a coach.

Mismatch in role detection:

- **`CoachDashboard.tsx` line 161** — coach OR admin counts as coach:
  ```ts
  const isCoach = userRoles.some(r => r === "coach" || r === "admin");
  ```
- **`Dashboard.tsx` line 318** — only `"coach"` counts:
  ```ts
  if (roles?.some(r => r.role === "coach")) { setIsCoach(true); ... }
  ```

So if your `user_roles` row is `admin` (or you reached `/dashboard` via something that didn't trigger the coach path), `isCoach` stays `false` and the pill is hidden.

A second smaller issue: line 318 also force-flips `coachAthleteMode` to `"coach"` on every load. That's fine for the bottom-nav, but it means once you press "Mig" and switch to athlete, the next page refresh kicks you back to coach mode without ever letting the pill be visible across reloads. We'll persist the chosen mode.

# Fix

Single file: `src/pages/Dashboard.tsx`.

1. **Align role detection with `CoachDashboard.tsx`** (line 317–318):
   ```ts
   const { data: roles } = await supabase
     .from("user_roles").select("role").eq("user_id", user.id);
   const coachOrAdmin = roles?.some(r => r.role === "coach" || r.role === "admin");
   if (coachOrAdmin) setIsCoach(true);
   ```
   Remove the unconditional `setCoachAthleteMode("coach")` from this branch.

2. **Persist the chosen mode** so the pill toggle survives reloads:
   - Initial state reads `localStorage.getItem("tkd-coach-mode")` (fallback `"athlete"` for non-coaches, `"coach"` for coaches on first load).
   - Both setters (the `Mig` bottom-nav button at line 673 and the header pill onClick at line 544) write the new value to `localStorage`.

3. No changes to the pill JSX, translations, bottom-nav layout, or any other file.

# Verification

- Log in as an account whose `user_roles.role = "admin"` → land on `/dashboard` → the Coach pill should appear in the header next to the language switcher.
- Log in as a coach → press `Mig` in coach-mode bottom nav → land on athlete `/dashboard` → pill appears → refresh → still in athlete mode, pill still visible.
- Non-coach athlete account → no pill (unchanged behaviour).

# Out of scope

- Migrating `coachAthleteMode` to a shared context.
- Any change to `CoachDashboard.tsx`, bottom-nav structure, or RLS.
