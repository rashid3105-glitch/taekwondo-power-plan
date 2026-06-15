## Mål
Genindføre alle fire footer-links på forsiden med fungerende destinationer.

## Ændringer

### 1. Footer-links i `src/pages/Index.tsx`
Opdatér footer-array til fire links:
- **Privatlivspolitik** → `/privacy` (findes)
- **Vilkår** → `/terms` (ny side, se punkt 2)
- **Kontakt** → `/priser` (samme som Priser, da kontaktformularen ligger nederst på Priser-siden)
- **Blog** → `/blog` (ny "Kommer snart"-side, se punkt 3)

### 2. Ny side: `src/pages/Terms.tsx` (route `/terms`)
Brugsvilkår-side i samme mørke stil som forsiden, med kort placeholder-tekst:
- Header med Sportstalent-logo (klik → `/`)
- H1: "Vilkår og betingelser"
- Status-banner: "UDKAST — opdateres løbende"
- Korte sektioner: Aftalens omfang, Brug af platformen, Abonnement & betaling, Ansvarsfraskrivelse, Ændringer, Kontakt (henviser til /priser)
- Sidst opdateret + version

### 3. Ny side: `src/pages/Blog.tsx` (route `/blog`)
"Kommer snart"-side i samme mørke stil:
- Header med logo
- Stor "Kommer snart!" overskrift
- Underrubrik: "Vi arbejder på artikler om talentudvikling, coaching og sportsvidenskab."
- CTA-knap "Tilbage til forsiden" → `/`

### 4. Routes i `src/App.tsx`
Tilføj:
```tsx
import Terms from "./pages/Terms";
import Blog from "./pages/Blog";

<Route path="/terms" element={<Page><Terms /></Page>} />
<Route path="/blog" element={<Page><Blog /></Page>} />
```

## Filer ændret/oprettet
- Ændret: `src/pages/Index.tsx` (footer-array)
- Ændret: `src/App.tsx` (2 nye routes)
- Oprettet: `src/pages/Terms.tsx`
- Oprettet: `src/pages/Blog.tsx`

Ingen ændringer i RLS, database eller edge-funktioner.