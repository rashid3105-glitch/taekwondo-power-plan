## Root cause

The "Kunne ikke generere råd. Prøv igen." toast and the "Ingen råd tilgængelige" card are *not* an AI/edge-function problem. The edge function actually returned `success: true` with full Danish advice (verified in network logs).

The failure is in the database insert that happens right after. The Postgres logs contain:

```
ERROR  invalid input syntax for type integer: "21.6"
```

Two column-type mismatches in `public.mental_assessments`:

| Column        | Actual type | Code sends            |
|---------------|-------------|------------------------|
| `total_score` | `integer`   | `21.6` (decimal average) |
| `ai_advice`   | `text`      | JSON object             |

Because the insert in `mentalAssessmentSyncEngine.ts` throws, the sync's `try/catch` increments `failed`, no row is written, `r.flushed === 0`, and `submitOffline` returns the still-pending local placeholder with `ai_advice: null`. `MentalAssessment.tsx` then hits the "online but no advice" branch and shows the red toast. The "Generér råd igen" button hits the same wall via `regenerateAdvice` (object passed into a `text` column).

Confirmed: 0 new rows in `mental_assessments` for the user, while existing rows show `total_score` as integers and `ai_advice` as a JSON **string** — i.e. previous code used to round + stringify, current code does not.

## Fix (frontend-only, no migration)

Match the existing column types — round the score and stringify the advice object before writing.

### 1. `src/lib/mentalAssessmentSyncEngine.ts`

In the insert payload (around lines 51–61):
- `total_score: Math.round(intent.total_score)`
- `ai_advice: advice ? JSON.stringify(advice) : null`

Keep the local cache row (`putCachedAssessment` around lines 68–77) using the **object** form of `advice` so the UI keeps rendering rich advice — `parseAdvice` in the hook already normalises strings on refresh.

### 2. `src/hooks/useOfflineMentalAssessments.ts` — `regenerateAdvice`

In the `.update({ ai_advice: advice as any })` call (around line 191):
- Change to `.update({ ai_advice: advice ? JSON.stringify(advice) : null } as any)`

Local cached row keeps the object form (already does).

### 3. No other changes

- `MentalAssessment.tsx` flow is correct once `submitOffline` returns a synced row with advice.
- Edge function is fine.
- No DB migration needed — existing rows already follow this convention (integer score, JSON-string advice).

## Verification

After the change:
1. Submit a new mental assessment.
2. Expect: results screen shows AI advice immediately, no red toast, new row appears in `mental_assessments` with `total_score` rounded and `ai_advice` populated.
3. Open a past assessment without advice and tap "Generér råd igen" → advice fills in.
