# Pris-side & abonnement/paywall

App'en har allerede Stripe-integration (`create-checkout-session`, `check-subscription`, `customer-portal`), `useEntitlements`, og en `/pricing` side med 5 tiers. Planen genbruger dette og tilføjer det, der mangler: en database-styret tier-konfiguration, hårdere paywall, og en abonnementsindstillingsside.

## 1. Database

Ny migration:

- `subscription_tiers` (id `text` PK = `athlete|coach_solo|team_small|team_medium|team_large`, name, athlete_limit `int`, plans_per_type `int` (null = unlimited), all_modules `bool`, price_monthly_dkk, price_yearly_dkk, sort_order). Seed med de eksisterende 5 tiers. Læsbar af alle (public read), kun admin write.
- `subscriptions` (user_id PK, tier_id FK, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end). RLS: bruger kan se egen række; service role skriver via webhook/edge function.

## 2. Edge functions

- Opdater `check-subscription` så den **upserter** i `subscriptions` (kilde til sandhed offline) og returnerer `tier_id` baseret på pris→produkt mapping.
- Ny `cancel-subscription` (sætter `cancel_at_period_end=true` via Stripe API, returnerer effektiv slutdato).

Webhooks bruges ikke — `check-subscription` polling er allerede sat op (passer med `<stripe-implementation-subscriptions>` reglerne).

## 3. Paywall hook

Ny `src/hooks/useSubscription.ts` (wrapper over `useEntitlements` + ny `subscriptions`-query):

```ts
const { tier, status, canCreatePlan, canAddAthlete, isActive, currentPeriodEnd } = useSubscription();
```

- `canCreatePlan(type)` tjekker antal aktive planer mod `plans_per_type`
- `canAddAthlete()` tjekker antal koblede athletes mod `athlete_limit`

## 4. UI

**`/pricing` (eksisterende):**
- Behold layout, men hent tier metadata fra DB i stedet for hardcoded `individualTiers`/`teamTiers` arrays (priser/limits styres fra DB).
- Rækkefølge: Atlet → Træner → Small → **Medium (popular)** → Large → Federation.
- Hvis bruger har aktivt abonnement: vis "Nuværende plan"-badge på matchende kort, øvrige knapper bliver "Skift til denne plan" (opretter ny checkout — Stripe håndterer proration via portalen).
- Bevar månedlig/årlig toggle og valutadetektion.

**Ny `src/components/UpgradeModal.tsx`:**
Et delt modal med varianter: `module-locked`, `plan-limit`, `athlete-limit`. CTA → `/pricing`.

**Dashboard / feature kort:**
- Brug eksisterende `UpgradeGate`/`Watermark` mønster. Tilføj hængelås-overlay på låste kort (gratis/atlet) med teksten `Kræver abonnement` (ny i18n nøgle).
- Plan-genereringsknapper kalder `canCreatePlan(...)` og åbner UpgradeModal i stedet for alert.
- Coach "tilføj atlet" tjekker `canAddAthlete()`.

**Onboarding:**
Efter færdig onboarding uden aktivt abonnement → redirect til `/pricing?welcome=1` med banner: `Vælg et abonnement for at komme i gang`.

**Ny `/settings/subscription`:**
- Nuværende plan, status, fornyelses-/slutdato.
- Knapper: `Administrer abonnement` (→ `customer-portal`), `Opsig abonnement` (→ bekræftelsesmodal → `cancel-subscription`).
- Ved planlagt opsigelse: badge `Aktiv indtil [dato]`.

## 5. i18n

Tilføj ~25 nøgler på alle 5 sprog (DA/EN/SV/DE/AR), bl.a.:
`subscriptionRequired`, `currentPlan`, `switchToThisPlan`, `chooseSubscriptionToStart`, `manageSubscription`, `cancelSubscription`, `cancelConfirmTitle`, `cancelConfirmBody`, `activeUntil`, `planLimitReached`, `athleteLimitReached`, `moduleLocked`.

## 6. Routes

I `App.tsx`:
- `/settings/subscription` → ny side (kræver auth).
- Ingen ændringer i eksisterende routes.

## Filer der ændres / oprettes

Nye:
- `supabase/migrations/<ts>_subscription_tiers_and_subscriptions.sql`
- `supabase/functions/cancel-subscription/index.ts`
- `src/hooks/useSubscription.ts`
- `src/components/UpgradeModal.tsx`
- `src/pages/SubscriptionSettings.tsx`

Ændres:
- `supabase/functions/check-subscription/index.ts` (upsert til `subscriptions`, returner tier)
- `src/pages/Pricing.tsx` (DB-drevne tiers, current-plan badge, switch-flow)
- `src/pages/Dashboard.tsx` (hængelås-overlays + UpgradeModal)
- `src/pages/Onboarding.tsx` (post-onboarding redirect)
- `src/i18n/translations.ts` (nye nøgler × 5 sprog)
- `src/App.tsx` (ny route)

Sig til hvis Medium fortsat skal være "popular" plan, eller om jeg skal markere en anden — ellers går jeg i gang som beskrevet.