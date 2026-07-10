## Problem
Hero-billedet på forsiden vises som en ødelagt-billede-firkant i TestFlight (iOS).

**Årsag:** `src/pages/Index.tsx` importerer hero-billedet via en Lovable Assets CDN-pointer:

```ts
import heroDeadliftAsset from "@/assets/hero-deadlift.jpg.asset.json";
// url: "/__l5e/assets-v1/.../hero-deadlift.jpg"
```

Denne URL er relativ og serveres kun af Lovables web-hosting. Når appen kører nativt via Capacitor, indlæses web-laget fra selve app-bundlen (`capacitor://localhost`), så `/__l5e/...` findes ikke → ødelagt billede.

De andre billeder på siden (`coach-sitting.png`, `coach-standing.jpg`) virker, fordi de er rigtige filer i `src/assets/` og bundtes ind i `dist/` af Vite.

## Fix
Behandl hero-billedet som de andre — bundt det ind i appen i stedet for at hente det fra CDN.

1. Download billedet fra CDN'et til `src/assets/hero-deadlift.jpg` (rigtig binær fil).
2. Slet CDN-pointeren `src/assets/hero-deadlift.jpg.asset.json`.
3. I `src/pages/Index.tsx` skift importen:
   ```ts
   import heroDeadliftAsset from "@/assets/hero-deadlift.jpg";
   ```
   og opdatér brugsstedet fra `heroDeadliftAsset.url` til bare `heroDeadliftAsset` (Vite giver en URL-streng direkte).

## Efter fixet
For at få billedet ind i selve iOS-appen skal du (som beskrevet i `ios-healthkit-info.md`):

```bash
git pull
npm install         # kun hvis package.json ændrede sig
npm run build
npx cap sync ios
# åbn Xcode og kør på device
```

Web-versionen (sportstalent.dk) påvirkes ikke negativt — billedet vises stadig, det ligger bare nu i app-bundlen i stedet for på CDN'et.
