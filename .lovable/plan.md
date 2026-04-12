

## Plan: Fix Mental Assessment History — Past Plans Not Viewable

### Problem
When an athlete views a previously saved mental assessment, the AI advice doesn't render. The `ai_advice` column is stored as `text` in the database, so when writing, the JavaScript object gets serialized to a JSON string. When reading it back, `viewPastResult` sets `advice` to this raw string — but the results template accesses `advice.summary`, `advice.strengths`, etc., which are `undefined` on a string.

### Fix

**File: `src/components/MentalAssessment.tsx`**

Update the `viewPastResult` function (~line 393-399) to parse the `ai_advice` string back into an object:

```typescript
const viewPastResult = (assessment: Assessment) => {
  const catScores = assessment.scores as Record<string, number>;
  setScores(catScores);
  setTotalScore(assessment.total_score);
  // ai_advice is stored as text — parse it if it's a string
  const rawAdvice = assessment.ai_advice;
  setAdvice(typeof rawAdvice === "string" ? JSON.parse(rawAdvice) : rawAdvice);
  setStep("results");
};
```

This is a one-line fix. No database changes needed.

### Result
Athletes will be able to click on any past mental assessment in history and see the full AI advice (summary, strengths, improvement areas, affirmations, pre-competition routine) rendered correctly.

