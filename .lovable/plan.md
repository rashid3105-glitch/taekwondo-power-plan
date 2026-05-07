# Sportier Light Redesign + Trust Line + Footer Wiring

Three focused changes to `/` (`CoachLanding`).

## 1. Color overhaul — sporty, Everfit-inspired

Move from "dark martial arts" to a **bright athletic SaaS** look (white backgrounds, bold accent, generous whitespace), while keeping the taekwondo identity through a single confident accent color and the existing typography.

### New palette (replaces `C` token block, lines 19–29)

| Token | Old | New | Use |
|---|---|---|---|
| `bg` | `#0A0A0C` (near-black) | `#FFFFFF` | Page background |
| `bg2` | `#111114` | `#F6F8FB` | Section bands, mockup chrome |
| `bg3` | `#17171B` | `#EEF2F7` | Subtle surfaces |
| `text` | `#F0EDE8` | `#0B1220` | Primary text (deep navy-black) |
| `muted` | `#5A5860` | `#5B6678` | Secondary text |
| `border` | `#23232A` | `#E4E8EF` | Hairlines, card borders |
| `red` | `#E8002D` | `#E63946` | Primary accent (slightly warmer, friendlier) |
| `redDeep` | `#8B0019` | `#0B1220` | Final CTA band → switch to deep navy block (white text) for contrast |
| `gold` | `#C9A84C` | `#0EA5E9` | Secondary accent → bright sport-blue (replaces the dark gold) |

Why blue replaces gold: Everfit and most modern fitness SaaS pair red/coral with cyan-blue for "data / progress / health". Gold reads luxe, not athletic.

### Section-level adjustments

- **Hero**: white background; the radial glow becomes `red/15 → transparent`. Headline color → navy text, animated word stays red. Primary CTA stays solid red, secondary CTA gets a clean navy outline (no gray).
- **Marquee** (`bg2` light): chips become white pills with `border` hairline + navy text — stands out cleanly.
- **Features cards**: white cards on `bg2` band, with a 1px top accent in red (keep), icon color → blue.
- **How It Works**: light gray band (`bg2`), step number circles outlined in blue.
- **Split section**: coaches card uses red tint (`#E63946 + 8% alpha`), athletes card uses blue tint (`#0EA5E9 + 8% alpha`). Both on white.
- **Testimonials**: white cards on `bg2`, left-border red, big stat in blue, quote mark in blue.
- **Pricing**: white cards, popular tier outlined in red with red CTA, others outlined in border with navy outline CTA.
- **Final CTA band**: deep navy `#0B1220` (replaces deep red) with white headline and a white CTA button containing navy text. Reads as a confident "closing" block without screaming.
- **Footer**: white background with subtle `bg2` top section, navy text, muted hairlines.
- **Nav**: white sticky bar, subtle bottom border, logo in navy with red 🥋 emoji.

No global theme tokens are touched — `C` stays scoped to this file.

## 2. Trust line — replace named clubs

Currently `Marquee` (lines 258–287) shows real club names. Replace with a single, calm trust line — no logos, no names — so we don't imply endorsements:

> **EN:** "Used by clubs specialized in sparring and poomsae — and built so any club can benefit."
> **DA:** "Brugt af klubber med fokus på kamp og poomsae — bygget så alle klubber kan få gavn."
> **SV:** "Används av klubbar specialiserade på sparring och poomsae — byggd så alla klubbar kan dra nytta."
> **NO:** "Brukt av klubber spesialisert på sparring og poomsae — bygget så alle klubber kan dra nytte."
> **DE:** "Genutzt von Vereinen mit Fokus auf Sparring und Poomsae — gebaut, damit jeder Verein profitiert."
> **AR:** "تستخدمه أندية متخصصة في القتال والبومسي — ومصمم ليستفيد منه أي نادٍ."

Visual treatment: a single centered band on `bg2`, small uppercase eyebrow ("Trusted by") on the left, the sentence centered in body text. No marquee animation, no chips, no club list. Removes the `CLUBS` array and the `marqueeTrust` string + keyframes.

## 3. Footer wiring (real routes + 6-locale labels)

Convert `coachLandingStrings.ts` `footerCols.links` from `string[]` to `{ label: string; href: string }[]`, populate for all 6 locales, and update the `Footer` component (lines 487–517) to render `<Link>` for `/...` hrefs and `<a>` for `#...` anchors.

### Final structure (hrefs identical across locales)

**Platform** — Features `#features` · Pricing `/pricing` · Methodology `/methodology` · Programs `/programs` · Help Center `/help`

**For Coaches** — Coach Dashboard `#for-coaches` · Plan Builder `#for-coaches` · Squad Reports `#for-coaches` · Roster Management `#for-coaches` · Book a demo `/contact`

**For Athletes** — Daily Diary `#for-athletes` · Readiness Check `#for-athletes` · Progress Tracking `#for-athletes` · Performance Library `#for-athletes` · Install the app `/install`

**Company** — About `/about` · Contact `/contact` · Privacy Policy `/privacy` · Sign in `/auth?tab=signin` · Start free `/auth?tab=signup`

All target routes already exist in `src/App.tsx`. Labels translated for EN, DA, SV, NO, DE, AR.

## Files touched

1. **`src/pages/CoachLanding.tsx`**
   - Replace `C` palette block (lines 19–29).
   - Adjust per-section color usages where the old dark contrast no longer works (Nav, Hero glow, Features icon, How step circle, Final CTA band, etc.).
   - Replace `Marquee` component (and the `CLUBS` array) with a static `TrustLine` component.
   - Update `Footer` to render real routes via `<Link>` / `<a>` based on href prefix.

2. **`src/pages/coachLandingStrings.ts`**
   - Update `CLStrings` type: drop `marqueeTrust`, add `trustLine: string`; change `footerCols.links` to `{ label: string; href: string }[]`.
   - Update all 6 locale objects accordingly.

3. **`.lovable/memory/features/club-landing-page.md`**
   - Update note: light Everfit-style palette, navy/red/blue, trust line (no club names), footer wired to real routes.

## Out of scope

- No copy/content changes besides the trust line and footer labels.
- No new pages or routes.
- No changes to `/v1`, `/v2`, or any other page.

If you approve, I'll implement in one pass.
