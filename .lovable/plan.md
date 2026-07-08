# Homepage redesign — Baseline-inspired

## What Baseline does well (and we should borrow)

- **Sticky, minimal nav** with a single yellow CTA and a subtle promo bar on top.
- **Cinematic hero**: full-bleed dark background image/video, a "SYSTEM ACTIVE" status chip, a two-line headline with one word in an accent color, three benefit bullets, two CTAs (primary + "See how it works").
- **Live data overlay** on the hero — a fake telemetry HUD (lap times, delta, pedal traces). For us this becomes an athlete cockpit: readiness score, HRV, load, week volume, mood.
- **Problem → Solution → Features → How it works → Pricing → FAQ → Final CTA** — a classic long scroll.
- **Feature cards** on a dark grid with monospace labels and thin dividers.
- **Numbers/stats band** ("2,847 drivers, 156k laps").
- **Consistent typography**: uppercase display font for headlines, mono for labels/data, sans for body.

All of this is compatible with the current Sportstalent "cockpit" aesthetic — no framework changes, no new dependencies.

## Estimate

- **Small (1–2 hours of work / 1 iteration):** Restyle current hero to match Baseline's layout — add status chip, accent-word headline, benefit bullets, live cockpit HUD, dual CTA. Keep the rest of the current page.
- **Medium (half a day / 2–3 iterations, recommended):** Full section-by-section rebuild of `Index.tsx` (hero, problem, solution, features, how-it-works, stats, pricing teaser, FAQ, final CTA), reusing existing brand tokens, images, and translations. What I'd recommend.
- **Large (1–2 days):** Medium + custom animations (scroll-reveal, animated counters, HUD values that update over time), new hero background photography/video, and matching restyle of `/platform`, `/funktioner`, `/priser`, and `/about` so the whole marketing surface feels coherent.

## Proposed structure for the new homepage

```text
┌─ Promo bar: "Beta åben — 3 måneder gratis"           [CTA →]
├─ Sticky nav (unchanged links, tighter styling)
│
├─ HERO
│    [SYSTEM ACTIVE chip]
│    "Hæv dit niveau.  Træn med præcision."
│    Sub: én linje om hvad platformen gør
│    • Consistency under pressure
│    • Bedre restitution og form
│    • Færre skader, mere tid på gulvet
│    [Prøv gratis]  [Se hvordan det virker]
│    ── Cockpit HUD overlay: readiness, HRV, load, mood
│
├─ PROBLEM  — 3 kort: "Ingen overblik / Spildt træning / Plateau"
├─ SOLUTION — "Data slår mavefornemmelse", split med screenshot
├─ FEATURES — 6 kort (Dagbog, Mental, Kamp, Ernæring, Tests, Klub)
├─ HOW IT WORKS — 3 trin (Opret klub → Invitér atleter → Følg udvikling)
├─ STATS band — atleter, klubber, sessioner logget
├─ TESTIMONIAL — 1 citat, plads til flere senere
├─ PRICING teaser — 3 tiers, "Se alle priser"
├─ FAQ — 5 spørgsmål (accordion)
└─ FINAL CTA — "Klar til at hæve niveauet?" + signup
```

## Technical notes

- Edit only `src/pages/Index.tsx`; reuse `BrandLogo`, `LanguageSwitcher`, `PageMeta`, existing coach imagery in `src/assets/`.
- Keep the inline-style approach the file already uses so I don't need to touch the design system.
- All copy pulled from `useLanguage()` — I'll add new keys across all 7 locales (da, en, sv, de, ar, no, es), matching the memory rule.
- Cockpit HUD is a static SVG/CSS composition of real metric names from the app (readiness, HRV, load, mood, weekly volume) — no live data, just visual.
- Respect the "no AI jargon" rule — I'll use "System" / "Personaliseret", not "AI".
- Native-app compliance: pricing teaser hidden when `isNativeApp()` is true, same as today.
- Redirect for authenticated users stays intact.

## Open questions before build

1. Which size do you want — **Small**, **Medium (recommended)**, or **Large**?  
Medium
2. Should I keep the current yellow (#F5C842) as the accent color, or introduce a second accent (e.g. cyan/red) for the highlighted headline word like Baseline does?  
yes please keep the current yellow
3. Do you have real numbers to put in the stats band (athletes, clubs, sessions), or should I leave that section out until you do?  
keep it out for now.  
  
Make sure that we dont miss anything important. Maybe let me see the new page before we put it to production. 