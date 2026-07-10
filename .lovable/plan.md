Gør menupunkterne i mobil-hamburger-menuen (`src/components/landing/LandingLayout.tsx`) ikon-only med tooltips/aria-labels.

Plan
1. Opdatér `NAV_LINKS` med et passende Lucide-ikon pr. menupunkt:
   - Hjem: Home
   - Platform: LayoutGrid
   - Funktioner: Sparkles
   - Priser: CreditCard
   - Om os: Info
   - Blog: Newspaper
2. Omskriv det mobile overlay-menu-område (`isMobile && menuOpen`) så hvert punkt viser ikon i en kompakt knap/grid frem for stor tekst.
3. Behold tekst-labelen som `aria-label` og `title` på hver knap (tilgængelighed + hover-tooltip), så brugeren ser ikonet, men skærmlæsere og lange tryk/long-press viser betydningen.
4. Bevar aktiv tilstand (gul kant/baggrund) og den eksisterende "Log ind"-knap nederst.
5. Verificér menuen i preview ved mobil-viewport (~720 px og derunder).

Tekniske detaljer
- Fil: `src/components/landing/LandingLayout.tsx`
- Importerer nye ikoner fra `lucide-react`.
- `aria-label` sættes til `l.label` (allerede oversat via `t(...)`), så ingen nye i18n-nøgler er nødvendige.
- Ingen ændringer af state, routes eller backend.