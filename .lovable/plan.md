# Læsbarheds-fix for rehab-tabben

## Hvad er problemet
På skærmen "Skade-genoptræningsplan / Forstå et lægedokument" (Dashboard → Rehab) er:
- kort-titlerne næsten usynlige (hvid tekst på lyst kort)
- disclaimer-teksten i amber-boksen næsten usynlig (lys tekst på lys gul)
- placeholder/input-teksten dårligt læsbar
- "Generer genoptræningsplan"-knappen har hvid tekst på en lys amber-baggrund

Årsag: Dashboard-roden tvinger sidebaggrunden til sort via inline `style={{ backgroundColor: "#0a0a0a" }}`, men temaets tokens (lyst athlete-tema vs. mørkt coach-tema) styrer korten uafhængigt. Inde i kortene bruges `text-foreground` — den værdi følger body-temaet og ender ikke nødvendigvis i kontrast med det aktuelle `bg-card`. Det skal være `text-card-foreground`, som er garanteret modparten til `bg-card` i begge temaer. Amber-disclaimeren bruger `text-foreground/90` som også fejler i lyst tema.

Tidligere kerne-fix (`.text-heading`/`.text-subheading` → `hsl(var(--foreground))`) slår ikke igennem her, fordi disse skærme bruger `text-foreground` direkte og en disclaimer-boks med egen baggrund.

## Hvad ændres (kun frontend/styling, ingen logik)

### 1) `src/pages/Dashboard.tsx` — rehab-tabben
- Erstat `text-foreground` med `text-card-foreground` på alle tekst-elementer inde i de to rehab-kort (titel, "Tidligere planer"-liste).
- Tilføj `text-card-foreground` på selve kort-wrapperne (`rounded-xl … bg-card …`) så al arvet tekst får korrekt farve.

### 2) `src/components/MedicalDocumentTranslator.tsx`
- Kort-wrapper: tilføj `text-card-foreground`.
- H3-titlen: skift `text-foreground` → `text-card-foreground`.
- Disclaimer-boksen (amber): skift `text-foreground/90` → `text-amber-900 dark:text-amber-100` så den er læsbar på den lyse amber-baggrund i begge temaer. Samme for den anden forekomst i resultat-sektionen.
- Result-blokken: titel-h4'er beholder `text-muted-foreground`; brødtekst/listeitems skiftes til `text-card-foreground`.
- Filupload-label, valgt filnavn og keyFinding-term: skift `text-foreground` → `text-card-foreground`.

### 3) `src/components/RehabPlanCard.tsx`
- Kort-wrappere (header-kort, faser, øvelsesrækker, "important notes"-boks): tilføj `text-card-foreground` så arvet farve er korrekt.
- Hvor `text-foreground` bruges direkte (titel, fase-navn, øvelses-navn, sets/reps/rest-tal, "Coaching"-label, important-note-items): skift til `text-card-foreground`.
- Den røde `text-destructive`-tekst og blå/grønne accent-tekster bevares som de er.

### 4) Generate-knappen
- I Dashboard.tsx tilføj eksplicit `variant="default"` på "Generer genoptræningsplan"-knappen (samme i `CoachAthleteDetail.tsx` for konsistens) så den altid får `bg-primary text-primary-foreground` og ikke kan blive en lys amber-tone via arvede stilarter. Ingen logikændring.

### 5) BackToHub-knappen
- Tilføj `text-foreground` eksplicit på "Tilbage"-knappens label, så den forbliver læsbar på den sort-tvungne side-baggrund uanset om body er athlete- eller coach-mode.

## Hvad røres IKKE
- Edge functions, database, RLS.
- Logik i rehab-/medical-translator-flow.
- Globale design-tokens i `index.css` (de seneste ændringer beholdes).
- Oversættelser (alle nøgler er allerede til stede fra tidligere PR).

## Verifikation
- Åbn /dashboard → Rehab i både athlete (lyst tema) og coach-mode (mørkt tema).
- Tjek at "Skade-genoptræningsplan" og "Forstå et lægedokument" titler er tydeligt læsbare.
- Tjek disclaimer-boksen er læsbar i begge temaer.
- Tjek "Generer"-knappen viser primary-blå med hvid tekst (ikke amber).
- Tjek tidligere rehab-planer-liste samt resultat-visning fra RehabPlanCard.

## Ingen changelog-bump (rent bugfix).
