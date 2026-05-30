## Problem

`ProfileEdit.tsx` gemmer kun `birth_date` — ikke `age`-kolonnen. Når du udfylder profilen den vej, forbliver `profiles.age = null`.

`Library.tsx` henter kun `age` (ikke `birth_date`) og sender det videre til `NutritionPlan`. `NutritionPlan.generatePlan` afviser med fejlen "Udfyld din profil (alder og vægt) først" når `profile.age == null`.

Derfor: alderen vises ikke, og knappen fejler — selvom din fødselsdato er gemt.

## Fix

1. **`src/pages/Library.tsx`** — udvid select til også at hente `birth_date`, og udled `age` fra `birth_date` hvis `age` mangler, før profile sættes i state.

2. **`src/pages/Dashboard.tsx`** — samme: sørg for at det `profile`-objekt der sendes til `<NutritionPlan>` har `age` udledt fra `birth_date` som fallback.

3. **`src/components/NutritionPlan.tsx`** — defensiv: i `generatePlan`, hvis `profile.age` mangler men `profile.birth_date` findes, udled alder lokalt i stedet for at fejle.

4. **(Anbefalet oprydning, valgfri)** — `ProfileEdit.tsx` kunne også selv gemme udledt `age` sammen med `birth_date` så DB-kolonnen holdes synkroniseret. Siger til hvis du vil have det med.

Ingen DB-ændringer. Ingen nye oversættelser.
