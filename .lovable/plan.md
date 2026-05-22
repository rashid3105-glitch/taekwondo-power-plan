## Problem

On `/coach/competitions`, each athlete's entry for the same competition (e.g. "Riga open" on 29.8.2026) renders as a separate card. The list is dominated by duplicates and the "UPCOMINGCOMPETITIONS" header also reads as one unbroken token (missing space/translation).

## Fix

Refactor `src/pages/CoachCompetitions.tsx` so each unique competition appears **once**, with a count of participating athletes. Tapping a card opens a sheet/dialog listing the athletes.

### 1. Group competitions

Group by a key of `name + event_date + (location ?? "")` (case-insensitive name). For each group keep:
- `name`, `event_date`, `location`, `priority` (highest among entries: A > B > C)
- `participants`: array of `{ user_id, athlete_name, result }`

Apply grouping to both `upcoming` and `past` lists.

### 2. Card UI

Each grouped card shows:
- Competition name
- Date + location (right side, as today)
- Small badge: `{n} atleter` (use existing `athletes` translation key or fallback)
- Avatar stack / "+N" if many — keep it lightweight: just the count badge for v1
- Tap target → opens a bottom Sheet (mobile-friendly) listing participants with name and, for past comps, their result

Remove the per-athlete subtitle line.

### 3. Participants sheet

Use shadcn `Sheet` (side="bottom") containing:
- Header: competition name + date + location
- Scrollable list of participants (name, result badge if any)
- Closes on backdrop tap

### 4. Header label fix

The screenshot shows `UPCOMINGCOMPETITIONS` glued together because `uppercase tracking-wide` is applied to the literal string `t("upcomingCompetitions") || "Kommende stævner"`. The string itself is fine ("Kommende stævner"), but the EN translation `upcomingCompetitions` likely returns `"UpcomingCompetitions"` (camelCase fallback). I will verify the translation key exists and, if missing, fall back to `"Kommende stævner"` / `"Upcoming competitions"` (with a space) in code, and also add proper keys if absent.

### Out of scope

- No DB changes; this is purely presentational grouping on the client.
- Athlete-facing `Competitions.tsx` is untouched.
- No change to how competitions are created.

### Files

- `src/pages/CoachCompetitions.tsx` — grouping logic, new card layout, Sheet for participants.
- `src/i18n/translations.ts` — add `participants` / `athletesCount` key if needed (7 languages), only if existing key is missing.
