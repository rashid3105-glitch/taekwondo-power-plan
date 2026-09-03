# Parental consent: configurable age, birth-date backfill, server-side enforcement, cutover

## Live data (queried, not estimated) — birth_date only

`profiles.age` is a static field that decays, so it no longer resolves consent status anywhere. Missing `birth_date` = unknown age = BirthDateGate. Re-run on that basis:

62 athlete profiles, 16 clubs.

| Metric | Count |
|---|---|
| Athletes with **no birth_date** (unknown age) | 42 — 32 active in last 90 days |
| Of those, holding granted consent today | 14 (consent stands, age unverifiable) |
| Athletes with consent granted | 31 |
| Athletes with no consent row at all | 18 |
| **Blocked at cutover (no granted consent OR unknown age)** | **45 total — 35 active in last 90 days** |
| Blocked purely for missing consent (age known) | 31 (22 active) |
| Real minors by birth date: <13 / <15 / <16 / <18 | 0 / 2 / 5 / 8 |
| Guardian tokens sent / confirmed | 27 / 7 (26%) |
| Athlete profiles with no country | 23 of 62 |
| Clubs with no country field | 16 of 16 — `clubs` has **no country column at all** |

So **45 of 62 athletes, 35 of them recently active, hit a gate the moment fail-closed ships** — the dominant cause is missing birth dates, not missing consent. That ordering drives the cutover: birth-date collection has to lead, and grace has to be staggered rather than a single cliff.

## 1. Age threshold: constant to config

Today `18` is hardcoded in `src/lib/age.ts`, `supabase/functions/_shared/age.ts`, plus three ad-hoc copies (`InviteSignup.tsx:48`, `CoachConsents.tsx:136`, `CoachLogQueue.tsx:88`).

Proposed source of truth. Four inputs, and — per your correction 3 — **which of them wins is itself configuration, not baked in**:

1. `clubs.digital_consent_age` (new `smallint`, nullable) — explicit per-club override, always highest precedence.
2. `clubs.country` (new `text`, nullable) — the controller's country.
3. `profiles.country` (existing column) — the child's residence.
4. Platform default constant.

A new platform setting `consent_age_source` with values `controller_first` (2 before 3) or `residence_first` (3 before 2) decides the order of inputs 2 and 3. It is a single row in a `platform_settings` table read by the same RPC, so if legal review lands on residence the switch is one UPDATE, no redeploy. Assumption 5 below is recorded as on-hold rather than resolved. A `resolution_source` value (`club_override` / `club_country` / `athlete_country` / `default`) is returned alongside the age so the coach and admin screens can show *why* a threshold applies.

Coverage of `profiles.country` for athletes today: Denmark 24, DK 9, Sweden 4, Norway 2, empty 23. Values are not normalised ("DK" vs "Denmark"), so the lookup table is keyed on ISO-3166 alpha-2 with a small alias map handling both spellings. 39 of 62 athletes resolve from their own country even before any club is configured.

The country→age mapping lives in the database as `public.digital_consent_ages (country_code, age)`, seeded with the EU member-state Art. 8 ages (13–16) plus DK/NO/SE/DE. A DB table, not a TS file, so client and edge functions read the same rows — this is the fix for the drift you called out.

Both age modules become thin: they keep `effectiveAge()` for display only, and gain `isBelowConsentAge(birthDate, threshold)` — **birth date only, no `age` fallback parameter**, so a decayed static field cannot resolve a consent decision. It returns `unknown` (not `false`) when birth date is missing, and callers must handle that third state. Neither file contains a number. Resolution happens in one place: a security-definer RPC `public.consent_age_for_athlete(_athlete_id uuid)` returning `(age, source)`, called from the client and from edge functions.

Follow-on: `create-athlete`, `consent-coach-actions` and `health-sync-simple` currently pass `profiles.age` into `isMinor`. They all move to birth-date-only plus the RPC. `create-athlete` keeps accepting an `age` input for display but stops using it for the guardian-email decision — if a coach creates an athlete with no birth date, the guardian email requirement can no longer be decided, so the dialog makes birth date **required** for new athletes.

**Default value: to be confirmed by you before build.** My recommendation, for you to accept or override: 15 (Danish Art. 8 age, also NO/SE). It applies when the club has no override and no country.

## 2. Birth-date backfill

- New `BirthDateGate` component mounted next to `ConsentGate` in `src/App.tsx`. Shows for any signed-in athlete/coach profile where `birth_date is null`, on non-public routes.
- Dismissible **3 times** (counter stored on the profile, not localStorage, so it survives device changes — new `profiles.birth_date_prompt_dismissals smallint default 0`). Fourth appearance is required: no dismiss button, no way past it.
- Input: shadcn `Calendar`/date-picker with year+month dropdowns (birthdays are far in the past — a plain month-flip calendar is unusable). Display format from `Intl.DateTimeFormat(locale)`, so `dd-mm-yyyy` for da falls out naturally; Arabic inherits RTL from the existing layout. No hardcoded format string.
- Stored as ISO `YYYY-MM-DD` in the existing `profiles.birth_date` via the existing `update-my-profile` edge function (which already validates that regex). Also clears `profiles.age` ambiguity by leaving `age` alone — `effectiveAge` prefers birth_date.
- Coach path: a "Set birth date" field on the athlete profile in `src/pages/CoachAthleteDetail.tsx`, writing through a new action in `consent-coach-actions` (coach may only write for athletes in their club).
- New translation keys in all 7 languages.

## 3. Server-side enforcement

- `supabase/functions/consent-self/index.ts`: before granting, load the caller's `birth_date`/`age`/`club_id`, resolve the club threshold, and reject with `{ error: "minor_requires_guardian" }` (403) when the caller is below it. Also reject when the effective age is unknown (`{ error: "birth_date_required" }`) — self-consent from an ageless account is exactly the hole today.
- `ConsentGate.tsx`: unknown age becomes fail-closed — it renders a "add your birth date" state that hands off to the BirthDateGate flow instead of silently passing.
- The `catch` fail-open on network/RLS error stays fail-open. Locking every athlete out of the app because of a flaky request is worse than the risk it mitigates, and the server-side check in consent-self is the real enforcement point.
- `health-sync-simple` already gates on consent for minors; it switches to the same resolved threshold.

## 4. Cutover

Nothing is enforced against a live athlete without a grace window first.

- **Length: 30 days** from ship. Long enough for a guardian email round-trip given the 26% confirmation rate, short enough to be a real deadline.
- **Migration sets `grace_until = now() + 30 days`** on every athlete who is not currently granted — including creating a `consent_records` row with `status='pending'` for the 18 athletes who have none. Uses the existing column, no new mechanism.
- **What the athlete sees:** the existing amber banner (`state.kind === "banner"`), unchanged in behaviour — dismissible per session, full app access. Copy gains the deadline date and, for minors, the guardian-invite button that today only appears on the blocking screen.
- **What the coach sees:** `/coach/consents` (`CoachConsents.tsx`) already lists per-athlete consent state; it gains a "grace ends" column, sorting by soonest expiry, and a count badge in the coach nav so it is not something they have to go looking for.
- **At expiry:** grace lapses naturally (`grace_until < now()`), and the gate falls through to `blocking` for adults (self-consent, one checkbox — recoverable in ten seconds) or `minor` for those below the threshold (guardian invite link). No data is deleted and no account is disabled.

### Existing records — your call, nothing silent

With a threshold of 15 instead of 18, five 15–17-year-olds hold guardian-granted consent that Art. 8 no longer requires, and three hold pending guardian consent.

My proposal, which I will not run until you say so:

- **Granted (5):** keep as-is. A valid consent does not become invalid because it was no longer required; withdrawing it would destroy an audit record. Add `policy_version` stamping so the report shows it was granted under the old threshold.
- **Pending (3):** mark `status = 'superseded'` with a note, and let those athletes self-consent. Chasing guardians for consent the law no longer requires is user-hostile.
- **Under-15s (5, 3 already granted):** untouched — they still need guardian consent.

Say "keep everything" and I will drop the superseded step.

## 5. What breaks with no club country

`clubs` has no country column today, so on day one no club resolves at step 1 or 2 — every athlete falls to step 3, their own `profiles.country`. That covers 39 of 62 athletes (Denmark/DK 33, Sweden 4, Norway 2); the remaining 23 with no country fall to the platform default. Nothing errors: the chain override → club country → athlete country → default always answers. The visible risk is a German club (Art. 8 age 16) being governed by the default until someone sets its country. Mitigation: the club-settings admin screen gets a country selector (reusing `src/data/countries.ts`), the migration backfills club country from the modal athlete country per club where one exists (13 of 16 clubs are unambiguous — Denmark 10, Sweden 2, Norway 1), and `/admin/stats` flags clubs still running on the default.

## 6. Assumptions I made that you did not specify

1. Threshold applies to **health-data processing consent only** (`consent_type='health_data_processing'`) — the one consent type in the table today.
2. Grace applies to athletes only. Coaches and parents are not gated, matching today's behaviour.
3. Dismissal count lives on the profile (server-side), not localStorage — otherwise clearing the browser resets the limit.
4. The `catch`-block fail-open stays (see section 3). Say the word and it becomes fail-closed too.
5. The club takes precedence over the athlete's own `profiles.country`, because the club is the data controller; the athlete country is a fallback, not an override. An athlete's country is never allowed to *lower* the club's threshold — if both resolve, the club wins even when the athlete's country would be more permissive.
6. Athletes with no club (9) get the platform default.
7. `consent-confirm` (the guardian token path) is not age-gated — a guardian granting consent for a 17-year-old under a 15 threshold still succeeds and is recorded.

## 7. Out of scope: diary consent gating

Not touched this round, as instructed. For a later round it would mean: `diary_entries` currently has no consent dependency, so gating it needs (a) a decision on whether diary text counts as health data under Art. 9 — arguably yes for mood/injury entries, (b) an RLS predicate on `diary_entries` referencing a consent-check function, (c) offline handling, since `diaryOfflineDB.ts`/`diarySyncEngine.ts` let entries be written with no server round-trip and a sync would then be rejected server-side, needing a client-side pre-check plus a rejection UI. That third point is the real work; it is a round of its own.

## Files and tables

**Migrations:** `clubs` (+`digital_consent_age`, +`country`), `profiles` (+`birth_date_prompt_dismissals`), new `digital_consent_ages` table (seeded, public read), new `club_consent_age()` RPC, cutover data migration on `consent_records`.

**Frontend:** `src/lib/age.ts`, `src/lib/consentAge.ts` (new), `src/components/ConsentGate.tsx`, `src/components/BirthDateGate.tsx` (new), `src/components/BirthDatePicker.tsx` (new), `src/App.tsx`, `src/pages/InviteSignup.tsx`, `src/pages/CoachConsents.tsx`, `src/pages/CoachAthleteDetail.tsx`, `src/components/lab/CoachLogQueue.tsx`, `src/components/admin/` club settings, `src/i18n/translations.ts`.

**Edge functions:** `_shared/age.ts`, `_shared/consentAge.ts` (new), `consent-self`, `create-athlete`, `consent-coach-actions`, `health-sync-simple`.

## Before I build, I need from you

1. The platform default age (my recommendation: 15).
2. Grace window: 30 days, or another number.
3. Existing 15–17 pending consents: supersede, or keep.
