# Stripe tilpasses de nye klubpriser

Prissiden viser de nye trin, men betalingen bag ved gør det ikke. Lige nu:

- `create-checkout-session` kender kun de gamle trin (59 / 99 / 399 / 699 / 1.299 kr) — der findes ingen produkter for 7.500 og 12.000 kr/år.
- Knappen "Kom i gang" på /priser sender bare brugeren til `/auth`; der oprettes ingen betaling.
- Den gamle `/pricing`-side viser stadig de gamle trin og månedlig/årlig-skifter.
- `check-subscription` mapper Stripe-produkter til de gamle trin-navne (athlete, coach_solo, team_small/medium/large).

## Det der laves

### 1. Nye produkter i Stripe
To årlige produkter i DKK, inkl. moms:

- Klub — 7.500 kr/år (op til 50 medlemmer)
- Klub Plus — 12.000 kr/år (51-100 medlemmer)

"Større klub" får ingen pris — den fører fortsat til kontaktformularen.
50 %-rabatten til de første fem klubber gives manuelt (ingen kupon i systemet).

### 2. Checkout fra prissiden
"Kom i gang" starter en rigtig Stripe-betaling:

- Ikke logget ind → send til oprettelse/login og returnér til /priser bagefter.
- Logget ind → åbn Stripe checkout for det valgte trin i ny fane.
- Efter betaling: tilbage til kvitteringssiden, som allerede findes.

### 3. Gamle trin fjernes
- Alle gamle prisid'er og trin (atlet, coach, team small/medium/large) fjernes fra checkout-funktionen.
- `/pricing`-siden nedlægges og sender videre til `/priser`.
- Abonnementsindstillinger og adgangsregler opdateres til de to nye klubtrin.
- Eksisterende betalende kunder rører vi ikke: deres nuværende abonnementer i Stripe kører videre, og de gamle produkter bliver stadig genkendt, når systemet tjekker deres adgang.

### 4. Adgang / medlemsgrænser
- Klub → op til 50 medlemmer, Klub Plus → op til 100.
- Grænsen skrives på klubben ved aktivt abonnement, som det allerede sker i dag.

### 5. Dokumentation
- Hjælpesiden opdateres med de to klubtrin, årlig fakturering og moms.
- Changelog v1.5.33.

## Teknisk

- Nye Stripe-produkter/priser oprettes via Stripe-værktøjet; pris-id'erne skrives ind i `supabase/functions/create-checkout-session/index.ts` som `club` / `club_plus` med kun `yearly`.
- `create-checkout-session`: `PRICE_IDS` reduceres til de to nye trin, `billingCycle` låses til `yearly`, valuta låses til `dkk` (priserne er DKK-only), `cancel_url` peger på `/priser`.
- `supabase/functions/check-subscription/index.ts`: `PRODUCT_TIER_MAP` udvides med de to nye produkt-id'er (`club` = 50, `club_plus` = 100); de gamle mappings bevares som grandfathered.
- `src/lib/entitlements.ts`: `SubscriptionTier` udvides med `club` / `club_plus`; `isTeamTier` og caps opdateres; gamle trin bevares som legacy-typer, så eksisterende kunder ikke mister adgang.
- `src/pages/Priser.tsx`: `handleCheckout(planId)` kalder `supabase.functions.invoke("create-checkout-session", { tier, billingCycle: "yearly", currency: "dkk" })`, med loading-state pr. kort og fejl-toast; ikke-logget-ind → `navigate("/auth?redirect=/priser")`.
- `src/pages/Pricing.tsx` slettes, og ruten i `src/App.tsx` erstattes af en redirect til `/priser`.
- `src/lib/currency.ts`: `TIER_PRICES` for gamle trin fjernes (currency-hjælpere bevares, hvis de bruges andre steder).
- `src/pages/SubscriptionSettings.tsx` opdateres til de nye trinnavne.
- Nye tekstnøgler til checkout-fejl/loading i alle 7 sprog.
