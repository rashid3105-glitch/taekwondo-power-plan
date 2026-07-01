## Manuel madindtastning i kostplanlægger

Tilføjer mulighed for at logge måltider ved at skrive teksten (fx "150 g kylling og 200 g ris") i stedet for at tage et billede. Systemet estimerer kcal og makroer automatisk, og brugeren kan rette tallene før logning. 

Al mad skal gemmes så man ved har konsumeret i løbet af dagen

### Brugerflow (i FoodScanner-kortet)

1. Ny tredje knap "Skriv manuelt" ved siden af "Tag foto" og "Upload billede".
2. Klik åbner en formular med:
  - Måltidsnavn (fx "Frokost")
  - Beskrivelse af mad (fri tekst, flere linjer)
  - Knap "Beregn kalorier"
3. Efter beregning vises et redigerbart estimat: kcal, protein, kulhydrat, fedt — plus items[] hvis systemet har opdelt måltidet.
4. Brugeren kan rette tallene direkte i felterne før "Log måltid".
5. Ved log gemmes rækken i `nutrition_logs` præcis som scannede måltider (samme skema, samme dashboard-visning), så alt tælles automatisk med i dagens ringe/bars.

### Teknisk

**Ny edge function** `estimate-food-macros`

- Input: `{ description: string, meal_name?: string }`
- Kalder Lovable AI Gateway (Gemini) med samme prompt-stil som `scan-food`, men tekst i stedet for billede.
- Zod-validering (description 1–500 tegn), CORS headers, JWT-check i kode.
- Output: `{ items: [{name, portion_g, calories, protein, carbs, fat}], total: {calories, protein, carbs, fat} }`.
- Ingen "AI"-ord i UI (jf. projekt-regel) — knapper og labels bruger "Beregn" / "Estimeret".

**FoodScanner.tsx**

- Ny `mode: "scan" | "manual"` state.
- Ny ManualEntry-sektion med tekstområde, beregn-knap, og redigerbare tal-inputs (kcal / P / C / F med `inputMode="decimal"`).
- Genbruger eksisterende insert til `nutrition_logs` (samme kolonner: `meal_name, calories, protein_g, carbs_g, fat_g, date, logged_at`) — ingen skema-ændring.
- `onLogged?.()` kaldes så DailyNutritionDashboard refresher.

**Oversættelser** — nye keys i alle 7 sprog (en, da, sv, de, ar, no, es):
`manualEntry`, `describeMeal`, `describeMealPlaceholder`, `calculateCalories`, `estimatedValues`, `editBeforeLogging`.

**Ingen ændringer** til: database-skema, RLS, DailyNutritionDashboard, Kostplan.tsx eller andre komponenter.

### Filer der ændres

- `supabase/functions/estimate-food-macros/index.ts` (ny)
- `src/components/FoodScanner.tsx`
- `src/i18n/translations.ts`