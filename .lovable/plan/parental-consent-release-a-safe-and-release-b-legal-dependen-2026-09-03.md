# Parental consent — Release A (safe) and Release B (legal-dependent)

Split as instructed. Release A ships alone, cannot block anyone, and needs no legal input. Release B ships later and carries all lockout risk.

## Corrections applied

**C1 — one clock only.** The dismissal counter is gone: `profiles.birth_date_prompt_dismissals` is dropped from the migration entirely. `BirthDateGate` nags indefinitely and never blocks. `ConsentGate` blocks only when `grace_until` has passed. Grace is the only clock, so mount order in `App.tsx` stops being load-bearing.

**C2 — athletes only.** `BirthDateGate` renders for athlete profiles only; coaches and parents are never prompted and never appear in the grace migration.

**C3 — reclassification is a re-runnable job.** 0/2/5/8 was computed on the 20 athletes who have a birth date, so it will move as the backfill lands. The 15–17 reclassification and the "consents no longer required" report become an idempotent function (`public.review_consent_requirements()`), runnable on demand and on a schedule, not a one-off statement inside a migration.

**C4 — token life 30 days,** reminders rebuilt around it: day 3, day 10, day 21, and an expiry warning at day 27. Nothing references a 14-day life any more.

## Live data (birth_date only; `profiles.age` no longer resolves anything)

62 athletes, 16 clubs.

| Metric | Count |
|---|---|
| Birth date present | 20 of 62 (32% coverage) |
| Birth date missing | 42 (32 active in last 90 days) |
| Of the 20 known: no granted consent | 3 |
| Of the 42 unknown: no granted consent | 28 |
| Of the 42 unknown: granted consent, age unverifiable | 14 |
| Minors among the 20 known (<13/<15/<16/<18) | 0 / 2 / 5 / 8 — unreliable per C3 |
| Guardian tokens sent / confirmed | 27 / 7 (26%) |
| Athlete profiles with no country | 23 of 62 |
| `clubs` country column | does not exist |

---

# RELEASE A — ships first

## A1. BirthDateGate (athletes only, never blocking)

A dismissible card mounted in `src/App.tsx` for signed-in athlete profiles with `birth_date is null`, on non-public routes. Dismiss closes it for the session; it returns next session, indefinitely. No counter, no column, no hard state. Date picker is shadcn `Calendar` with year+month dropdowns; display format from `Intl.DateTimeFormat(locale)` so `dd-mm-yyyy` falls out for `da`; Arabic inherits RTL. Stored as ISO `YYYY-MM-DD` via `update-my-profile` (already validates the format). Keys in all 7 languages.

## A2. Coach sets an athlete's birth date

Field on `src/pages/CoachAthleteDetail.tsx`, writing through a new `set_birth_date` action in `consent-coach-actions`, authorised club-scoped exactly like the existing actions there.

## A3. Birth date required for new athletes

`CreateAthleteDialog.tsx` + `create-athlete` require a birth date for newly created athletes. Existing athletes are never retro-required — that is the whole point of A1 being non-blocking.

## A4. Guardian conversion rework

Nothing here touches the threshold. `parental-consent-request` template:

1. Subject names child and club: "Consent needed for {child} at {club}".
2. Sender display name is the club where available; address stays `noreply@sportstalent.dk`.
3. First line, above the fold: what happens without action, and by when.
4. One button. Policy links move below the fold.
5. Three plain-language bullets on what is collected, instead of a policy link.
6. Localised to the athlete's profile language (today it is single-language).
7. Token life **30 days**; reminders at day 3, day 10, day 21; expiry warning day 27. New scheduled job, reusing `enqueue_email`.

`src/pages/Consent.tsx` (`/consent/:token`):

8. Mobile-first single screen — guardians arrive from email on a phone.
9. Child name, photo and club at the top for instant recognition.
10. Checkbox and button inside the first viewport; "what this covers" expandable below.
11. Confirmation screen after granting, plus an emailed receipt of what was consented (none today).
12. "This isn't my child / I'm not the guardian" link that flags the coach, turning wrong-address cases into data.
13. Consistent Noir & Gold shell so the page does not read as a phishing form.

## A5. Funnel instrumentation

Per-token `sent → opened → confirmed` (open via a pixel/redirect on the token link, confirm from `consent_tokens.confirmed_at`), surfaced in `/admin/stats` alongside a birth-date coverage counter and a club-level breakdown.

## A6. `profiles.age` out of the consent path

`isBelowConsentAge(birthDate, threshold)` — birth date only, returning `true | false | "unknown"` as a genuine third state that callers must handle. `effectiveAge()` stays for display. Removed from decisions in `src/lib/age.ts`, `supabase/functions/_shared/age.ts`, `InviteSignup.tsx`, `CoachConsents.tsx`, `CoachLogQueue.tsx`, `create-athlete`, `health-sync-simple`. In Release A the threshold argument stays the existing 18 — the value only becomes configurable in B, and behaviour is unchanged except that unknown is no longer silently treated as adult in *display* logic.

## Confirmation: nothing in Release A can block a user

- A1 has no blocking state and no counter — worst case is a card the athlete keeps dismissing.
- A2/A3 affect coach-side creation of *new* athletes only; no existing user meets a new requirement.
- A4/A5 touch guardian email and a public token page; no authenticated route changes.
- A6 changes how a value is computed, and in Release A no code path turns `"unknown"` into a block — every caller renders the existing non-blocking banner. `ConsentGate`'s fail-open behaviour is untouched until B4.
- No RLS policy, no grace stamping, no new required field for existing users.

## Release A exit criteria (to report, not to assume)

- Birth-date coverage %, measured 30 days after ship from the A5 counter. Today it is 32%; I will report the actual figure, not a projection.
- Guardian confirmation rate post-rework against the 26% (7/27) baseline, from the A5 funnel.

## Release A files and tables

**Migrations:** none required for the gate itself. One new table `public.consent_token_events (token_id, event, occurred_at)` for the funnel, with GRANTs and RLS (admin read, service_role write). No `profiles` column added. **`birth_date_prompt_dismissals` is not created.**

**Frontend:** `src/components/BirthDateGate.tsx` (new), `src/components/BirthDatePicker.tsx` (new), `src/App.tsx`, `src/lib/age.ts`, `src/pages/CoachAthleteDetail.tsx`, `src/components/coach/CreateAthleteDialog.tsx`, `src/pages/Consent.tsx`, `src/pages/InviteSignup.tsx`, `src/pages/CoachConsents.tsx`, `src/components/lab/CoachLogQueue.tsx`, `src/pages/admin/` stats, `src/i18n/translations.ts`.

**Edge functions:** `_shared/age.ts`, `consent-coach-actions` (+`set_birth_date`), `create-athlete`, `consent-confirm` (token life + event logging), `health-sync-simple`, the `parental-consent-request` template, and a new `send-consent-reminders` scheduled function.

## Does Release A secretly depend on Release B?

Three honest couplings, none blocking:

1. **A3's guardian-email decision still uses a threshold.** With B not shipped it uses today's hardcoded 18, so a 16-year-old in a country with a 15 threshold gets a guardian email that will later prove unnecessary. Over-collection, not under-collection — safe direction, and the A4 template does not depend on which number produced it.
2. **A6's `"unknown"` third state has no consumer until B.** In A it is handled by every caller as "show the banner". That is deliberate dead-ish code, and if B never ships, A leaves behaviour where it is today rather than half-enforced.
3. **A5's coverage counter is the input to B5's cohort sizing.** B cannot be sized correctly without A having run for a while — which is the argument for this split, not against it.

---

# RELEASE B — after legal review

## B1. Threshold as config

`clubs.digital_consent_age` (smallint, nullable override), `clubs.country` (text), `public.digital_consent_ages (country_code, age)` seeded with EU Art. 8 ages 13–16 plus DK/NO/SE/DE, and a security-definer RPC `public.consent_age_for_athlete(_athlete_id uuid)` returning `(age, source)` where source is `club_override | club_country | athlete_country | strictest | default`. Country values normalise to ISO-3166 alpha-2 with an alias map for the existing "DK"/"Denmark" mix.

## B2. `consent_age_source` — three values

`controller_first`, `residence_first`, and `strictest`. **Initial value: `strictest`** — the max of the club country's age and the athlete residence's age. Until legal answers, over-collecting consent costs friction and under-collecting costs a finding. Stored as one row in `platform_settings`, changeable by a single UPDATE with no redeploy.

## B3. `consent-self` server-side age check

Rejects with `minor_requires_guardian` (403) below threshold and `birth_date_required` when birth date is missing. Scope stated correctly: this governs **who may grant consent**, not who may be processed without it.

## B4. `ConsentGate` fail-closed on unknown age

Unknown age becomes a blocking "add your birth date" state — but only once that athlete's grace has expired (C1). The `catch` block stays fail-open: **accepted risk, not mitigated** — any network or RLS error grants full access regardless of consent state, and `consent-self` does not cover it. Closing it properly means RLS predicates on the processing tables, a later round.

## B5. Staggered grace

Cohorts and jitter as previously planned — adults with no consent row 21 days, guardian-pending minors 60 days, unknown age 45 days counted from first sign-in after ship, dormant >180 days no row until they return, plus `hashtext(athlete_id) % 5` days of jitter. Cohort sizes are recomputed against birth-date coverage at B ship time, not today's numbers.

## B6. Re-runnable reclassification (C3)

`public.review_consent_requirements()` — idempotent, safe to run repeatedly: recomputes which granted/pending consents are no longer required at the current threshold, writes a report row, and never mutates a `granted` record (a valid consent stays a valid audit record). Scheduled weekly and callable from `/admin/stats`. Also answers the earlier question: `consent_records.status` has a CHECK of `('pending','granted','withdrawn')`, so `'superseded'` needs a constraint change — the job avoids needing one by reporting rather than restatusing.

## Release B blast radius as a function of birth-date coverage

Baseline from live data: of the 20 athletes with a birth date, 3 (15%) lack granted consent; of the 42 without, 28 lack it and 14 hold consent that cannot be age-verified. Under B4, unknown age gates regardless of consent status.

`gated ≈ 62 × (1 − coverage)  +  62 × coverage × 0.15`

| birth_date coverage | Athletes gated at B ship |
|---|---|
| 32% (today) | ~45 (42 unknown + 3 known-unconsented) |
| 60% | ~30 |
| 80% | ~20 |
| 95% | ~12 |
| 100% | ~9 |

Two caveats: the 15% unconsented rate is measured on 20 profiles and will move; and every gated athlete has grace before any block, so "gated" means "enters a countdown", not "locked out on day one". Release A exists precisely to move this table down before B ships.

## New assumptions in this revision

1. Funnel "opened" is tracked via the token link redirect, which means a tracking hop on a guardian email — acceptable under the existing email policy, tell me if not.
2. `consent_token_events` is admin-read only; guardians and coaches see aggregate rates, not per-open timestamps.
3. Release A leaves the threshold at today's 18 rather than shipping an interim number, so nothing changes classification twice.
4. `review_consent_requirements()` reports only; it never withdraws or restatuses a consent without a separate explicit action.
5. Reminder days 3/10/21/27 assume the 30-day token; a token regenerated by a coach restarts the schedule.
6. Dormancy for B5 is `last_seen_at`, the same field used elsewhere in coach screens.

## Still out of scope: diary consent gating

Unchanged: it needs an Art. 9 decision, an RLS predicate on `diary_entries`, and offline pre-gating in `diaryOfflineDB.ts` / `diarySyncEngine.ts` where entries are written with no server round-trip. That third part is a round of its own.

## What I need from you

**For Release A:** approval only — no legal input needed. One optional call: the tracking hop in assumption 1.

**For Release B (later):** platform default age (recommendation 15), confirmation of `strictest` as the initial `consent_age_source`, and the grace numbers.
