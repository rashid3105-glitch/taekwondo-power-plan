## Goal

Let a coach create one competition (name, date, weight class, priority, location) and assign it to **multiple athletes at once** — instead of having to open each athlete and add it individually.

## Where it lives

A new button **"Create competition for multiple athletes"** in the Coach Dashboard → **Squad** tab header row, right next to the existing `WeeklySquadExport` and `CreateAthleteDialog` buttons (`src/pages/CoachDashboard.tsx` ~line 314).

## UX flow

```text
[Coach Dashboard → Squad]
   └─ "Bulk competition" button
       └─ Dialog opens:
            • Athlete picker (checkbox list of managed athletes,
              with "Select all", search, and per-row weight class override)
            • Competition fields (name *, date *, priority A/B/C, location)
            • Default weight class (applied to all unless overridden)
            • [Create for N athletes] button
       └─ On submit: one edge-function call returns per-athlete success/fail
       └─ Toast: "Created for 8 of 8 athletes" (or lists failures)
```

Each athlete gets their **own row** in the `competitions` table (so each can later edit, generate a plan, or reflect on it independently). They are not linked — this is a convenience bulk-create, not a shared event.

## Implementation

### 1. New component
`src/components/coach/CoachBulkCreateCompetitionDialog.tsx`
- Props: `athletes: { user_id, display_name, weight_kg }[]`, `onCreated?: () => void`
- State: selected athlete IDs (Set), per-athlete weight overrides, shared form fields
- Pre-fills each athlete's default weight from their profile `weight_kg` (editable)
- Submit calls one edge function with `{ athlete_ids[], name, event_date, priority, location, default_weight_class_kg, weight_overrides{} }`

### 2. New edge function
`supabase/functions/create-athlete-competitions-bulk/index.ts`
- Auth: validate JWT, get caller `user.id`
- Authorize: caller must be admin OR every `athlete_id` must have a `coach_athletes` row with `coach_id = user.id`
- For each athlete, insert into `competitions` (service role) with that athlete's resolved weight class
- Return `{ created: [{ athlete_id, competition_id }], failed: [{ athlete_id, error }] }`
- Input validation matches existing `create-athlete-competition` (name ≤120, valid date, priority A/B/C, weight 20–200, max 100 athletes per call)

### 3. Wire into Coach Dashboard
- Import + render `<CoachBulkCreateCompetitionDialog athletes={athletes} onCreated={loadEverything} />` in the Squad tab header (only managed athletes, not club-only/read-only).

### 4. Translations
Add keys to `src/i18n/translations.ts` (en/da/sv/de/ar):
- `bulkCompetitionTitle`, `bulkCompetitionButton`, `selectAthletes`, `selectAll`, `defaultWeightClass`, `weightOverride`, `createForN`, `bulkCreatedSummary`, `bulkPartialFailure`.

## Notes / out of scope

- One competition row per athlete (independent records). No shared "event" table.
- Bulk **edit/delete** of these competitions later is out of scope — coaches still edit each athlete's competition individually from that athlete's detail page.
- Club-only (read-only) athletes are excluded from the picker since coaches can't write to them.
