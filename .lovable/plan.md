## Problem

New athlete signs up without an invite code → completes onboarding → `profiles.club_id` is `null`. The Dashboard guard sends them to `/profile-setup`, which is aliased to `/profile`. That page only *displays* the club name — it offers no way to join or skip. Result: infinite loop, the user gives up (as Adam did; manually fixed by adding him to Copenhagen City).

Root causes:

1. `src/pages/Dashboard.tsx` (line 549-551): `if (!profileData.club_id) navigate("/profile-setup")` — dead end.
2. `src/pages/Onboarding.tsx`: an athlete without a `/join/CODE` invite is allowed to finish onboarding without a club and without any "no club" fallback.

The user wants: **a user must be able to continue solo, without a club** ("No club" path). Not just an invite-code prompt.

## Fix

### 1. Remove the hard `club_id` gate on Dashboard
`src/pages/Dashboard.tsx`: delete the `if (!profileData.club_id) navigate("/profile-setup")` block. Solo athletes should be able to use the app. Downstream code that already handles a null `club_id` (season calendar, coach-linked features) continues to no-op gracefully; nothing crashes without a club.

### 2. Add a "No club (solo athlete)" choice in Onboarding
`src/pages/Onboarding.tsx`, athlete branch:
- Add a small block on the club step: "I don't have a club — continue as a solo athlete."
- Selecting it sets an in-state flag `soloAthlete = true` and skips club input entirely.
- On submit, if `soloAthlete`, don't set `club_id`, and don't try to apply an invite; go straight to the normal post-onboarding flow (`/pricing` if unpaid, else `/dashboard`).
- The existing invite-code path (`sessionStorage.pending_invite_code` from `/join/CODE`) is untouched.

### 3. Surface a "Join a club later" affordance
On `/profile`, when `club_id` is null, show a small card: "You are a solo athlete. Enter an invite code to join a club." with an input that calls `apply_invite_to_my_profile`. This is the escape hatch for users who later get a code from a coach.

### 4. i18n
Add keys in all 7 languages (`en, da, sv, de, ar, no, es`):
- `onbNoClubTitle` — "I don't have a club"
- `onbNoClubDescription` — "You can use Sportstalent on your own. You can join a club later from your profile."
- `onbContinueSolo` — "Continue as solo athlete"
- `profileJoinClubTitle` — "Join a club"
- `profileJoinClubDescription` — "Have an invite code from your coach?"
- `profileJoinClubPlaceholder` — "Invite code"
- `profileJoinClubSubmit` — "Join"
- `profileJoinClubSuccess` — "You've joined the club."
- `profileJoinClubInvalid` — "That code is invalid or expired."

## Files touched

- `src/pages/Dashboard.tsx` — remove the club_id redirect.
- `src/pages/Onboarding.tsx` — add "no club / solo athlete" option; don't force a club.
- `src/pages/Profile.tsx` — add "Join a club" card visible only when `club_id` is null.
- `src/i18n/translations.ts` — 9 new keys × 7 languages.

No DB / RLS / edge-function changes.

## Verification (Playwright)

1. Fresh signup with no invite → onboarding → pick "Continue as solo athlete" → lands on `/pricing` (web) / `/dashboard` (native), no loop.
2. Existing user without `club_id` opening `/dashboard` → stays on the dashboard instead of bouncing to `/profile`.
3. Solo user on `/profile` sees the "Join a club" card; entering a valid invite code moves them into that club (`club_id` set, `coach_athletes` row created via existing RPC).
