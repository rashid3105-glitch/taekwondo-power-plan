## Why the season calendar doesn't update with competitions

`SeasonCalendarView` (`src/components/hub/SeasonCalendarView.tsx`) is the component used both on the athlete Dashboard "calendar" tab and the hub. When it resolves what to show for each day, it calls:

```ts
resolveSessionForDate(iso, template, [], new Set())
```

The 3rd arg (athlete overrides) and 4th arg (competition dates) are **hardcoded empty**. So even when an athlete adds a competition in `/competitions`, the season calendar has no idea it exists — it just falls back to the weekly template (tkd / gym / rest).

The data is already in the `competitions` table (RLS already lets the athlete read their own rows), it is simply never fetched here.

## Fix plan

1. **`SeasonCalendarView.tsx`** — load the user's competitions and their personal season overrides once on mount, then feed them into `resolveSessionForDate`.
   - New `useEffect` that calls:
     - `supabase.from("competitions").select("event_date").eq("user_id", uid)` filtered to the season window (`>= seasonPlan.start_date` and `<= seasonPlan.end_date`).
     - `supabase.from("club_athlete_season_overrides").select("*").eq("season_plan_id", seasonPlan.id).eq("athlete_id", uid)` so coach-set overrides also render.
   - Store as `competitionDates: Set<string>` and `overrides: AthleteSeasonOverride[]` in component state.
   - Pass both into `resolveSessionForDate(iso, template, overrides, competitionDates)` in the day-cell render.
2. **Current phase banner** — unchanged.
3. **Calendar day cell** — when `s.isCompetition` is true, the existing `sessionRowClass("stævne")` already paints the red tint and the label "Stævne" will be shown via `sessionLabelKey`.
4. **Reactivity** — keep it simple: refetch when `seasonPlan.id` changes. (No realtime subscription needed; competitions don't change often and the dashboard remounts the view on tab switch.)

## Out of scope (not asked for)

- No change to `SeasonCalendar.tsx` (coach editor), `seasonCalendar.ts` helpers, or DB schema.
- No new tag/focus behavior.

## Files to edit

- `src/components/hub/SeasonCalendarView.tsx` — add competition + override fetch and pass into `resolveSessionForDate`.
