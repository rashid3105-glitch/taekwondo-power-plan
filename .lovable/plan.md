## Mål
Når superadmin er aktiv, skal coach-dashboardet vise atleter på tværs af klubber (ikke kun aktiv klub). Når superadmin er FRA, beholdes nuværende klub-filter, men tom liste skal vise en tydelig "0 atleter i denne klub — skift klub"-besked.

## Ændringer

### 1. `src/pages/Coach.tsx` (eller hvor coach-atletlisten hentes)
- Læs `is_admin()` / superadmin-toggle state (samme kilde som header-toggle bruger).
- Hvis superadmin aktiv:
  - Hent atleter via `coach_athletes` joined med `profiles` UDEN `club_id`-filter.
  - Vis et lille badge på listen: "Superadmin: viser alle klubber" + klubnavn pr. atlet-kort.
- Hvis superadmin FRA:
  - Behold nuværende filter på `activeMembership.club_id`.
  - Hvis listen er tom: vis empty-state med tekst "0 atleter i denne klub" + knap/hint "Skift klub" der åbner klubvælgeren.

### 2. Atlet-kort
- Tilføj lille klub-chip under navnet, men KUN når superadmin viser på tværs af klubber (ellers redundant).

### 3. Oversættelser (`src/i18n/translations.ts`)
Nye nøgler på alle 7 sprog (en, da, sv, de, ar, no, es):
- `coachSuperadminAllClubs` — "Superadmin: viser atleter på tværs af alle klubber"
- `coachNoAthletesInClub` — "0 atleter i denne klub"
- `coachSwitchClubHint` — "Skift klub for at se andre atleter"

### 4. Ingen DB-ændringer
RLS tillader allerede admins at se alle `coach_athletes`-rækker; det er kun klient-filteret der skjuler dem.

## Acceptkriterier
- Som superadmin med superadmin-toggle ON: Axel Dahl-Engh vises i listen uanset aktiv klub.
- Som superadmin med toggle OFF og aktiv klub ≠ Tøyen: Axel skjult, og tom Tøyen-visning viser ny besked.
- Almindelige coaches mærker ingen forskel.