

## Plan: 8 Rotating Case Studies (Coach + Athlete Perspectives)

### Overview
Replace the single hardcoded case study with 8 rotating stories — 4 athlete perspectives and 4 coach perspectives. A new story is shown each time the page loads (rotating daily or randomly), with smooth transition support.

### Story Data Structure

Each story will be a self-contained object with:
- **type**: `"athlete"` or `"coach"`
- **profile**: name, info line, profile stats (age/experience/level/etc.)
- **problems**: 4 bullet points (before)
- **changes**: 4 bullet points (intervention)
- **metrics**: 4 result cards with before/after/change values
- **quote**: testimonial text
- **icons**: different accent colors per type (energy for athletes, speed for coaches)

### Stories Content (anonymized, realistic)

**Athlete stories (4):**
1. Current story — 19y U21 sparring athlete, jump + knee pain improvement
2. 16y junior poomsae athlete — improved balance, flexibility, reduced competition anxiety
3. 24y senior sparring athlete — weight-class management, endurance, reduced overtraining
4. 21y female athlete — explosive speed, kick power, recovered from ankle injury

**Coach stories (4):**
5. Club coach (15 athletes) — saved planning time, better periodization compliance, fewer injuries
6. National team assistant — standardized testing, data-driven selection, improved squad performance
7. Private coach (5 athletes) — individualized programs at scale, better athlete retention
8. University TKD coach — integrated S&C with academic schedule, improved competition results

### File Changes

#### 1. New data file: `src/data/caseStudies.ts`
Contains all 8 stories as a typed array. Each story has all text in all 5 languages (en/da/sv/de/ar) embedded directly (no translation keys needed — keeps translations.ts manageable).

```typescript
interface CaseStory {
  id: string;
  type: "athlete" | "coach";
  badge: LangText;        // e.g. "Real Results" / "Coach Impact"
  headline: LangText;
  subheadline: LangText;
  name: LangText;
  info: LangText;
  profileStats: Array<{ label: LangText; value: LangText }>;
  problems: LangText[];
  changes: LangText[];
  metrics: Array<{ label: LangText; after: string; change: string; icon: LucideIcon }>;
  quote: LangText;
  nameNote: LangText;
  methodNote: LangText;
}
```

#### 2. Updated component: `src/components/landing/CaseStudy.tsx`
- Import stories from the data file
- Pick a story based on `Math.floor(Date.now() / 86400000) % 8` (rotates daily)
- Add left/right navigation dots or arrows so visitors can browse all 8
- Adapt accent colors: athletes use `energy`/`speed`, coaches use a `primary`/`blue` accent
- Coach profile cards show coaching-specific stats (athletes managed, years coaching, etc.) instead of athlete stats
- Add a small "Athlete Story" / "Coach Story" pill/badge to distinguish perspective

#### 3. Minor translation additions: `src/i18n/translations.ts`
Only a few shared UI keys:
- `caseAthleteStory` / `caseCoachStory` (badge labels)
- `caseBefore` / `caseIntervention` already exist and are reused

#### 4. Remove old case study translation keys
The ~30 `case*` keys per language in translations.ts can be removed since all text moves into the data file.

### UX Behavior
- **Daily rotation**: each day a different story is featured
- **Manual navigation**: dots below the quote let users browse all 8
- **Visual distinction**: athlete stories keep current green/teal accents; coach stories use blue/purple accents
- **Smooth fade transition** when switching between stories via AnimatePresence

### Result
- 8 diverse, realistic stories rotating on the landing page
- Both coach and athlete perspectives represented
- All 5 languages supported
- No database changes needed — purely frontend

