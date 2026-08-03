# Kostplanlægger: ny dagsoversigt

Runde 2 af kostplanlæggeren — nu selve oversigten, inspireret af skærmbilledet, men i appens Noir & Gold-look (ikke grønt).

## Sådan kommer skærmen til at se ud

Øverst i "Kost"-modulet, som det første man ser:

```text
   <   I DAG, 3. AUG.   >

 Indtaget      ( 1165 )      Forbrændt
    0        Tilbage i dag      0
             Mål 1165 kcal

 [Kulhydrater]  [Protein]  [Fedt]
   0/146 g       0/58 g     0/39 g

 MÅLFREMSKRIDT
 Opdater din vægt                (+)
 [======------------------------]
 60 kg                      50 kg

 MADLOG
 (dagens måltider med kcal, tryk for at slette)
```

1. **Datovælger** — pil frem/tilbage mellem dage, "I dag" som standard. Man kan se tidligere dage, men kun logge på i dag.
2. **Kaloriering** — guld ring der viser hvor meget der er tilbage af dagens mål. "Indtaget" til venstre (summen af dagens måltider), "Forbrændt" til højre (aktiv energi fra ur/telefon, hvis der er sundhedsdata — ellers 0). Tilbage = mål + forbrændt − indtaget. Ringen bliver rød hvis man går over målet.
3. **Makrokort** — kulhydrater, protein og fedt med lille fremdriftsbjælke. Mål udregnes ud fra dagens kaloriemål og retningen på vægtmålet (mere protein ved vægttab).
4. **Målfremskridt** — bjælke fra startvægt til målvægt med aktuel vægt markeret, plus en "+"-knap der åbner hurtig vægtregistrering.
5. **Madlog** — dagens måltider fra madscanneren/manuel indtastning, med kcal og makroer, og mulighed for at slette en fejllogning. Tom tilstand med genvej til at logge mad.

## Struktur i modulet

Fanerne bliver: **I dag** (den nye oversigt) · **Status** (nuværende ring/graf/stævnevægt) · **Kostplan** (uændret). Den nuværende "I dag"-fane med madscanneren flyttes ind som knap/ark fra madloggen, så man ikke skal skifte fane for at logge et måltid.

## Teknisk

- Nye komponenter i `src/components/weight/today/`: `DailyOverview.tsx` (container + datostate), `CalorieRing.tsx`, `MacroBars.tsx`, `WeightProgressBar.tsx`, `MealLogList.tsx`.
- Data: `nutrition_logs` filtreret på `date` for valgt dag; aktiv energi fra `wearable_daily_summary`; vægt fra `weight_logs`; mål fra `weight_goals` + eksisterende `estimateMaintenanceCalories` og `dailyCalorieDelta` i `src/lib/weightPlanner.ts`.
- Ny hjælpefunktion `macroTargets(kcal, direction)` i `weightPlanner.ts` (protein g/kg-baseret, resten fordelt på fedt/kulhydrat).
- Sletning af måltid: delete på `nutrition_logs` (egen række, dækket af eksisterende RLS) — ingen databaseændringer nødvendige.
- `WeightModule.tsx` opdateres med de nye faner; coach-visningen (`compact`) er uændret.
- Nye tekstnøgler oversættes til alle 7 sprog.
- `Help.tsx` + changelog opdateres (v1.5.15).
