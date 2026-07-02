## Problem

I sidste ombæring genererede jeg en **generisk rød kvindelig løber-silhuet** til iOS-splash-billedet i stedet for at bruge dit faktiske SPORTSTALENT-brand-logo (den røde løber med graf/søjler + "SPORTSTALENT"-wordmark). Det er forkert — brandet skal bruges, ikke en AI-genereret figur.

## Løsning

1. **Brug det uploadede logo** (`user-uploads://Sportstalent_-_Sport_Science_Training_for_Taekwondo_Athletes-2.png`) som kilde i stedet for den genererede silhuet.

2. **Byg et nyt 2732×2732 splash-lærred** med PIL:
   - Sort baggrund (`#0a0a0a`) — matcher React-splashen.
   - Logoet (løber + graf + "SPORTSTALENT"-tekst samlet) **centreret** på lærredet.
   - Skaleret til ca. **40 % af lærredets bredde**, så både løberen og wordmark er tydelige efter iOS's `scaleAspectFill`-beskæring på alle iPhone-formater (SE → Pro Max).
   - Kanterne på det uploadede PNG er sorte og smelter sømløst sammen med baggrunden.

3. **Overskriv de samme fire filer** som sidst:
   - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png`
   - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png`
   - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png`
   - `resources/splash.png`

4. **Ingen ændringer** i `capacitor.config.ts`, `LaunchScreen.storyboard`, React `SplashScreen.tsx` eller `nativeInit.ts`.

## Efter deploy

For at det slår igennem på fysisk iPhone:
```
git pull
npm run build
npx cap sync ios
```
og genbyg i Xcode — slet evt. appen fra enheden først, da iOS cacher launch screens aggressivt.

## Tekniske detaljer

- Deterministisk PIL-composite (ingen ny AI-generering) — garanterer at det er dit faktiske brand-logo pixel-for-pixel.
- Bevar aspect ratio på det uploadede logo; padd med sort baggrund til 2732×2732 kvadrat.
- Central placering — ikke offset — for at overleve aspect-fill-beskæring i portrait på alle enheder.
