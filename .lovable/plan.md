

## Plan: Remove AI references from user-facing pages

All "AI" mentions in user-facing text will be reworded to emphasize the system's intelligence without naming it "AI." Internal code comments and variable names stay unchanged.

### Changes

**`src/i18n/translations.ts`** — Reword these keys across all 4 languages (EN, DA, SV, DE):

| Key | Current (EN) | New (EN) |
|-----|------|------|
| `howItWorksStep2Desc` | "AI generates a periodized program…" | "We generate a periodized program…" |
| `landingValueAITitle` | "AI-Powered Plans" | "Personalized Plans" |
| `landingValueAIDesc` | (unchanged content, already no "AI") | (keep as-is) |
| `nutritionDisclaimerDesc` | "This nutrition plan is AI-generated…" | "This nutrition plan is auto-generated…" |
| `helpTrainingPlanSteps` | "The AI will create…" | "The system will create…" |
| `helpRehabPlanSteps` | "The AI creates…" | "The system creates…" |
| `helpMentalPlanSteps` | "AI-generated sports psychology advice" | "personalized sports psychology advice" |
| `changelogEntry32` | "Swedish language support in all AI plan generators" | "Swedish language support in all plan generators" |

Same pattern applied to DA, SV, DE translations.

**`src/components/MentalAssessment.tsx`** — Change:
- EN: "Get My Results & AI Advice" → "Get My Results & Advice"
- DA: "Få mine resultater & AI-råd" → "Få mine resultater & råd"

**`src/components/NutritionPlan.tsx`** — Change code comment only (cosmetic, optional).

**`src/pages/Dashboard.tsx`** — Change `"AI Generated Plan"` → `"Generated Plan"` (internal plan name).

**`src/pages/Index.tsx`** — The landing page value prop icon/title uses `landingValueAITitle` from translations — already covered above.

### Not changed
- Component file names (`AIPlanCard.tsx`) — internal, not user-facing
- Edge function names — internal backend code
- Code comments — not visible to users

