# Rediger og kopiér træningsplan

Planen der genereres automatisk skal kunne tilpasses den enkelte atlet — både af atleten selv og af coachen — og øvelser skal kunne kopieres til andre dage.

## 1. Kopiér til andre dage

- Ny knap på hver øvelsesrække: "Kopiér til…" åbner en lille dialog med alle ugens dage (afkrydsning, flere dage ad gangen).
- Ny knap i sessionens bund: "Kopiér hele sessionen til…" med samme dagvælger.
- Ved kopiering til en dag med flere sessioner vælges hvilken session der modtager øvelserne; hviledage får automatisk oprettet en styrke-session.
- Valgmulighed: tilføj til eksisterende øvelser (standard) eller erstat dagens øvelser.
- Bekræftelse med toast: "Kopieret til 2 dage".

## 2. Redigering af den autogenererede plan

- Øvelsesdetaljer kan redigeres direkte: sæt, reps, pause, tempo og coaching-cue — gemmes på planen (ikke kun som log).
- Sessionens navn, fokustekst og type (teknik / styrke / restitution / hvile) kan redigeres via et lille rediger-ikon i sessionens hoved.
- Dage kan skifte mellem hvile og træning, så en plan kan tilpasses en atlet der fx træner en ekstra dag.
- Alle ændringer gemmes på atletens egen plan — den oprindelige klub-/genererede skabelon påvirkes ikke.

## 3. Adgang

- Atleten redigerer sin egen plan på Træn-siden.
- Coachen redigerer samme plan fra Administrer atlet, hvor ændringerne slår igennem hos atleten.
- Ændringer foretaget af coachen markeres diskret, så atleten kan se hvad coachen har justeret.

## Teknisk

- Al redigering sker i `src/components/AIPlanCard.tsx`, som allerede har `savePlanData` (skriver `training_plans.plan_data`) og `updateSessionExercises`. Der tilføjes:
  - `handleCopyExercise(dayIndex, exerciseIndex, targets[])` og `handleCopySession(dayIndex, sessionIndex, targets[])`, begge byggende på `normalizeDaySessions` / `buildDayWithSessions` fra `src/lib/planSessionUtils.ts`.
  - Ny komponent `src/components/plan/CopyToDaysDialog.tsx` (dagvælger + tilføj/erstat).
  - Ny komponent `src/components/plan/EditSessionDialog.tsx` (label, fokus, type).
  - Inline felt-redigering i `AIExerciseRow` for sæt/reps/pause/tempo, som skriver til `plan_data` via `savePlanData`.
- Coach-flow bruger den eksisterende `coachMode`-prop i `CoachAthleteDetail.tsx`; øvelser ændret i coachMode får `modifiedBy: "coach"` i plan-data til badge-visning.
- Nye tekster tilføjes til alle 7 sprog i `src/i18n/translations.ts` (ingen hårdkodet tekst).
- Changelog og hjælpetekst opdateres i `src/pages/Help.tsx`.
