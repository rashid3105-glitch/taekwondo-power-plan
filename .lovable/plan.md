## Svar på dine spørgsmål

**Det grafiske overblik (kalorie-ring, makro-bars, "Dagens måltider")** kom **ikke** med. Det billede er fra en mockup/marketing-side — der findes pt. kun selve foto-scanneren (`FoodScanner`), som logger måltider til `nutrition_logs`, men der er **ingen UI** der viser dagens samlede kalorier/protein/kulhydrater/fedt eller en liste over dagens måltider. Det skal bygges.

**Generate-knappen** fejler stille hvis `profile` er `null` (linje 129: `if (!profile) return;`). I `Library.tsx` hentes profilen kun når brugeren er logget ind, og hvis kaldet returnerer en tom profil eller endnu ikke er færdig, sker der ingenting når man trykker — ingen toast, ingen feedback.

**Sletteknap** findes ikke i dag — der er `generatePlan` (som overskriver eksisterende plan via `savePlan(..., savedPlanId)`), men ingen måde at fjerne planen og starte forfra.

---

## Hvad jeg vil bygge

### 1) Sletteknap i `NutritionPlan.tsx`
- Tilføj en `Trash2`-knap øverst i den genererede plan (ved siden af PDF-knappen).
- Klik → bekræftelses-dialog → sætter `is_active = false` på `nutrition_plans`-rækken (samme mønster som vi bruger andre steder), rydder `plan`, `savedPlanId`, `selectedGoals` lokalt, og viser toast "Plan slettet".
- Skjules hvis `readOnly`.

### 2) Fix generate-knap
- Vis tydelig fejl-toast hvis `profile` mangler i stedet for silent return ("Udfyld din profil først — alder og vægt skal være sat").
- Vis loading-state mens profilen hentes i `Library.tsx` (lille spinner i Kostplanlægger-view), så knappen ikke kan trykkes uden data.
- Tilføj ekstra logging i edge-function-kald for at fange evt. AI-gateway-fejl.

### 3) Dagligt makro-overblik (nyt komponent)
Tilføj `<DailyNutritionDashboard />` der vises **øverst** i både Kostplanlægger- og Madregistrering-undermenuen. Indeholder:

- **Kalorie-ring** (SVG, simpel donut): `forbrugt / mål` — mål taget fra `profile.custom_calories` eller den aktive plans `dailyCalorieEstimate`.
- **3 makro-bars**: Protein / Kulhydrater / Fedt med `forbrugt / mål g`. Mål udledes fra planens `macroSplit` (procent → gram).
- **"Dagens måltider"-liste**: rækker fra `nutrition_logs` for `date = today`, med navn, kalorier, protein. Tap på række → mulighed for at slette (long-press eller swipe). Bruger eksisterende ikon-mønster (Apple/Sun/Leaf efter måltid).
- Realtime: re-fetch ved mount + når `FoodScanner.onLogged` fyrer.

Dette giver det visuelle dashboard fra dit screenshot, baseret på data der allerede ligger i databasen.

### 4) Oversættelser
Tilføj nøgler på alle 7 sprog: `deletePlan`, `deletePlanConfirm`, `planDeleted`, `profileRequired`, `todayMeals`, `dailyTarget`, `consumed`, `remaining`.

## Filer der ændres

- `src/components/NutritionPlan.tsx` — sletteknap, fix generate-flow
- `src/components/DailyNutritionDashboard.tsx` — **ny** (ring + makro-bars + dagens måltider)
- `src/components/FoodScanner.tsx` — kald `onLogged` callback (findes allerede) så dashboard refresher
- `src/pages/Library.tsx` — render `<DailyNutritionDashboard />` øverst i `planner`- og `logger`-views; loading-spinner mens profil hentes
- `src/i18n/translations.ts` — 8 nye nøgler × 7 sprog

Ingen database-ændringer — alt bruger eksisterende `nutrition_plans` og `nutrition_logs` tabeller.