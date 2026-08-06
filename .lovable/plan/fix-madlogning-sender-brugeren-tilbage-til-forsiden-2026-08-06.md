# Fix: madlogning sender brugeren tilbage til forsiden

## Hvad der sker

Når brugeren trykker "Tag et billede af dit måltid" (eller "Upload billede") i appen, åbner iOS/Android kamera-UI'et oven på appen. På telefoner med lidt hukommelse dræber systemet app-webviewet imens, og appen starter forfra på forsiden ("/"). Måltidet bliver aldrig logget.

Der findes allerede en beskyttelse mod netop dette: før kameraet åbnes gemmes den side, brugeren stod på, så appen kan hoppe tilbage efter genstart. Men gendannelsen accepterer kun stier der starter med `/dashboard` eller `/nutrition` — og ernæringsmodulet ligger på `/library/nutrition`. Derfor bliver brugeren efterladt på forsiden.

Derudover gendannes selve "Log måltid"-panelet ikke, så selv når man lander rigtigt, skal man starte forfra uden nogen forklaring.

## Hvad der bygges

1. **Gendan den rigtige side efter kameraet**
   - Accepter alle interne app-stier (alt der starter med `/`, ikke eksterne links), i stedet for kun to hårdkodede præfikser. Det dækker `/library/nutrition`, `/dashboard?tab=nutrition`, coach-visninger osv.

2. **Gem siden FØR kameraet åbnes**
   - I dag skrives "kom tilbage hertil"-noten samtidig med at kameraet startes, så et hurtigt nedbrud kan nå at ske først. Noten skrives fremover før kamerakaldet.

3. **Åbn "Log måltid" igen automatisk**
   - Ud over siden gemmes et flag om at madloggen var åben. Efter gendannelse åbnes panelet igen, og brugeren får en kort besked: "Prøv igen — billedet gik tabt da kameraet lukkede."

4. **Færre nedbrud**
   - Billedkvalitet/størrelse til kameraet sænkes en smule (bredde 1024, kvalitet 60) — nok til analyse, men markant mindre hukommelsespres i webviewet.
   - Fejl fra kameraet vises som en tydelig besked i stedet for tavshed.

5. **Manuel indtastning som synlig udvej**
   - "Skriv manuelt" fremhæves i madlog-panelet, så en bruger altid kan logge uden kamera.

## Teknisk

- `src/App.tsx` (gendannelses-effekt, linje ~168-189): erstat whitelist `startsWith("/dashboard") || startsWith("/nutrition")` med validering `value.startsWith("/") && !value.startsWith("//")`; læs desuden `scanner:resume_open` og videresend via `navigate(value, { replace: true, state: { reopenMealLog: true } })`.
- `src/components/FoodScanner.tsx` (`nativePickPhoto`, linje ~153-203): flyt `Preferences.set` op før `CapCamera.getPhoto`, gem både `scanner:resume_route` og `scanner:resume_open`, ryd flaget når fotoet er modtaget, og sænk `quality`/`width`.
- `src/components/weight/today/DailyOverview.tsx`: læs `location.state?.reopenMealLog` ved mount, åbn `scannerOpen`-sheeten og vis en toast.
- Ingen database- eller edge function-ændringer. Ingen ændring af selve logningen (`nutrition_logs`-insert er intakt).
- Tekster tilføjes til alle 7 sprog.
- Changelog i `src/pages/Help.tsx` opdateres.

## Bemærkning om test

Fejlen opstår kun i den native app under hukommelsespres, så den kan ikke fremprovokeres i webpreview. Efter build skal flowet testes på en fysisk telefon: åbn Ernæring → Log måltid → Tag billede → afvent at appen genstarter → verificér at man lander på ernæringssiden med madlog-panelet åbent.
