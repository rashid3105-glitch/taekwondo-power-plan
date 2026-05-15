## Root cause

The `parent-signup` edge function upserts a `phone` column into `profiles`, but that column doesn't exist. PostgREST returns:

```
500 {"error":"Could not find the 'phone' column of 'profiles' in the schema cache"}
```

By that point the auth user is already created, so any retry hits `"A user with this email address has already been registered"`. The client surfaces only the generic `FunctionsHttpError` message ("Edge Function returned a non-2xx status code"), hiding the real reason.

## Fix plan

### 1. `supabase/functions/parent-signup/index.ts`
- Remove `phone` from the `profiles` upsert. Phone is already saved in `auth.users.user_metadata` via `createUser`, which is sufficient.
- If `createUser` returns "already registered", attempt to look up the existing user by email and, if `is_parent` is true OR they have no profile, treat it as a recoverable case: re-run profile upsert + invite link, return `{ ok: true }`. This makes the broken account self-heal on next attempt.
- After a successful `createUser`, wrap the remaining steps in try/catch and on failure call `admin.auth.admin.deleteUser(userId)` so a partial failure doesn't leave an orphan auth user.

### 2. `src/pages/ParentJoin.tsx` — show the real error
Replace `if (error) throw error;` with code that reads the response body from `FunctionsHttpError`:

```ts
if (error) {
  let msg = error.message;
  try { const body = await (error as any).context?.json?.(); if (body?.error) msg = body.error; } catch {}
  throw new Error(msg);
}
```

So users see "A user with this email address has already been registered" instead of the generic message.

### 3. Repair the stuck account `farooq.rashid@signicat.com` (migration)
One-off SQL to fix the existing broken parent so they can sign in and use the dashboard:

- Update their `profiles` row: `is_parent=true, is_approved=true, onboarding_completed=true`.
- Insert a `parent_athletes` link to the athlete that owned the invite they redeemed (look up via the most recent `parent_invites` for that athlete, or — if the invite is still unused — mark it used and set `parent_user_id` to this user).

### 4. Verification
- Curl `parent-signup` with a fresh invite + new email → expect `200 {ok:true}`, profile flipped, invite used, link inserted.
- Curl again with same email → recovery branch should also return `200`.
- In the UI, retry with the existing `farooq.rashid@signicat.com` account: signin path links them and lands on `/parent-dashboard`; if they try the signup path, the toast now shows the real "already registered" message.

## Files changed
- `supabase/functions/parent-signup/index.ts` — drop `phone` from upsert, add already-registered recovery, rollback on partial failure.
- `src/pages/ParentJoin.tsx` — extract real error body from `FunctionsHttpError` in `handleSignup`.
- New migration — repair the one stuck parent account.
