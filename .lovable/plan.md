## Mål
Trænerens holdoversigt viser i dag 8-9 små tal-chips pr. atlet på én linje. Retningen "Simplified cockpit grid" beholder al information, men giver den hierarki: ét stort tal, én progresslinje, én statuslinje — resten vises ved hover/expand.

## Hvad ændres

### 1. Atletkort (`src/components/coach/SquadOverview.tsx`)
Kortet får fire zoner i stedet for én chip-stribe:

```text
┌─┬──────────────────────────────────────────────┐
│ │ [avatar+bælte]  Navn                     78  │
│ │                 Klub                 PARATHED│
│ │ ──────────────────────────────────────────── │
│ │ UGENTLIG AKTIVITET 3/5      7 dage siden sidst│
│ │ ▓▓▓▓▓▓░░░░                        ADVARSEL   │
│ │ [Ingen plan]  65% fuldført        ⚙ 👁 📓    │
└─┴──────────────────────────────────────────────┘
```

- **Venstre farvekant** beholdes (rød/gul/grøn fra `rowSeverity`).
- **Parathed** bliver kortets største tal, farvet efter status i stedet for en lille ikonchip.
- **Bælte** flytter til en lille cirkel på avataren (bogstav + bæltefarve) — fjerner en tekstchip.
- **Sessioner** bliver progressbar ("Ugentlig aktivitet 3/5") i stedet for tal-chip.
- **Dage siden sidst** får egen kolonne med statusord (I dag / X dage siden sidst + ADVARSEL).
- **Ingen plan** + **fuldførelses-%** samles i en rolig footer-linje.
- **Humør og klubnavn** flyttes til en tooltip på navnet og en linje der kun vises ved hover (desktop) — så intet data forsvinder.
- **Handlingsikoner** (administrér, se plan, dagbog) fades ind ved hover på desktop; på mobil/touch vises de altid, da hover ikke findes.

### 2. Pulsrække (`src/components/coach/SquadPulse.tsx`)
Samme fire tiles, men roligere: mindre etiket i versaler, tal i tal-vægt, dæmpet kant, aktiv tilstand kun med farvet kant + svag baggrund. Ingen ændring i filterlogik.

### 3. Værktøjslinje
Søgefelt fylder bredden, bælte/sortering samles i én række, tælleren (15/15) bliver dæmpet. Kompakt/kort-skifteren beholdes.

## Teknisk
- Kun præsentation: ingen ændringer i `get_squad_overview`, filtre, stats-beregning eller navigation til `/coach/athlete/:id`.
- Nye farver bruger eksisterende semantiske tokens (`destructive`, `primary`, `muted-foreground`) — ingen hardcodede hex.
- Nye tekster ("Ugentlig aktivitet", "dage siden sidst", "fuldført", "I dag", "Advarsel") tilføjes som nøgler i `src/i18n/translations.ts` på alle 7 sprog.
- `useIsMobile()` bruges til at afgøre om handlingsikoner altid skal vises.
- Kompakt-visningen (listeform) beholder den nuværende tætte linje, så trænere med mange atleter stadig kan scanne hurtigt.
- Changelog i `src/pages/Help.tsx` opdateres.

## Verifikation
`tsgo`, `bun run build`, samt screenshot af `/coach` i både desktop- og mobilbredde.
