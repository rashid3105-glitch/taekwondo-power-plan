# Fix: Superadmin viser for mange atleter

## Problem
Med superadmin TIL viser coach-overview lige nu atleter fra **alle klubber** på én gang (Copenhagen City + Tøyen + …). Det føles som en fejl — du vil have, at listen følger den klub, du har valgt i klubvælgeren, og at du skifter klub for at se andre.

## Løsning (minimal, kun frontend)

**`src/pages/CoachDashboard.tsx`**
- Fjern den cross-club merge der henter `coach_athletes` på tværs af klubber, når superadmin er TIL.
- Send **ikke** `allClubs={true}` til `SquadOverview` længere — brug altid den aktive klub.
- Behold superadmin-badge, men omformulér til: *"Superadmin TIL — skift klub i vælgeren for at se andre klubbers atleter"* (alle 7 sprog).
- Behold den forbedrede tomme-tilstand ("0 atleter i denne klub — skift klub").

**`src/components/coach/SquadOverview.tsx`**
- `allClubs`-prop bliver ubrugt fra dashboardet, men beholdes (ingen breaking change). Default forbliver `false`.

**`src/i18n/translations.ts`**
- Opdatér `coachSuperadminAllClubs`-teksten på alle 7 sprog til den nye formulering.

## Effekt
- Superadmin TIL + aktiv klub = Tøyen → du ser kun Tøyen-atleter (inkl. Axel).
- Skift til Copenhagen City i klubvælgeren → du ser CC-atleterne.
- Superadmin giver stadig **læseadgang** til alle klubber via klubvælgeren (uændret) og RLS-bypass (uændret) — det er kun listen i overview, der nu filtreres pr. valgt klub.

Ingen DB-ændringer, ingen RLS-ændringer.
