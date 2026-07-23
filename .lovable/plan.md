## Goal

Ask new coaches for their club name during signup. If a club with that name already exists, add the coach to that club. Otherwise create a new club and give the coach 5 athlete invitation slots. remember to correct this in all places where you can sign up as a coach

## Changes

### 1. `src/pages/SignupCoach.tsx` — add club name to the first step

- Add a **Klubnavn** input on the account step, positioned above the email field.
- Live-lookup (debounced) against existing clubs by case-insensitive name match. When a match is found, show a subtle hint under the field: *"Denne klub findes allerede — du bliver tilføjet som træner."*
- If no match: *"Ny klub — den oprettes med 5 pladser til atleter."*
- Pass `club_name` in the `signUp` `options.data` so it survives email verification, and also into the existing `bootstrap-coach-trial` call.
- Since the club step now runs before verify, remove the standalone `"club"` step from the flow. Keep the athlete-count "band" question as an optional light step (or drop entirely — see Question below).

### 2. `supabase/functions/bootstrap-coach-trial/index.ts` — join-or-create logic

- Trim + normalize the incoming `club_name`.
- Look up an existing club by case-insensitive name (`ilike` exact match on `name`).
- **If found:** attach the coach to that club (`profiles.club_id = existing.id`) and insert a `club_memberships` row with role `coach`. Do **not** create a new club.
- **If not found:** create a new club with `max_athletes: 5` (currently hardcoded to 100) and attach the coach as before.
- Return `{ code, club_id, joined_existing: boolean }` so the UI can show the right confirmation.

### 3. Invite step copy

- When the coach joined an existing club, show: *"Du er nu træner i klubnavn. Del linket med dine atleter."*
- When a new club was created, show: *"Din klub er oprettet med 5 pladser til atleter."*

### 4. Translations

Add keys in all 7 languages (`da, en, sv, de, ar, no, es`) for:

- `signupClubNameLabel`, `signupClubNamePlaceholder`
- `signupClubExistsHint`, `signupClubNewHint`
- `signupJoinedExistingClub`, `signupNewClubCreated`

### 5. Changelog

Register `changelogEntry181` (v1.4.5) for 2026-07-23 in `src/pages/Help.tsx` and `src/i18n/translations.ts`.

## Technical notes

- Club matching uses exact case-insensitive name. No fuzzy matching to avoid accidental joins. Two clubs with the same real-world name in different cities will collide — accepted for MVP; coaches can request a rename later.
- `clubs.max_athletes = 5` for new clubs created via signup. Existing clubs keep their current cap.
- No new tables or RLS changes; `club_memberships` already exists.
- Client-side club lookup uses the existing anon-readable `clubs.name` (already used elsewhere for club switcher search). If RLS blocks anon read, the lookup falls back to a lightweight `check-club-exists` edge function.

## One thing to confirm

Right now the flow after account creation is: verify email → **club step (name + athlete band)** → invite. Moving club name to the account form makes the athlete band question the only reason to keep the middle step.

Should we:

- **(A)** Drop the athlete-band question entirely and go straight from verify → invite, or
- **(B)** Keep a small "Antal atleter du træner" step after verify?

I'll default to **(A)** (simpler flow) unless you say otherwise.