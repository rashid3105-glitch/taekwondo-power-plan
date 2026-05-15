## Root cause

Two real bugs combine to break the parent signup:

1. **No session after `auth.signUp`.** Email confirmation is required (per project policy), so `signUp` returns a user but no session. `auth.uid()` is `null` on the immediately-following RPC call → `accept_parent_invite` returns `not_authenticated`. The client-side `profiles.upsert` also silently fails RLS.
2. **Wrong column name in the RPC.** It sets `onboarding_complete = true`, but the actual column is `onboarding_completed`. So even if auth worked, the RPC would error before flipping `is_approved`. And the `handle_new_user` trigger doesn't set `is_parent` or `is_approved`, so the parent ends up in the admin approval queue.

## Plan

### 1. New edge function `parent-signup` (service role, public, no JWT)

A single transactional endpoint that does everything server-side, bypassing the email-confirmation race:

Inputs: `code`, `firstName`, `lastName`, `email`, `phone`, `password`.

Steps:
- Validate inputs (zod, password strength server-side).
- Look up invite: `code`, `used_at IS NULL`, `expires_at > now()`. Reject otherwise.
- Create the auth user via admin API with `email_confirm: true` and metadata `{ first_name, last_name, phone, is_parent: true }`.
- Upsert `profiles`: `display_name`, `phone`, `is_parent = true`, `is_approved = true`, `onboarding_completed = true`. (Service role bypasses RLS and the `club_id` guard.)
- Mark invite used (`used_at`, `parent_user_id`) and insert `parent_athletes` link (idempotent).
- Return `{ ok: true }` (or structured error).

### 2. Fix `accept_parent_invite` RPC (migration)

Replace `onboarding_complete` with `onboarding_completed` so the already-logged-in "confirm" path also works correctly.

### 3. Update `src/pages/ParentJoin.tsx`

- `handleSignup` → call `supabase.functions.invoke("parent-signup", { body: { code, firstName, lastName, email, phone, password } })` instead of doing `signUp` + `upsert` + RPC client-side.
- On success, call `signInWithPassword` with the same email/password to establish the session (works because the user is now auto-confirmed), then `navigate("/parent-dashboard")`.
- Remove the 3-attempt upsert retry loop (no longer needed).
- `phase === "confirm"` (already-logged-in) and `phase === "login"` paths keep using the RPC — they already have a session, and the RPC fix handles them.

### 4. Verification

- New parent signup via invite link → no admin approval needed, lands directly on `/parent-dashboard`.
- Already-logged-in user opens link → confirm button links the athlete.
- Existing user opens link in `login` phase → logs in, links athlete.
- `AdminApproval` pending list stays empty for parents (already filters `is_parent`).

## Files

- `supabase/functions/parent-signup/index.ts` (new)
- `supabase/migrations/<new>.sql` — `CREATE OR REPLACE FUNCTION public.accept_parent_invite` with `onboarding_completed`
- `src/pages/ParentJoin.tsx` — rewire `handleSignup`

No changes to `ParentInviteSection`, RLS policies, or the admin queue.
