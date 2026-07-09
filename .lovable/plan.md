## Plan: Deadlift-billede i hero + mobil-justering

Placer det uploadede billede i højre kolonne af hero-sektionen i `src/pages/Index.tsx`, direkte over det eksisterende HUD-cockpit. Billedet beskæres kvadratisk med fokus på løftet.

### Trin

1. **Upload billedet som CDN-asset**
   - `lovable-assets create --file /mnt/user-uploads/Skærmbillede_2026-07-09_kl._14.54.35.png --filename hero-deadlift.jpg > src/assets/hero-deadlift.jpg.asset.json`
   - Ingen binær fil ender i repoet.

2. **Rediger `src/pages/Index.tsx`** (linje ~244–246, hvor `<HUD />` renderes i højre kolonne)
   - Importér `heroDeadliftAsset from "@/assets/hero-deadlift.jpg.asset.json"`.
   - Wrap `<HUD />` i en flex-column container med `gap: 16`.
   - Indsæt over HUD:
     ```tsx
     <div style={{
       aspectRatio: "1 / 1",
       width: "100%",
       borderRadius: 14,
       overflow: "hidden",
       border: "0.5px solid rgba(255,255,255,0.08)",
       boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
     }}>
       <img
         src={heroDeadliftAsset.url}
         alt="Atlet udfører deadlift"
         style={{
           width: "100%",
           height: "100%",
           objectFit: "cover",
           objectPosition: "center 30%",
           display: "block",
         }}
       />
     </div>
     ```
   - Kvadratisk `aspect-ratio` + `object-fit: cover` giver den ønskede firkantede beskæring med fokus på stangen/overkroppen.

3. **Responsivt**
   - På tablet/mobil (grid `1fr`) ligger billedet naturligt over HUD i samme kolonne — ingen ekstra breakpoint-kode nødvendig.

4. **Mobil-justering efter feedback**
   - Mere kompakt navbar i `src/components/landing/LandingLayout.tsx`: mindre højde, mindre logo, kompakt sprogvælger og mindre/tyndere "Log ind"-knap.
   - Mindre hero-headline og tekst på mobil, tættere linjeafstand.
   - Mindre CTA-knapper med reduceret skygge.
   - Billedet begrænses til `maxHeight: 260px` på mobil, så det ikke dominerer skærmen, og holder stadig kvadratisk beskæring.
   - Ingen ændringer til desktop eller andre sektioner.

### Filer der ændres
- `src/pages/Index.tsx` (import + højre-kolonne markup + mobil-typografi)
- `src/components/landing/LandingLayout.tsx` (mobil-navbar)
- `src/components/LanguageSwitcher.tsx` (valgfri `compact`-prop)
- `src/assets/hero-deadlift.jpg.asset.json` (ny — CDN-pointer)

Ingen ændringer i i18n, backend eller andre komponenter.