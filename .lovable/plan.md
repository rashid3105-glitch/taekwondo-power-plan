

## Add a "Who it's for / Problem / Solution" section to the landing page

A new narrative section on the public landing page (`/`) that clearly explains, in three short blocks, **who Sportstalent is for**, **the problem they face**, and **how Sportstalent solves it**. This gives first-time visitors immediate clarity before they scroll into features and social proof.

### Where it sits

In `src/pages/Index.tsx`, inserted between the hero and the existing `FeatureGrid` / value sections — i.e. the first thing a visitor reads after the headline. Subtle dark-to-light transition consistent with the existing landing aesthetic.

### Content (all 6 locales: EN/DA/SV/DE/AR/NO)

Three columns on desktop, stacked on mobile, each with an icon + short heading + 2–3 line body.

**1. Who it's for** — icon: `Target`
> Taekwondo athletes, coaches, and clubs who take performance seriously — from competitive juniors building their base to seniors chasing podiums.

**2. The problem** — icon: `AlertCircle`
> Generic training apps don't understand taekwondo. Coaches juggle spreadsheets, athletes guess at periodization, and progress data lives in scattered notebooks.

**3. The solution** — icon: `CheckCircle2`
> One platform built specifically for TKD: periodized training, mental performance, nutrition, rehab, and physical testing — connecting athletes and coaches in one place.

A short lead-in line above the three cards: *"Built for the sport. By people who train it."*

### Component & files

- New component `src/components/landing/ProblemSolution.tsx`
  - 3-column responsive grid (`grid sm:grid-cols-3 gap-5`)
  - Each card: icon in colored gradient circle (using existing `tab-color-coding` tokens — Target=blue, Problem=amber/destructive, Solution=emerald), bold heading, muted body
  - Framer-motion stagger fade-in on scroll (matches existing landing animations)
  - Pulls all copy from `useLanguage().t(...)` — no hardcoded strings

- Mounted in `src/pages/Index.tsx` immediately after the hero section, before the existing value/feature blocks. Wrapped in the same `theme-light-section` container used by the rest of the light-themed landing content.

### Translations

Add 7 keys × 6 locales in `src/i18n/translations.ts`:
- `psSectionLead` — lead-in line
- `psWhoTitle`, `psWhoBody`
- `psProblemTitle`, `psProblemBody`
- `psSolutionTitle`, `psSolutionBody`

Keep bodies under ~140 chars each so the cards stay scannable.

### Files changed

- `src/components/landing/ProblemSolution.tsx` (new)
- `src/pages/Index.tsx` (mount the section)
- `src/i18n/translations.ts` (7 keys × 6 locales)

### Out of scope

- No new images or illustrations — icons only, to keep page weight down and match the minimal landing style.
- No A/B variants or analytics events for this section.
- No copy on the `/about` or `/methodology` pages — those already cover the longer story; this section is the short hero-adjacent version.
- No DB or backend changes.

