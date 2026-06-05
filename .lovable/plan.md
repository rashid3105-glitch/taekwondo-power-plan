# Plan: Ensartet bibliotekslayout med kategori-sektioner

## Mål
Bring `ExerciseLibrary`, `MentalLibrary`, `NutritionLibrary` og `HiitLibrary` på samme visuelle og strukturelle form som `TestLibrary`:

- **Sektionsoverskrift pr. kategori**: ikon + lokaliseret titel + `Badge` med antal.
- **Foldbart kort** med stilen `rounded-xl border border-border bg-card shadow-card overflow-hidden`, klikbar header (ikon-firkant + titel + kort beskrivelse, chevron til højre), foldet detalje-sektion adskilt med top-border.
- Eksisterende filter-pills bevares **øverst** (uændret funktion), men resultatet rendres herunder grupperet i kategori-sektioner i stedet for én flad liste. Tomme kategorier skjules (`if (catItems.length === 0) return null`).

## Filer der ændres

1. **`src/components/ExerciseLibrary.tsx`**
   - Behold disclaimer, kategori-/goal-/risk-filter-pills, add-knap og add-form uændret.
   - Erstat den flade `filtered.map(...)`-liste med en `CATEGORIES.map(cat => ...)`-loop, der filtrerer på `cat` og render sektioner. Sektionsikon: brug eksisterende kategori-dot-paletten i ny `CATEGORY_ICONS` map (Dumbbell/Zap/Activity/Move/Flame fra lucide).
   - Når brugeren har valgt en enkelt kategori eller "custom", vis kun den ene sektion. "All" viser alle ikke-tomme sektioner.
   - `ExerciseCard` selv ændres ikke (er allerede foldbart kort) — det er kun container-layoutet, der bliver grupperet.

2. **`src/components/MentalLibrary.tsx`**
   - Behold filter-pills.
   - Grupper `filtered`-listen pr. `MentalCategory` med sektionsoverskrift (ikon fra `MENTAL_CATEGORY_ICONS` + label fra `MENTAL_CATEGORY_LABELS[locale][cat]` + `Badge` med antal).
   - `MentalExerciseCard` ændres ikke.

3. **`src/components/NutritionLibrary.tsx`**
   - Behold filter-pills, add-knap, add-form og custom-overlay-logik.
   - Grupper `filtered` pr. `RecipeCategory` med sektionsoverskrift (emoji fra `RECIPE_CATEGORY_ICONS` + `t(CATEGORY_KEYS[cat])` + antals-`Badge`).
   - `RecipeCard` ændres ikke.

4. **`src/components/HiitLibrary.tsx`**
   - Behold disclaimer + kategori-filter-pills.
   - Grupper workout-kortene pr. `HiitWorkout["category"]` med sektionsoverskrift (Zap/Flame/Footprints/Swords ikon + `t(hiitCat_*)` + antal).
   - Workout-kortet ændres ikke i denne omgang (det er ikke foldbart — start-knappen åbner runneren). Kun grupperingen tilføjes.

## Tekniske detaljer

- Sektions-header-mønster (kopieret 1:1 fra `TestLibrary` linje 121–125):
  ```tsx
  <div className="flex items-center gap-2 mb-3">
    <Icon className="h-5 w-5 text-primary" />
    <h2 className="text-base font-bold text-foreground">{label}</h2>
    <Badge variant="secondary" className="text-[10px]">{count}</Badge>
  </div>
  ```
  Ikon-farve følger bibliotekets tab-farve: `text-primary` (Øvelser), `text-tab-mental` (Mental), `text-tab-nutrition` (Opskrifter), `text-destructive` (HIIT).
- Hver sektion wrappes i `<div key={cat}>` med `space-y-2` for kortlisten; sektioner adskilles via `space-y-6` på ydre container (matcher TestLibrary).
- Ingen nye translation-nøgler nødvendige — alle kategorinavne findes allerede.
- Ingen ændringer i edge functions, RLS, database, eller delte UI-komponenter.

## Out of scope
- LibraryChooser-siden (`/library`) ændres ikke.
- Filter-UI'et ændres ikke.
- Selve kort-komponenterne (`ExerciseCard`, `MentalExerciseCard`, `RecipeCard`) ændres ikke.
- Changelog opdateres ikke (rent layout-finpus).
