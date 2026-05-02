## Mål

Tilføje en kompakt pris-sektion på landing page (`/`) der viser de 5 tiers som "fra-pris"-punkter og leder brugeren videre til den eksisterende `/pricing` side for fulde detaljer og checkout.

## Placering

Ny sektion `Pricing` indsættes i `src/pages/Landing.tsx` mellem `<Credibility />` og `<Waitlist />`. Den får `id="priser"` så vi kan linke til den fra navigation.

## Design (matcher eksisterende landing-stil)

- Baggrund: `bg-landing-navy` afløst sektion (alternerer med naboerne — tjekkes så der ikke bliver to navy i træk; ellers transparent)
- Overskrift: "Priser" + underrubrik "Find den plan der passer til dig"
- Et grid med 5 små kort (1 kolonne mobil, 2 på sm, 5 på lg):
  1. Atlet — fra X kr/md
  2. Træner Solo — fra X kr/md
  3. Hold Small — fra X kr/md
  4. Hold Medium — fra X kr/md (markeret "Mest populær" med rød ring)
  5. Hold Large — fra X kr/md
- Hvert kort: ikon, navn, "fra"-pris, 1-linje beskrivelse
- Stor primary CTA centreret under grid: "Se alle planer og funktioner →" → `Link to="/pricing"`
- Sekundær tekst: "Inkl. 14 dages prøveperiode. Ingen binding."

Priser hardcodes i komponenten med samme tal som i `/pricing` (single source of truth holdes i `subscription_tiers` for selve checkout, men landing-teaseren behøver ikke fetch — den er statisk markedsføring).

## Navigation

Tilføj "Priser"-link i `Nav` (desktop, mellem logo og auth-knapper) der scroller til `#priser`. På mobil holder vi det enkelt og lader brugeren scrolle.

## i18n

Nye nøgler i `src/i18n/translations.ts` (alle 5 sprog: da, en, sv, de, ar):
- `landingPricingTitle`
- `landingPricingSubtitle`
- `landingPricingFrom` ("fra")
- `landingPricingPerMonth` ("/md")
- `landingPricingPopular` ("Mest populær")
- `landingPricingCta` ("Se alle planer")
- `landingPricingTrialNote` ("14 dages prøveperiode · ingen binding")
- `landingPricingTierAthlete`, `landingPricingTierAthleteDesc`
- `landingPricingTierCoach`, `landingPricingTierCoachDesc`
- `landingPricingTierSmall`, `landingPricingTierSmallDesc`
- `landingPricingTierMedium`, `landingPricingTierMediumDesc`
- `landingPricingTierLarge`, `landingPricingTierLargeDesc`
- `landingV2NavPricing` (nav-link)

## Filer der ændres

- `src/pages/Landing.tsx` — ny `Pricing` sektion + nav-link
- `src/i18n/translations.ts` — nye keys på 5 sprog

## Hvad det IKKE gør

- Ingen ændringer til `/pricing`, Stripe, edge functions eller DB
- Ingen checkout-knapper på landing — kun teaser + link videre
