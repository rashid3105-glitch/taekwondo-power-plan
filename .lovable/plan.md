## Goal

Transform `/help` from a flat 15-button grid into a modern, searchable help center grouped into 5 clear sections, while preserving all existing translated content (no copy rewrites needed).

## New structure

Topics are reorganized into 5 module-based categories that match the app's Tab Color Coding:

1. **Training & Plans** — Training Plan, Season Plan, Physical Testing, Match Analysis, Progress
2. **Health & Recovery** — Rehab Plan, Nutrition, Wearables
3. **Mental & Diary** — Mental Plan, Diary
4. **Coach Tools** — Add Students, Student Progress, Coach Feedback
5. **Account & Setup** — Profile, Library, Install as App

(All 15 existing topic keys + the Install card are placed; no topic is dropped.)

## Page layout (mobile-first, dark-to-light public theme)

```text
┌──────────────────────────────────────────────┐
│ PublicNav                                    │
├──────────────────────────────────────────────┤
│  Help Center (h1)                            │
│  Subtitle                                    │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 🔍  Search help topics…           ⌫    │  │  ← sticky on scroll
│  └────────────────────────────────────────┘  │
│                                              │
│  [Training & Plans]  [Health]  [Mental] …    │  ← horizontal section chips, scroll-to anchor
├──────────────────────────────────────────────┤
│  ▌ Training & Plans                          │  ← section header w/ accent bar (training color)
│  ┌────────┐ ┌────────┐                       │
│  │ icon   │ │ icon   │ … 2-col card grid     │
│  │ title  │ │ title  │                       │
│  └────────┘ └────────┘                       │
│  (expanded answer renders inline below card) │
│                                              │
│  ▌ Health & Recovery   …                     │
│  ▌ Mental & Diary      …                     │
│  ▌ Coach Tools         …                     │
│  ▌ Account & Setup     …                     │
├──────────────────────────────────────────────┤
│  Changelog (collapsible — unchanged)         │
└──────────────────────────────────────────────┘
```

## Search behaviour

- Sticky search input at the top of the content area (below the hero).
- Filters in real time across **topic title + step body** (using the existing `t(\`${key}Title\`)` and `t(\`${key}Steps\`)` strings — no translation work needed).
- Case-insensitive, diacritic-insensitive substring match.
- Empty query → show full sectioned layout. Active query → flatten to a single "Results" list with section labels next to each match; show "No results" empty state with a Clear button.
- Section chips hidden while searching.
- Search input gets a Clear (×) button and supports `Esc` to clear.
- Keyboard `/` shortcut focuses search (desktop).

## Visual refresh

- Larger, more tactile cards: rounded-xl, soft shadow, hover lift, icon in a colored chip that matches the section's tab color token (training/rehab/nutrition/mental/progress).
- Section headers use a 4px left accent bar in the section's color + bold title + topic count.
- "NEW" badge styling kept but refined to a subtle pill.
- Expanded answer slides in below its card with a colored top border matching the section.
- Sticky search uses a backdrop-blur on scroll for the modern feel.
- Honors RTL for Arabic (chip row reverses, accent bar flips to right).

## Technical details

- File: `src/pages/Help.tsx` (single-file rewrite; no new routes).
- Add a typed `SECTIONS` array describing `{ id, titleKey, color, topics: HelpTopicKey[] }`. Keep `helpSections` topic metadata (icon, isNew) and reference it from sections.
- Search: local `useState` for query; `useMemo` for filtered topics. Normalize via `String.prototype.normalize('NFD').replace(/\p{Diacritic}/gu, '')`.
- Section chips use `scrollIntoView({ behavior: 'smooth', block: 'start' })` on click; each section gets `id="help-section-<id>"`.
- Sticky bar uses `sticky top-0 z-20` with `bg-background/80 backdrop-blur` (and respects the gradient transition by adjusting where stickiness starts — place sticky inside the light theme section).
- Reuse existing translation keys; **no `translations.ts` changes** required for this rebuild.
- Changelog block stays as-is at the bottom (already collapsible). Optional small polish: wrap each year's entries with the same card style — out of scope unless desired.
- Components used: existing `Collapsible`, `Input` from `@/components/ui/input`, lucide `Search`, `X`, plus current icons. Use `cn` and semantic tokens only — no hard-coded colors.

## Out of scope

- Rewriting any help copy or changelog entries.
- Backend / DB changes.
- Adding new help topics (only reorganizing the existing 15 + Install).
- Restructuring the changelog itself.
