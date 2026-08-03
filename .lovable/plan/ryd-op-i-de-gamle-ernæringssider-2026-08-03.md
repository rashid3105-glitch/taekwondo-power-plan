# Ryd op i de gamle ernæringssider

## Hvorfor du ser den gamle side

Skærmoptagelsen viser ikke det nye vægt-/kostmodul, men den gamle side i **Bibliotek → Ernæring → Kostplanlægger** (`/library/nutrition`). Den viser stadig den gamle "Kalorieberegner (TDEE)", den gamle makro-oversigt og den AI-genererede "Taekwondo Præstationsplan" med den store advarselsboks.

Det nye modul (I dag / Status / Kostplan med kaloriering, makrokort, vægtkurve og madlog) ligger kun ét sted: **Dashboard → Ernæring → Vægt & kalorier**. De to indgange lever side om side i dag, og det er den gamle du er landet på.

## Hvad der ændres

1. **Bibliotek → Ernæring** forenkles til to kort:
   - "Vægt & kalorier" → åbner det nye modul (samme komponent som på dashboardet)
   - "Opskrifter" → uændret
   De gamle kort "Kostplanlægger" og "Madregistrering" fjernes — begge funktioner findes nu inde i det nye modul (fanerne I dag og Kostplan).

2. **Dashboard → Ernæring** beholder sine to kort (Vægt & kalorier, Opskrifter), så begge indgange fører samme sted hen.

3. **Den gamle TDEE-oversigt fjernes helt.** Komponenten bruges kun de to steder i biblioteket og slettes.

4. **Den AI-genererede kostplan bevares**, men kun ét sted: fanen "Kostplan" inde i det nye modul. Den selvstændige indgang i biblioteket fjernes.

5. **Den offentlige marketingside `/kostplan` beholdes** — den er en salgsside, ikke en app-side, og der linkes til den fra coach-landingssiden.

6. Hjælp-siden opdateres, så vejledningen peger på den ene rigtige indgang, og changelog får en note om oprydningen.

## Teknisk

- `src/pages/Library.tsx`: fjern `nutritionView`-tilstandene `planner` og `logger`; erstat med `weight`, der renderer `WeightModule`. Fjern importer af `DailyNutritionDashboard`, `FoodScanner`, `NutritionPlan` og `ErrorBoundary`-wrapperen omkring scanneren.
- Slet `src/components/DailyNutritionDashboard.tsx` (ingen andre brugere efter ovenstående).
- `src/components/NutritionPlan.tsx` og `src/components/FoodScanner.tsx` beholdes — de bruges af henholdsvis `WeightModule` (fanen Kostplan) og `DailyOverview` (madlog).
- Tilføj/genbrug oversættelsesnøgler til bibliotekskortet på alle 7 sprog; fjern de nu ubrugte `libNutritionPlanner*` / `libNutritionLogger*`-nøgler.
- `src/pages/Help.tsx`: opdatér ernæringsafsnittet + changelog (v1.5.16).
