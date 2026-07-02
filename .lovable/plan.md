## Problem

Det nuværende native iOS opstartsbillede (`ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png`) viser en **hvid** løbende figur — ikke en rød. Derudover er figuren placeret **højt til højre for centrum** og er meget lille i forhold til billedet. iOS LaunchScreen bruger `contentMode="scaleAspectFill"`, som beskærer siderne på højformat-telefoner — figuren risikerer at havne uden for skærmen på nogle enheder.

Så på iPhone ser man i praksis en næsten sort skærm ved opstart, ikke en rød løbende figur.

## Løsning

1. **Generér et nyt 2732×2732 splash-billede** med:
   - Sort baggrund (`#0a0a0a`) matcher React-splashen i `SplashScreen.tsx`, så overgangen er sømløs.
   - **Rød** løbende figur (`#e63946` — samme røde tone som prikkerne og "TALENT"-wordmark).
   - Figuren **centreret** i billedet og stor nok (ca. 30–35 % af billedets bredde) til at overleve `scaleAspectFill`-beskæring på alle iPhone-formater (fra SE til Pro Max).

2. **Overskriv alle tre filer** i `ios/App/App/Assets.xcassets/Splash.imageset/` med det nye billede (`splash-2732x2732.png`, `splash-2732x2732-1.png`, `splash-2732x2732-2.png`) — de tre er `1x`/`2x`/`3x`-varianter og skal være identiske for at Capacitors splash-plugin viser det samme uanset device-scale.

3. **Opdater `resources/splash.png`** med samme nye billede, så en fremtidig `npx capacitor-assets generate` regenererer korrekt.

Ingen ændringer i `capacitor.config.ts`, `LaunchScreen.storyboard`, `SplashScreen.tsx` eller `nativeInit.ts` — kun billedaktivet.

## Efter deploy

For at det slår igennem på fysisk iPhone skal brugeren:
```
git pull
npm run build
npx cap sync ios
```
og bygge appen igen i Xcode (LaunchScreen-billeder cacher aggressivt — slet evt. app fra device først).

## Tekniske detaljer

- **Billedgenerering**: `imagegen--generate_image` med `premium` (skarp silhouet, ingen tekst), `width=1920 height=1920`, uploades derefter og kopieres til de fire målstier. Alternativt en enkel PIL-genereret PNG (garanteret præcis farve/placering, ingen AI-artefakter) — sidstnævnte er mere pålidelig for et rent silhuet-mærke.
- **Anbefaling**: brug PIL-varianten (deterministisk) med den eksisterende `src/assets/runner-icon.png` som kilde — beskær til silhouetten, farv den rød, placér centreret på sort 2732×2732 lærred.
- **Filstier der opdateres**:
  - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png`
  - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png`
  - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png`
  - `resources/splash.png`
