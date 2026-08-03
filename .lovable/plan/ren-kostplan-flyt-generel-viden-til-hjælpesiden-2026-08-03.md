# Ren kostplan — flyt generel viden til hjælpesiden

Kostplan-fanen viser i dag lige så meget advarselstekst og generel ernæringsviden som selve planen. Den viden er den samme for alle og hører hjemme som spørgsmål/svar i Hjælp. Kostplanen bygges i stedet direkte på de svar, atleten allerede har givet i vægt-/kostguiden.

## Sådan bliver det

**Kostplan-fanen (kun plan)**
- Ingen store advarselsbannere øverst. I stedet én diskret linje under planens titel: "Vejledende plan · Læs om sikker vægtregulering" med link til det nye afsnit i Hjælp.
- Målvælgeren (chips: Vægttab, Bedre restitution, …) fjernes. Målet udledes automatisk af det, atleten allerede har svaret: retning (vægttab/vedligehold/vægtøgning), tempo, aktivitetsniveau, alder, køn, vægt og evt. kaloriemål fra vægt-guiden. Er guiden ikke gennemført, vises et lille kort med knappen "Sæt dine mål" i stedet for chips.
- Selve planen viser: kalorier + makrofordeling, dagens måltider (udfoldelige, som nu), og ugentlig variation.
- Generelle sektioner — "Nøgleprincipper", "Hydrering", "Kosttilskud" og de lange sundhedsadvarsler — vises ikke længere i planen. De findes som faste spørgsmål/svar i Hjælp.
- Den korte automatiserede-svar-markør bevares (lovkrav), men i kortform.
- PDF-eksporten følger samme indhold: plan, måltider, variation, plus én kort ansvarsfraskrivelseslinje.

**Hjælpesiden**
Ny sektion "Kost & vægt" med spørgsmål/svar, der samler den flyttede viden:
- Hvorfor er kostplanen kun vejledende?
- Hvad er sikker vægtregulering for atleter?
- Hvor meget skal jeg drikke før, under og efter træning?
- Hvad bør jeg vide om kosttilskud?
- Hvilke principper bygger planen på?
- Hvordan udregnes mit kaloriemål?

Alle tekster gennem `t()` på alle 7 sprog.

## Teknisk

- `src/components/NutritionPlan.tsx`: fjern advarselsbannere, `NUTRITION_GOALS`-chips og `hasWeightLossGoal`-blokken; fjern rendering af `keyPrinciples`, `hydration`, `supplements` og `plan.healthWarning`. Tilføj kompakt disclaimer-linje med `Link` til `/help#nutrition`. Mål udledes af aktiv `weight_goals`-række + profil i stedet for chip-state; `goals`-feltet i `nutrition_plans` udfyldes fortsat (afledt værdi) så eksisterende rækker og coach-visning virker.
- `supabase/functions/generate-nutrition-plan/index.ts`: modtager afledte mål; prompten strammes til kun at returnere `planName`, `dailyCalorieEstimate`, `macroSplit`, `meals`, `weeklyVariation`. Felterne `keyPrinciples`, `hydration`, `supplements`, `healthWarning` bliver valgfri, så gamle gemte planer stadig kan indlæses uden fejl.
- PDF-genereringen i samme fil trimmes tilsvarende.
- `src/pages/Help.tsx`: ny sektion `nutrition` med de seks Q&A-poster; sikret at ankeret `#nutrition` kan åbnes direkte fra kostplanen.
- `src/i18n/translations.ts`: nye nøgler til Q&A og den korte disclaimer-linje på en, da, sv, de, ar, no, es.
- Changelog v1.5.18 i `src/pages/Help.tsx` på alle 7 sprog.
- Ingen ændringer i native, push, health-sync eller betaling. Ingen nye pakker.
