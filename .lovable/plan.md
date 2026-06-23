# Vis korrekt mental gennemgang ud fra rolle

## Problem
På `/dashboard?tab=mental` renderes altid `<MentalAssessment />` (atlet, 23 spørgsmål). Coaches (som Farooq) ser derfor atletens spørgsmål, selv om de har en dedikeret coach-version på `/coach/mental` med 18 spørgsmål i 6 spejlede kategorier.

## Løsning
Rolle-styr indholdet af Mental-fanen i `src/pages/Dashboard.tsx`.

### Ændringer i `src/pages/Dashboard.tsx`
1. Importer `CoachMentalAssessment` og `useRole` (allerede tilgængelig via `RoleContext`).
2. På linjen der renderer `activeTab === "mental"`:
   - Hvis `hasCoachRole === true` → render `<CoachMentalAssessment profile={profile} />`.
   - Ellers → render `<MentalAssessment profile={profile} />` som i dag.
3. Påmindelseskortet ("Månedlig mental gennemgang", linje 842-849):
   - Skift query for "sidste vurdering" til `coach_mental_assessments` når brugeren er coach, så coaches får påmindelse baseret på deres egne reviews (ikke en atlet-tabel de aldrig udfylder).
   - Tekst forbliver via eksisterende translation keys (`mentalReminderTitle` / `mentalReminderDesc`); ingen nye oversættelser nødvendige.

### Hvorfor `hasCoachRole` (og ikke kun `isCoachMode`)
Farooq kan skifte til "atlet-visning" via hjem-ikonet, men han har ingen reel atlet-rolle — så mental-fanen skal stadig vise coach-versionen for ham. `hasCoachRole` fra `RoleContext` er præcis dette signal.

### Out of scope
- Ingen ændringer i `/coach/mental` ruten — den bevares som direkte indgang.
- Ingen ændringer i `CoachMentalAssessment`-komponenten eller edge function.
- Ingen nye oversættelser eller changelog-opdatering (ren bugfix).

## Verifikation
- Som coach (rashid3105@gmail.com): `/dashboard?tab=mental` viser 18 coach-spørgsmål i de 6 spejlede kategorier.
- Som ren atlet: samme fane viser uændret atlet-flow (23 spørgsmål).
- Påmindelseskort vises korrekt baseret på den relevante tabel pr. rolle.
