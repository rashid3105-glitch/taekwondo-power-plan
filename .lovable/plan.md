

## Match the market: competitive pricing

Athlete Analyzer is the closest competitor (judo/karate/TKD/fencing). Here's their pricing vs ours today:

| Plan | Athlete Analyzer | Sportstalent (today) |
|---|---|---|
| Single athlete | €5.99/mo · €59/yr | €13/mo · €140/yr |
| Single coach | €14.99/mo · €149/yr | — |
| Team / 5 athletes | €54.99/mo · €549/yr | €63/mo · €680/yr |
| Team / 15 athletes | €99.99/mo · €999/yr | "Custom" |
| Team / 25 athletes | €139.99/mo · €1,399/yr | "Custom" |

We're more expensive at every comparable tier and we hide the team prices behind "Contact us", which kills self-serve conversion. The fix: undercut on the entry tier, match on the team tiers, and surface concrete prices for 5/15/25 athletes.

### New pricing (proposed)

| Plan | Monthly | Yearly | Save |
|---|---|---|---|
| **Athlete** (1 athlete) | **€4.99** | **€49** | 18% |
| **Coach** (1 coach, no athletes) | **€12.99** | **€129** | 17% |
| **Team Small** (up to 5 athletes) | **€49** | **€490** | 17% |
| **Team Medium** (up to 15 athletes) | **€89** | **€890** | 17% |
| **Team Large** (up to 25 athletes) | **€129** | **€1,290** | 17% |
| **National team / Federation** | Custom | Custom | — |

Why these numbers:
- **Athlete €4.99** beats their €5.99 — anchors us as the cheaper individual entry.
- **Coach €12.99** undercuts their €14.99.
- **Team tiers** sit €5–€10/mo below Athlete Analyzer at every step.
- **Yearly = ~10 months** (matches the "save 17%" badge industry standard, slightly better than their 16%).
- DKK shown in Danish locale converted at ~7.45 DKK/EUR.

### What changes (visible)

1. **Pricing page (`/pricing`)** moves from 3 cards to 6 cards in 2 rows:
   - Row 1 (individuals): Athlete · Coach
   - Row 2 (teams): Team Small (5) · **Team Medium (15) — "Most Popular"** · Team Large (25)
   - Federation card stays as the "Contact us" footer (replaces the current Enterprise card).
2. **Monthly/Yearly toggle** keeps the existing UX, but the green "Save" badge updates to "Save 17%".
3. Each card lists the included athlete count, coach seats, and a small "Includes onboarding" line for the 15+ tiers — matches Athlete Analyzer feature list and removes the perception they offer more.
4. **Demo / 14-day trial card** stays at the bottom.

### Database & billing (technical)

The current Stripe setup only has 4 price IDs (Personal monthly/yearly + Coach monthly/yearly). For the new structure we need 10 prices (5 tiers × 2 cycles). Concretely:

- Create new Stripe Products + Prices for: `athlete`, `coach_solo`, `team_small`, `team_medium`, `team_large` (monthly + yearly each). Use the Stripe payments tools to provision them.
- Update `supabase/functions/create-checkout-session/index.ts` `PRICE_IDS` map to the new 5-tier shape.
- Update `supabase/functions/check-subscription/index.ts` to map the new product IDs back to a tier name and write it to `profiles.subscription_tier` (already exists).
- Add a DB migration so coaches' `max_athletes` is set automatically when a subscription is detected: `team_small` → 5, `team_medium` → 15, `team_large` → 25. Implemented as a small RPC called from `check-subscription` (no schema change needed — `clubs.max_athletes` already exists per the coaches memory).
- Existing customers on the legacy Personal/Coach prices stay grandfathered — `check-subscription` will continue to recognize the old product IDs and map them to the closest new tier (Personal → Athlete, old Coach → Team Small).

### Frontend changes

- `src/pages/Pricing.tsx` — replace the `tiers` array with the 5-tier structure, switch grid to `md:grid-cols-2 lg:grid-cols-3`, mark Team Medium as the popular tier, move "Federation" into a single contact card below.
- `src/i18n/translations.ts` — replace existing pricing keys and add ~25 new ones (`pricingTierAthlete`, `pricingTierTeamSmall`, `pricingTierTeamMedium`, `pricingTierTeamLarge`, `pricingTeamFeatureOnboarding`, etc.) across all 6 locales. DKK prices localized for `da`/`no`.
- `src/components/landing/ValuePlanCombo.tsx` — update the landing-page price snippet so it matches the new entry price (€4.99/mo).
- Update the "Save 10%" badge to "Save 17%".

### Out of scope
- Add-ons (opponent scouting) — Athlete Analyzer charges extra for these; we keep all features included as a differentiator.
- Per-seat coach pricing inside teams — flat tier pricing is simpler and a stronger comparison.
- Currency switcher (USD/GBP) — defer until we see demand outside the EU/Nordic market.

