## Goal

Make it easy to assign or reassign a coach to an athlete from two places:

1. **Admin → Approval list** (already exists; verify still rendering for all athletes)
2. **Coach → Athlete page → Manage tab** (currently missing — add it)

## Background

The assign-coach dropdown today only lives in `src/pages/AdminApproval.tsx` (lines 766–793). It uses the existing `reassignAthlete(athleteId, coachId | null)` helper that updates `coach_athletes` for that athlete. Since coach-created athletes are now auto-approved, they no longer appear in the "Pending" list — but the Approval list filter does include approved athletes (filter "approved" or "all"), so the control is still reachable there. We'll just make sure the filter default surfaces it clearly.

The Coach Athlete Overview page (`src/pages/CoachAthleteOverview.tsx`) renders `CoachAthleteDetail` inside the "manage" tab but that component currently has no coach reassignment UI.

## Changes

### 1. `src/components/CoachAthleteDetail.tsx` — add Assign Coach card

At the top of the Manage tab content, add a small card:

- Shows **current coach** name (from `coach_athletes` → coach profile)
- A `Select` listing all coaches in the same club (queried from `profiles` joined with `user_roles` where role = 'coach' and same `club_id` as the athlete)
- On change, call an edge function `reassign-athlete-coach` (new, service-role) that:
  - Deletes existing `coach_athletes` row(s) for that athlete
  - Inserts a new `coach_athletes` row with the chosen `coach_id` (or leaves empty if "No coach")
- Only visible to users with `admin` role OR the athlete's current coach (so a coach can hand off to another coach in their club). Non-admin non-current-coach see read-only "Current coach: X".

Reuse i18n keys already present: `assignToCoach`, `currentCoach`, `selectCoach`, `noCoach`, `reassignCoach`.

### 2. New edge function `supabase/functions/reassign-athlete-coach/index.ts`

Service-role function. Input: `{ athlete_id, coach_id | null }`. Auth: caller must be admin OR currently assigned coach of that athlete. Performs delete + optional insert in `coach_athletes`.

Config: add `verify_jwt = true` block in `supabase/config.toml` (default, no change needed).

### 3. `src/pages/AdminApproval.tsx` — minor

No structural change. The dropdown already renders for every non-coach user regardless of `is_approved`. Confirm by selecting "Approved" or "All" in the status filter.

## Out of scope

- No DB schema changes (uses existing `coach_athletes` table and policies).
- No changes to Squad Overview row actions.

## Technical notes

- Coach list query: `profiles` filtered by `club_id = athlete.club_id`, joined with `user_roles` where `role = 'coach'`.
- Permission check in edge function uses `has_role(auth.uid(), 'admin')` and a lookup in `coach_athletes` for current coach.
- After successful reassignment, call `onRefresh()` so the Manage tab re-fetches.
