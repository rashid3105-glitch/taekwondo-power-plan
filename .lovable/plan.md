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

- `supabase/functions/consent-self/index.ts`: before granting, load the caller's `birth_date` and `club_id`, resolve the threshold, and reject with `{ error: "minor_requires_guardian" }` (403) below it, or `{ error: "birth_date_required" }` when birth date is missing. **Scope, stated correctly:** this governs *who may grant consent* — it stops a minor self-granting. It does **not** stop processing of data belonging to someone with no valid consent. That is a separate control surface (per-endpoint consent checks; today only `health-sync-simple` has one).
- `ConsentGate.tsx`: unknown age becomes fail-closed — it renders an "add your birth date" state handing off to the BirthDateGate flow instead of silently passing.
- **Accepted risk, not mitigated:** the `catch` block stays fail-open, so any network or RLS error grants full app access regardless of consent state. `consent-self` does not cover this hole — it is a different control. The reason to accept it is availability (a flaky request would otherwise lock out every athlete), and the residual exposure is: unconsented processing continues for the duration of any client-side failure, undetected. Closing it properly means moving the gate server-side (RLS predicates on the processing tables), which is not in this round. Recorded so it is a decision, not an oversight.
- `health-sync-simple` already gates on consent for minors; it switches to the same resolved threshold and to birth-date-only age.

## 4. Cutover

Nothing is enforced against a live athlete without a grace window first, and the window is **staggered, not one stamped date**.

Stagger rule, written into the migration per athlete:

| Cohort | Grace | Why |
|---|---|---|
| Known age, adult, no consent row | 21 days | One click to fix; no third party involved |
| Known age, minor, guardian pending | 60 days | Depends on a guardian replying; historical rate is 26% |
| Unknown age (42 athletes) | 45 days, **counted from first sign-in after ship**, not from ship date | An athlete who does not open the app in March must not find themselves already expired in April |
| Unknown age, dormant >180 days | no grace row created until they return | Do not burn a window on accounts nobody is using |

Implementation: `grace_until` is set at migration time for the first two cohorts; for the unknown-age cohort the migration leaves `grace_until` null and `BirthDateGate` stamps `now() + 45 days` on first appearance. Same column, no new mechanism. A deterministic jitter (`+ (hashtext(athlete_id) % 5) days`) spreads expiries so support does not get 35 lockouts in one morning.

- **What the athlete sees during grace:** the existing amber banner (`state.kind === "banner"`) — dismissible per session, full app access. Copy gains the deadline date, and for minors the guardian-invite button that today only appears on the blocking screen.
- **What the coach sees:** `CoachConsents.tsx` gains a "grace ends" column, sorting by soonest expiry, cohort labels, and a count badge in the coach nav.
- **At expiry:** the gate falls to `blocking` for adults (self-consent, one checkbox) or `minor` (guardian invite). No data deleted, no account disabled.

### Moving the 26% guardian confirmation rate

In scope now. Seven of 27 tokens confirmed. Changes to the `parental-consent-request` template and `src/pages/Consent.tsx`:

**Email**
1. Subject names the child and the club: "Consent needed for {child} at {club}" — today it reads as generic platform mail and looks like spam.
2. Send from the club's name where available, not a bare platform sender; keep `noreply@sportstalent.dk` as the address.
3. First line states what happens without action and by when (the staggered date), above the fold.
4. One button, no competing links. Move the policy links below the fold.
5. Plain-language "what we collect" list — three bullets, no legal register — instead of a policy link the guardian will not click.
6. Localise to the athlete's profile language; today the template is sent in one language.
7. Automatic reminders at day 3 and day 10 (currently reminders are manual from the coach screen), plus expiry-warning at day 12 of the 14-day token life.
8. Token life goes 14 → 30 days for the guardian cohort so a reminder cannot arrive after the link is dead — a likely cause of the current dropout.

**`/consent/:token` page**
9. Mobile-first single screen: guardians open this on a phone from an email. Today's layout front-loads legal text before the action.
10. Show the child's name, photo and club at the top so the guardian recognises the request instantly.
11. Checkbox and button in the first viewport; expandable "what this covers" below rather than a wall.
12. Explicit confirmation screen after granting, plus a copy of what was consented sent to the guardian's email — no receipt today.
13. A "this isn't my child / I'm not the guardian" link that notifies the coach, so wrong-address cases become data instead of silence.

Measurement: token-level funnel (sent → opened → confirmed) into `/admin/stats`, otherwise the next iteration is guesswork too.

### Existing records — your call, nothing silent

Answering your question: **`consent_records.status` has a CHECK constraint of `('pending','granted','withdrawn')` — `'superseded'` is not accepted.** Using it requires altering the constraint in the migration. And **creating pending rows sends no email**: the only trigger is `update_updated_at_column`, there is no DB webhook, and no cron job touches consent. All guardian mail is sent explicitly by `create-athlete` / `consent-coach-actions`.

With a 15 threshold, on birth-date data: four 15–17-year-olds hold guardian-granted consent no longer required, one holds pending guardian consent, two under-15s are granted.

My proposal, not run until you say so:

- **Granted (4):** keep as-is, stamp `policy_version` so the report shows the old threshold applied.
- **Pending (1):** either extend the CHECK constraint to allow `'superseded'`, or leave it `pending` and simply stop chasing it. Given it is one row, my recommendation is now **leave it** and skip the constraint change.
- **Under-15s (2, both granted):** untouched.

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
