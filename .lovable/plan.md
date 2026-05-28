## Problem

Ændringerne i `AthleteDashboard.tsx` slog godt nok igennem (skærmbilledet viser det nye "I DAG"-kort og "NÆSTE BEGIVENHED" med live nedtælling). Men `src/pages/Dashboard.tsx` renderer selv en stribe ekstra kort **under** `<AthleteDashboard />` på hub-tab'en — så Dagbog-kortet (og naboerne) er der stadig. De blev aldrig flyttet ind i AthleteDashboard.

Konkret står der mellem `<AthleteDashboard />` (linje 913) og bunden af hub-tab'en:

- linje 930: `<ReflectionPromptCard />`
- linje 990: `<EnablePasskeyCard />`
- linje 993–1007: standalone "Dagbog"-knap (`NotebookPen`-ikon, "Noter, humør og energi fra hver træning") — det er det kort du ser på skærmbilledet
- linje 1010–1014: "Profil"-genvejsknap

## Plan

1. **Fjern Dagbog-knappen i `Dashboard.tsx`** (linje 993–1007). Dagbogen findes allerede via bundnavigation/floating UI, så den hører ikke til forsiden.

2. **Skjul de øvrige legacy-kort bag den eksisterende `SHOW_LEGACY_HUB_SECTIONS`-feature-flag** så de kan vækkes igen senere uden permanent sletning:
   - `<ReflectionPromptCard />`
   - `<EnablePasskeyCard />`
   - "Profil"-genvejsknappen i bunden (`/profile-setup` nås allerede via avatar i headeren)

3. Ingen ændringer i `AthleteDashboard.tsx`, `CoachDashboard.tsx`, `Help.tsx` eller changelog.

## Resultat

Hub-tab'en viser kun det nye `<AthleteDashboard />` (eller `<CoachDashboard />`) og intet andet derunder. Skærmbilledet ender med kun 2 kort: "I DAG" og "NÆSTE BEGIVENHED".
