## Today's Training — Athlete Home

A new "I dag" card at the top of the athlete Home (Dashboard hub), above the feature grid. Reuses the existing active plan, weekly schedule, multi-session normaliser, workout_logs offline pipeline, and Fremgang route — no new tables, no schema changes.

### How it fits the existing app

- **Active plan source**: `Dashboard.tsx` already loads `training_plans` (most recent, `is_active=true`) into `activePlan`. We reuse `activePlan.plan_data.days`.
- **Today's day match**: use `localizeDayOfWeek` + the user's `weekly_schedule` index, mapping JS `getDay()` (Mon–Sun) to the day in `plan_data.days`.
- **Multi-session**: use `normalizeDaySessions(day)` from `src/lib/planSessionUtils.ts` — already handles morning gym + evening TKD.
- **Completion logging**: write per-exercise rows to `workout_logs` via the existing `useOfflineWorkoutLogs` hook (`upsertLog(exerciseIndex, { completed: true, actual_sets, actual_reps })`). Same hook AIPlanCard uses, so completion is offline-first and shows up everywhere.
- **Coach "Aktiv i dag"**: `Dashboard.tsx` already touches `profiles.last_seen_at` on mount (line 203); `SquadOverview` derives "Inaktiv Xd" from it. We additionally bump `last_seen_at` on session finish so the coach view flips to "Aktiv i dag" without changing the coach component.
- **No schema changes**: per-session "completed" status is derived — a session is "Gennemført" when every exercise in it has a `workout_logs` row with `completed=true` for today (TKD/recovery sessions: a single synthetic exercise_index `0` row).

### Components to add (all under `src/components/today/`)

```text
TodayCard.tsx          // The card on Home (rest / sessions / no-plan / completed states)
TodaySessionDialog.tsx // Full-screen Sheet that hosts the active session
GymSessionRunner.tsx   // Per-exercise checklist with sets/reps, cues, why (Collapsible)
TkdSessionRunner.tsx   // Single "Markér som gennemført" flow
CompletionMoment.tsx   // CSS checkmark animation + CTAs
```

### Placement (Dashboard.tsx hub)

Insert `<TodayCard />` immediately before the existing `<div className="grid gap-3 sm:grid-cols-2">` feature grid (around line 691), after `<RecoveryTile />`. Pass `activePlan` and `profile` already in scope.

### Card states

1. **No active plan** → render the existing `FeatureEmptyState` for plans (same one Programs uses).
2. **Rest day** (today's day type is `rest` or has no sessions) → calm card, `Battery` icon (already used in DayDetail), heading `todayRestTitle`, body `todayRestBody`. No CTA.
3. **Active session(s)** → one row per session from `normalizeDaySessions`:
   - badge: TKD (`bg-gradient-energy`) / Gym (`bg-gradient-power`) — same tokens as `DayDetail.tsx`.
   - focus label, exercise count (`exercises.length`) or "TKD-træning" for tkd type.
   - primary `Start træning` button → opens `TodaySessionDialog` (Sheet, full-screen on mobile via `side="bottom" className="h-[100dvh]"`).
   - if all logs for that session are `completed=true` today → replace button with a green `Gennemført` badge (`bg-speed/15 text-speed`).

### Session dialog (TodaySessionDialog)

- Header: session label + today's date (`toLocaleDateString(locale)`).
- `Progress` (shadcn) bar = `completedCount / total`.
- **Gym** → `GymSessionRunner`: each exercise as a `Card`:
  - name, `sets × reps @ tempo`, rest period.
  - "Hvorfor" + "Coachingtip" inside `Collapsible` (default closed) — reuses cue/why fields already rendered in `ExerciseCard`.
  - N checkboxes (one per set). When all checked → `upsertLog(idx, { completed: true, actual_sets, actual_reps })`, card collapses, green ring + Check icon.
- **TKD** → `TkdSessionRunner`: label + focus only, single big `Markér som gennemført` button → `upsertLog(0, { completed: true })` against synthetic `exercise_index=0`.
- Footer: `Afslut træning` button (primary). Disabled until all exercises completed (TKD: enabled immediately).
- On finish:
  1. Ensure all logs flushed (`useOfflineWorkoutLogs` already syncs).
  2. `supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", user.id)` — flips coach badge to "Aktiv i dag".
  3. Show `CompletionMoment` overlay.

### Completion moment

CSS-only animated checkmark (SVG stroke-dashoffset transition), heading `todayDoneTitle` ("Godt klaret!"), subtext `todayDoneBody`, primary CTA → `navigate("/")` + setTab `progress` (existing tab system uses `handleTabChange("progress")`), secondary CTA → close dialog and stay on home.

### i18n keys (added to all 6 locales in `src/i18n/translations.ts`)

```text
todayCardTitle           "I dag"
todayRestTitle           "Hviledag i dag"
todayRestBody            "God restitution er en del af træningen…"
todayStart               "Start træning"
todayFinish              "Afslut træning"
todayMarkDone            "Markér som gennemført"
todayCompleted           "Gennemført"
todayDoneTitle           "Godt klaret!"
todayDoneBody            "Dagens træning er logget i din fremgang."
todaySeeProgress         "Se min fremgang"
todayGoHome              "Gå til hjem"
todaySessionGym          "Styrke"
todaySessionTkd          "TKD"
todayWhy                 "Hvorfor"
todayCue                 "Coachingtip"
todayExercisesCount      "{n} øvelser"
```

### Files

- New: `src/components/today/TodayCard.tsx`, `TodaySessionDialog.tsx`, `GymSessionRunner.tsx`, `TkdSessionRunner.tsx`, `CompletionMoment.tsx`.
- Edited: `src/pages/Dashboard.tsx` (mount `<TodayCard />` in hub), `src/i18n/translations.ts` (15 keys × 6 locales).

### Out of scope

- No DB migration. No edits to `CoachDashboard`, `SquadOverview`, or `AIPlanCard`. No new realtime subscription.
