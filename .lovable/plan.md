Implementing the subscription/paywall system as previously described:

## Step 1 — Database migration
- `subscription_tiers` table (plan_id PK, price_dkk, athlete_limit nullable, plans_per_type nullable, all_modules bool, sort_order). Public read, admin write. Seed 5 tiers.
- `subscriptions` table (user_id PK FK, plan_id, stripe_customer_id, stripe_subscription_id, status, current_period_end). RLS: user reads own; service role writes.

## Step 2 — Edge Functions
- New `stripe-webhook` (verify_jwt=false) — handles checkout.session.completed, customer.subscription.updated, customer.subscription.deleted. Requires `STRIPE_WEBHOOK_SECRET`.
- New `cancel-subscription` — cancel_at_period_end via Stripe.
- Update `check-subscription` to also upsert into `subscriptions`.

## Step 3 — Frontend
- New `useSubscription()` hook (plan_id, current_period_end, status, canCreatePlan, canAddAthlete).
- New `UpgradeModal` component with variants: plan-limit, module-locked, athlete-limit, requires-subscription.
- New `/settings/subscription` page (current plan, next billing, change/cancel).
- Edit Dashboard to show padlock overlays for locked modules (atlet/free).
- Edit plan-generation entry points (training/mental/nutrition) to enforce `canCreatePlan`.
- Edit `CreateAthleteDialog` to enforce athlete limit.
- Edit `Onboarding` to redirect to `/pricing?onboarded=1` if no active subscription.
- Minor `Pricing.tsx` ordering tweak (Atlet · Træner · Small · Medium · Large in one flow).

## Step 4 — i18n
~25 new keys × 5 languages.

## Step 5 — Secret
Request `STRIPE_WEBHOOK_SECRET` after webhook is deployed.

## Notes
- Internal tier IDs stay (athlete/coach_solo/team_small/team_medium/team_large); spec names mapped via i18n.
- Existing `useEntitlements`, `UpgradeGate`, route locks remain functional.
- No existing routes broken.