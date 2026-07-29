## 1. Beskæring og centrering i Admin → Forsidebilleder

I `/admin/hero` tilføjes et beskæringstrin, når man uploader (og et "Beskær"-ikon på eksisterende billeder):

- Dialog med billedet i en ramme, hvor man kan **zoome** (slider) og **flytte/centrere** motivet (træk med mus/finger).
- **Aspect ratio-vælger** med de formater forsiden faktisk bruger: 1:1 (hero-feltet i dag), samt 4:3 og 16:9 som valgmuligheder til fremtidige placeringer. 1:1 er standard.
- Knappen "Centrér" nulstiller position/zoom.
- Ved Gem beskæres billedet i browseren og eksporteres som **WebP i 800 px** på den lange kant (i stedet for de nuværende 1200 px), kvalitet ~0,8. Gamle filer i storage slettes ved re-beskæring, så der ikke ophobes ubrugte filer.

Ingen serverændringer nødvendige — beskæring sker i canvas før upload til det eksisterende `landing-hero` bucket.

## 2. Scroll-overgang som på bfrst.pro

Effekten der: indhold glider blødt op og toner ind, når sektionen kommer i viewport — én gang, aldrig igen, aldrig "hoppende".

- Ny lille hook + wrapper-komponent (`Reveal`) baseret på IntersectionObserver.
- Anvendes på sektionerne på forsiden (`Index.tsx`) og de øvrige landingssider (platform, funktioner, priser, om os) — overskrift, brødtekst og kort får en let forskudt (stagger) indtoning.
- Bevægelse: 16–24 px op + opacity 0→1, ca. 600 ms, blød easing.
- Respekterer `prefers-reduced-motion` (så vises alt bare med det samme).

## 3. Mere "guld"-agtig gul

Den nuværende `#F5C842` er en lys, gullig tone. Den erstattes af en varmere guldtone:

- Primær guld: **`#D4AF37`** (klassisk guld)
- Lysere variant til hover/highlights: `#E8C86A`
- Hvor guld bruges som flade med mørk tekst (knapper, aktive chips) bruges den lysere variant, så kontrasten holder.

Farven ligger i dag hårdkodet som `const GOLD = "#F5C842"` i 17 filer. Jeg samler den ét sted (`src/lib/brand.ts` + CSS-variabler) og opdaterer alle steder, inkl. de rgba-skygger der er afledt af farven.

### Teknisk
- `src/pages/AdminHeroImages.tsx`: nyt crop-flow, eksport 800 px WebP.
- Ny `src/components/admin/ImageCropDialog.tsx`.
- Ny `src/components/Reveal.tsx` + keyframes/utility i `src/index.css`.
- Ny `src/lib/brand.ts` med guld-tokens; alle 17 filer med `#F5C842` opdateres.
- Web-only: ingen ændringer i database, edge functions eller native builds.
