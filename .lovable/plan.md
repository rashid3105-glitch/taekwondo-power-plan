## Plan: Deadlift-billede i hero (over HUD)

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
   - Ingen ændringer til andre sektioner, sprogfiler, nav eller changelog.

### Filer der ændres
- `src/pages/Index.tsx` (import + højre-kolonne markup)
- `src/assets/hero-deadlift.jpg.asset.json` (ny — CDN-pointer)

Ingen ændringer i i18n, backend eller andre komponenter.