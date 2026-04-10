

## Plan: Flyt kalorie-indtastning til profilen

### Ændringer

#### 1. Database: Tilføj `custom_calories` kolonne til `profiles`
```sql
ALTER TABLE public.profiles ADD COLUMN custom_calories integer NULL;
```

#### 2. Edge function: `update-my-profile/index.ts`
Tilføj `custom_calories: z.number().int().min(500).max(10000).nullable()` til Zod-skemaet, så feltet kan gemmes via profil-opsætningen.

#### 3. Profil-side: `src/pages/ProfileSetup.tsx`
Tilføj et valgfrit nummerfelt for dagligt kalorieforbrug (f.eks. "2500") under vægt-feltet. Feltet er ikke obligatorisk. Værdien sendes med i `payload` til `update-my-profile`.

#### 4. Edge function: `generate-nutrition-plan/index.ts`
Tilføj `custom_calories` fra `profile`-objektet til AI-prompten, så den bruger brugerens angivne kalorier som udgangspunkt i stedet for at estimere frit:
```
- Daily calorie target: ${profile.custom_calories ? profile.custom_calories + " kcal (user-specified)" : "estimate based on profile"}
```

#### 5. Klient: `NutritionPlan.tsx`
Send `custom_calories` fra profilen med i `body` til edge functionen. Fjern det separate kalorie-inputfelt fra ernæringsplan-komponenten (det flyttes til profilen). Behold visningen af `custom_calories` fra den gemte plan for bagudkompatibilitet.

#### 6. Oversættelser: `src/i18n/translations.ts`
Tilføj keys: `dailyCalorieTarget`, `dailyCalorieHint` på alle 4 sprog.

### Resultat
- Kalorieforbrug indtastes én gang i profilen
- Ernæringsplanen bruger automatisk den angivne værdi
- Feltet er valgfrit — uden det estimerer AI'en selv

