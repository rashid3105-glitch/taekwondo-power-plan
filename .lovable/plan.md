

## Plan: Gem ernæringsplaner + tilføj kalorie-input

### Problem
1. Ernæringsplaner gemmes kun i React state og forsvinder ved sideskift/genindlæsning.
2. Brugeren vil gerne kunne indtaste sit eget daglige kalorieforbrug.

### Løsning

#### 1. Ny database-tabel: `nutrition_plans`
```sql
CREATE TABLE public.nutrition_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Nutrition Plan',
  plan_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  goals text[] NOT NULL DEFAULT '{}'::text[],
  custom_calories integer NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own
CREATE POLICY "Users can view own nutrition plans" ON public.nutrition_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nutrition plans" ON public.nutrition_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nutrition plans" ON public.nutrition_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own nutrition plans" ON public.nutrition_plans FOR DELETE USING (auth.uid() = user_id);

-- Coaches can view athlete nutrition plans
CREATE POLICY "Coaches can view athlete nutrition plans" ON public.nutrition_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM coach_athletes WHERE coach_id = auth.uid() AND athlete_id = nutrition_plans.user_id));
```

#### 2. `src/components/NutritionPlan.tsx` — Hovedændringer

- **Ved mount**: Hent den seneste aktive `nutrition_plans`-række for brugeren. Hvis den findes, vis planen med det samme (ingen genering nødvendig).
- **Efter generering**: Gem planen i databasen (upsert på `user_id` + `is_active`), så den persisterer.
- **Kalorie-input**: Tilføj et nummerfelt under makro-oversigten, hvor brugeren kan indtaste sit faktiske daglige kalorieforbrug (`custom_calories`). Værdien gemmes i tabellen og vises ved siden af den anbefalede værdi.
- **Mål huskes**: `selectedGoals` indlæses fra den gemte plan, så brugeren ikke skal vælge dem igen.

#### 3. Oversættelser i `src/i18n/translations.ts`
Tilføj keys: `customCalories`, `yourCalorieIntake`, `savedNutritionPlan`, `kcalPerDay` på alle 4 sprog.

### Teknisk detalje
- Planen gemmes som JSONB i `plan_data` — samme format som den genererede JSON.
- `custom_calories` er en separat kolonne for nem forespørgsel.
- Eksisterende planer uden `custom_calories` viser feltet tomt (nullable).

