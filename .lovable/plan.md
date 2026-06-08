## Goal
When an athlete accepts a coach's invite link, they should be granted access immediately — no admin approval step. Today the invite flow sets `is_approved = false` and parks the athlete in the admin approval queue.

## Root cause
The `public.apply_invite_to_my_profile(_code)` SQL function (called from `JoinInvite.tsx` and `InviteSignup.tsx`) sets:
```
is_approved = false
pending_invite_code = <code>
pending_coach_id = <coach>
```
The athlete then has to wait for `admin_approve_with_invite` to be run from `AdminApproval.tsx`.

## Changes

### 1. Database migration — rewrite `apply_invite_to_my_profile`
Make it do, in one shot, what `admin_approve_with_invite` does today when a pending invite is present:

- Validate invite (active, not expired) — unchanged.
- Update `profiles` for the calling user:
  - `is_approved = true`
  - `club_id = COALESCE(invite.club_id, club_id)`
  - `pending_invite_code = NULL`
  - `pending_coach_id = NULL`
  - `rejection_reason = NULL`
- `INSERT INTO coach_athletes (coach_id, athlete_id) VALUES (invite.coach_id, auth.uid()) ON CONFLICT DO NOTHING`.
- `UPDATE coach_invites SET uses_count = uses_count + 1 WHERE id = invite.id`.
- Return `{ ok: true, club_id, coach_id, auto_approved: true }`.

Security: keep `SECURITY DEFINER`, `search_path = public`. The function only operates on `auth.uid()`'s own profile, so no privilege escalation. Admin manual approval (`admin_approve_with_invite`) stays in place for the legacy flow / coach-request flow.

### 2. `src/pages/JoinInvite.tsx` — drop pending-approval UX
Current behavior on success: shows `joinRequestSent` + `pendingApprovalDesc`, signs the user out, redirects to `/`.

New behavior on success:
- Show a brief "Welcome — you're in" confirmation (reuse an existing translation like `joinClubConfirm` or add a new key set across all 7 locales — `da/en/sv/de/ar/no/es`).
- Navigate straight to `/dashboard` (or `/onboarding` if the profile hasn't been set up — match `InviteSignup.tsx`'s post-signup route).
- Do NOT sign the user out.

### 3. `src/pages/InviteSignup.tsx` — no functional change needed
It already routes to `/onboarding` after `apply_invite_to_my_profile`. The new function auto-approves, so the dashboard will load normally instead of bouncing to `PendingApproval`.

### 4. Translations
Add 1 new key (e.g. `joinWelcomeIn`) across all 7 locales in `src/i18n/translations.ts` if a suitable existing key isn't reusable.

### 5. Help.tsx + changelog
Short changelog entry: "Atleter der tilmelder sig via en trænerinvitation får adgang med det samme — ingen admin-godkendelse." (translated for all locales).

## Out of scope
- Coach role requests (`wants_coach`) — these still require admin approval.
- Athletes who sign up without an invite — still require admin approval (unchanged).
- RLS, schema columns, `admin_approve_with_invite` — untouched.

## Verification
1. Coach generates invite, athlete (new account) opens `/invite/<code>` → signs up → lands on `/onboarding` then `/dashboard` (not `/pending-approval`).
2. Already-signed-in athlete on `/join/<code>` → "Send request" → lands on dashboard, linked to coach + club.
3. `coach_athletes` row exists; `profiles.is_approved = true`; `coach_invites.uses_count` incremented.
4. Admin queue no longer contains invite-joined athletes.
