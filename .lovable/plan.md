## Mål

Ernæring skal være et kort i **Biblioteket** (det erstatter ikke "Opskrifter"-kortet — det *er* det nuværende "Ernæring"-kort, men det skal nu åbne en undermenu med 3 valg i stedet for at gå direkte til opskrifter):

1. **Kostplanlægger** — den AI-genererede kostplan (`NutritionPlan`)
2. **Madregistrering** — AI-madscanner + log (`FoodScanner`)
3. **Opskrifter** — den nuværende opskriftsbibliotek (`NutritionLibrary`)

## Ændringer

### 1) `src/pages/Library.tsx`
Erstat `{section === "nutrition" && <NutritionLibrary />}` med en lille intern view-state der viser:
- **home**: 3 kort (Kostplanlægger, Madregistrering, Opskrifter) — samme kort-stil som `LibraryChooser`
- **planner**: `<NutritionPlan profile={profile} />` med tilbage-knap
- **scanner**: `<FoodScanner />` med tilbage-knap
- **recipes**: `<NutritionLibrary />` med tilbage-knap

Profil hentes via `supabase.auth.getUser()` + `profiles` opslag (samme mønster som andre steder), eller vi importerer en eksisterende hook hvis tilgængelig.

Ikoner: `ChefHat` (Kostplanlægger), `Camera` (Madregistrering), `BookOpen` (Opskrifter).

### 2) `src/pages/Dashboard.tsx`
- Fjern den `Ernæring`-nav-entry vi tilføjede til side-menuen (den hører nu under Bibliotek).
- Behold `activeTab === "nutrition"`-branchen som den er (bruges stadig fra `HubOtherModules`-chippen "Kost") — eller alternativt få chippen til at navigere til `/library/nutrition` så vi har ét sted for ernæring. **Anbefaling:** lad "Kost"-chippen i hub navigere til `/library/nutrition` og fjern hele `nutrition`-tab-branchen for at undgå to indgange. Det giver én klar sti: **Hub → Kost-chip → Bibliotek-ernæring → 3 kort**, og **Side-menu → Bibliotek → Ernæring → 3 kort**.

### 3) `src/components/hub/HubOtherModules.tsx`
Ændre `nutrition`-chippen så den i stedet for `onTab("nutrition")` kalder `navigate("/library/nutrition")`.

### 4) Oversættelser (`src/i18n/translations.ts`)
Tilføj 3 nye nøgler på alle 7 sprog:
- `libNutritionPlannerLabel` / `…Desc` — "Kostplanlægger" / "Din personlige AI-kostplan"
- `libNutritionLoggerLabel` / `…Desc` — "Madregistrering" / "Scan og log dine måltider med AI"
- `libNutritionRecipesLabel` / `…Desc` — "Opskrifter" / "Sund mad tilpasset taekwondo-atleter"

## Resultat

- Bibliotek-siden viser "Ernæring"-kortet (uændret label/farve).
- Tap på kortet → 3 undervalg.
- Tap på Madregistrering → FoodScanner åbner direkte, kamera er ét tap væk.
- "Kost"-chippen i hub leder samme sted hen, så der kun er ét nutrition-flow at vedligeholde.
