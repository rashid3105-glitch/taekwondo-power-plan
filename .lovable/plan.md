## Goal

Polish the authenticated app: a personalized home greeting, contextual empty states, an active-plan badge on the home card, and an always-visible periodization timeline above the weekly schedule. All text via the existing i18n system. Landing page and auth routes untouched.

## Status of each item

- **#2 Logout → "/"** — already implemented in `Dashboard.tsx` (`handleSignOut` already calls `navigate("/")`), and the only other auth signout in `PendingApproval.tsx` already redirects via state change. **No change needed.** Will verify only.

The other 4 items below need work.

---

## 1. Personalized home greeting

**Where:** `src/pages/Dashboard.tsx`, the existing welcome card on the Home tab (around line 583–604).

**Change:**
- Compute first name as `profile.display_name.trim().split(/\s+/)[0]` (fallback to "SPORTSTALENT" if empty).
- Compute time-of-day bucket from `new Date().getHours()`:
  - 5–11 → `greetingMorning`
  - 12–17 → `greetingAfternoon`
  - 18–4 → `greetingEvening`
- Replace the `{t("welcomeBack")}, {profile?.display_name}` line with:
  - Large heading: first name (or app name)
  - Subline: localized time-of-day greeting + optional belt/club chips that already exist
- Keep the existing avatar + chips layout; only the heading text changes.

**i18n keys to add** to `src/i18n/translations.ts` for all 6 locales (DA / EN / SV / DE / AR / NO):
- `greetingMorning`  e.g. DA: "God morgen", EN: "Good morning"
- `greetingAfternoon`  e.g. DA: "God eftermiddag"
- `greetingEvening`  e.g. DA: "God aften"

---

## 3. Empty states for 5 features

Reusable component `src/components/FeatureEmptyState.tsx`:
- Props: `icon`, `titleKey`, `descKey`, `ctaKey`, `onCta`, optional `accentClass` (e.g. `text-tab-plan`).
- Renders existing dark-card styling: `rounded-xl border border-border bg-card p-10 sm:p-12 text-center shadow-card`, large 56px icon in muted+accent halo, bold heading, muted-foreground subtext, primary `Button` CTA. Mobile-friendly (h-11 button, safe padding).

**Apply at:**

| Feature | Trigger condition | Icon | CTA action |
|---|---|---|---|
| Plan (`activeTab === "plan"`, no `activePlan`) | Replace existing minimal block at lines 1007–1015 of `Dashboard.tsx` | `Zap` | scroll to / focus the existing generate button (already in profile-summary card above) |
| Fremgang (Progress) — `ProgressDashboard.tsx` when `logs.length === 0` | New early-return branch | `BarChart3` | call `onGoToPlan?.()` to switch to Plan tab |
| Ernæring (Nutrition) — `NutritionPlan.tsx` when no `plan` and not `readOnly` | Add above the goal-selection card (or fold into it) | `Apple` | scroll to existing goal selector / pre-select first goal |
| Genoptræning (Rehab) — Dashboard.tsx rehab tab when no `rehabPlan` | Add below the generator card | `Heart` | focus the rehab injury input |
| Mental — `MentalAssessment.tsx` when `assessments.length === 0` and not mid-assessment | Add an empty state above the start-assessment trigger | `Brain` | call the existing "start assessment" handler |

**i18n keys to add** (6 locales):
- `emptyPlanTitle` / `emptyPlanDesc` / `emptyPlanCta`
- `emptyProgressTitle` / `emptyProgressDesc` / `emptyProgressCta`
- `emptyNutritionTitle` / `emptyNutritionDesc` / `emptyNutritionCta`
- `emptyRehabTitle` / `emptyRehabDesc` / `emptyRehabCta`
- `emptyMentalTitle` / `emptyMentalDesc` / `emptyMentalCta`

(Where a meaningful key already exists — e.g. `noTrainingPlanYet` — reuse it inside the new component to avoid duplication.)

---

## 4. Active-plan badge on Home card

**Where:** `src/pages/Dashboard.tsx`, the `plan` card inside the `NAV_ITEMS` grid at lines 672–706.

**Change:**
- The `activePlan` const is already computed at line 368.
- Add a small absolutely-positioned badge in the top-right corner of the Plan card only (`tab === "plan"`):
  - `<span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-speed/15 text-speed border border-speed/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"><span className="h-1.5 w-1.5 rounded-full bg-speed animate-pulse" />{t("activeBadge")}</span>`
- Show only when `activePlan` exists. No negative state when there is no plan.

**i18n key to add** (6 locales):
- `activeBadge` — DA: "Aktiv", EN: "Active", SV: "Aktiv", DE: "Aktiv", AR: "نشط", NO: "Aktiv"

---

## 5. Periodization timeline above the weekly schedule

**Where:** `src/components/AIPlanCard.tsx` (lines 380–410) and `src/components/PeriodizationView.tsx`.

**Changes in `AIPlanCard.tsx`:**
- Remove the schedule/periodization tab toggle and `activeTab` state (lines 230, 380–402, 405–407, 410).
- Always render `<PeriodizationView ... />` directly above the weekly grid when `periodization.length > 0`.

**Changes in `PeriodizationView.tsx`:**
- Replace hardcoded English strings with i18n via `useLanguage()`:
  - "Program Periodization" → `t("periodizationTitle")`
  - "{n}-week progression overview" → `t("periodizationSubtitle").replace("{{n}}", String(totalWeeks))`
  - "Weeks {x}" → `t("weeksLabel").replace("{{range}}", phase.weeks)`
  - "Volume" → `t("volume")`, "Intensity" → `t("intensity")`
  - "Key changes:" → `t("keyChanges")`
  - Phase name: pass `phase.phase.toLowerCase()` through a small lookup → `phaseAnatomicalAdaptation` / `phaseAccumulation` / `phaseIntensification` / `phasePeaking` / `phaseDeload` / `phaseCompetition` / `phaseRecovery`. Falls back to the raw name when no key matches.
- Color tweak per spec: keep `bg-primary` for the volume bar (cyan/blue in this dark cockpit theme), but change the intensity bar from `bg-accent` to **`bg-destructive`** (red) so the contrast matches the spec's "volume in blue, intensity in red".

**i18n keys to add** (6 locales):
- `periodizationTitle`, `periodizationSubtitle` (with `{{n}}` placeholder), `weeksLabel` (with `{{range}}`), `volume`, `intensity`, `keyChanges`
- `phaseAnatomicalAdaptation`, `phaseAccumulation`, `phaseIntensification`, `phasePeaking`, `phaseDeload`, `phaseCompetition`, `phaseRecovery`

(Reuse any of the above that already exist in `translations.ts`; only add what's missing.)

---

## What's NOT changing

- No new routes, no nav changes.
- Landing page (`/`) and auth (`/auth`, `/signup`, `/login`) untouched.
- No additional API calls — periodization timeline uses data the `generate-plan` edge function already returns.
- Logout already redirects to `/`; verifying only, no edit.

## Files touched

- `src/pages/Dashboard.tsx` — greeting refactor, empty-state replacement on Plan + Rehab tabs, active-plan badge on home Plan card.
- `src/components/AIPlanCard.tsx` — drop tab toggle, render periodization above schedule.
- `src/components/PeriodizationView.tsx` — i18n + intensity color → red.
- `src/components/ProgressDashboard.tsx` — empty state branch.
- `src/components/NutritionPlan.tsx` — empty state branch.
- `src/components/MentalAssessment.tsx` — empty state branch.
- `src/components/FeatureEmptyState.tsx` — new shared component.
- `src/i18n/translations.ts` — ~17 new keys × 6 locales.

## Verification

- Visual check on the Home tab in DA + AR (RTL) viewports.
- Confirm the badge only renders when an active plan exists.
- Confirm periodization renders above the schedule and the intensity bars are red.
- Spot-check empty states by temporarily logging into a fresh account state (or using a profile with no plan/no logs/no assessments).