

## Make the landing page punchier and easier to scan

The current page asks visitors to scroll through ~8 dense sections before reaching the final CTA. We'll cut redundancy, merge related blocks, and let the hero do more selling.

### What changes (visible)

**1. Hero — make it the centerpiece**
- Increase the hero photo's presence (opacity 40 → 65, taller crop) so the coach + athlete image actually carries the page.
- Inline the three social-proof chips (50+ athletes · 10.5% jump · Cadet→Senior) directly under the CTA buttons instead of in their own section below.
- Drop the third "View Pricing" button — keep two CTAs only (Get Started + How it works). Pricing stays one click away in the nav.

**2. Remove the standalone "Social Proof Bar" section** — merged into hero.

**3. Replace the 3-column "Value Props" + full 7-day "WeekPlanPreview" with one combined "Proof in one screen" block**
- A single rounded card showing: 3 short value bullets on the left (Periodized · TKD-Specific · Personalized), and a compact 3-day preview (Mon/Tue/Wed) with intensity bars on the right.
- Add a "See full week →" link that opens the existing `SamplePlanPreview` dialog instead of always rendering all 7 days.
- Net effect: visitors get the value prop + a tangible plan example in one viewport instead of two long sections.

**4. Compress the CaseStudy**
- Hide the "Before / Intervention / Quote" blocks behind a "Read full story" toggle (collapsed by default).
- Show only: name + headline + the 4 metric tiles + story navigator. This is the part that converts; the rest is for skeptics who want depth.

**5. Tighten FeatureGrid (8 → 8 but lighter)**
- Keep all 8 features (they map to dashboard tabs) but switch to a denser 4-column grid on desktop / 2-column on mobile, with smaller cards (icon + title only, description on hover/tap). Removes a wall of body copy.

**6. FAQ — collapse to 3 questions by default**
- Show top 3 FAQs expanded-collapsible, with a "Show all questions" link to reveal the remaining 2. Most visitors don't read all 5.

**7. Final CTA — keep as-is** (it's already tight and effective).

### Section count: 8 → 5
```text
Before: Hero → Proof bar → Values → WeekPlan → CaseStudy → Features → FAQ → CTA
After:  Hero(+proof) → Values+Plan combo → CaseStudy(compact) → Features(dense) → FAQ(3) → CTA
```

### Technical notes
- `src/pages/Index.tsx`: remove the "Social Proof Bar" and "3-Column Value Props" sections; replace the `<WeekPlanPreview />` mount with a new `<ValuePlanCombo />` component.
- New file `src/components/landing/ValuePlanCombo.tsx`: side-by-side card with 3 value bullets + 3-day mini-plan + "See full week" trigger that reuses `SamplePlanPreview`'s dialog.
- `src/components/landing/CaseStudy.tsx`: wrap problems/intervention/quote in a `<Collapsible>` (already in ui kit), default closed, "Read full story" trigger.
- `src/components/landing/FeatureGrid.tsx`: switch to `sm:grid-cols-2 lg:grid-cols-4`, hide description text on `lg+`, show on hover via `group-hover:opacity-100`.
- `src/components/landing/FAQSection.tsx`: split `faqKeys` into first 3 + remaining 2, gated by a `showAll` state with a "Show all questions" button.
- No new translation keys needed except 2: `landingSeeFullWeek`, `landingReadFullStory`, `landingShowAllFAQ` (added to all 6 locales).
- Hero image opacity bump in `Index.tsx` (single class change).

### What we deliberately keep
- All 8 dashboard features remain visible (just denser) — losing them would hurt SEO and feature discoverability.
- Case study stays prominent — it's the strongest social proof.
- Dark→light theme transition stays — it's part of the brand aesthetic.

