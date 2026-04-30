# Plan: Forenkl iPhone Health-flow og fjern falsk "ikke i native app"-besked

## Mål
Få wearable-flowet til at fungere pålideligt på iPhone — uden at brugeren bliver mødt af "du er ikke i den native app" når appen faktisk **er** den native iOS-app. Samtidig flytte fokus fra "Apple Watch" til "iPhone Health" (som er den faktiske datakilde).

## Hvad jeg ændrer

### 1. Stop med at vise "ikke i native app" som default
Den nuværende detection er for streng. Jeg gør det modsatte: hvis der er **et eneste** native-signal til stede (Capacitor bridge, webkit handler, Health-plugin, capacitor:// scheme, eller localhost+iOS UA), behandler vi det som native iOS. Kun hvis ingen signaler matcher, viser vi browser-fallback.

### 2. Adskil "ikke native" fra "Health utilgængelig"
I dag bliver alt rullet sammen til samme besked. Jeg deler det op i klare tilstande:
- **Browser** → vis "installer app"
- **Native app, men Health-bridge mangler** → vis "appen skal bygges igen i Xcode med HealthKit aktiveret"
- **Native app, Health utilgængelig** → vis "din enhed understøtter ikke HealthKit"
- **Native app, klar** → vis "Forbind iPhone Health"-knap
- **Permission afvist** → vis link til iOS Indstillinger → Sundhed
- **Ingen data efter sync** → vis tjekliste over kilder (Watch, iPhone, manuelle indtastninger)

### 3. Omskriv tekster til "iPhone Health"-fokus
- Fjern fokus på Apple Watch som separat kilde.
- Forklar at Apple Watch, AirPods, tredjeparts apps og manuelle indtastninger alle skriver ind i iPhone Health-databasen — det er denne app læser fra.
- Knappen "Connect Apple Health" → "Forbind iPhone Health".

### 4. Forbedret diagnostik-panel
Gør det kompakt og forståeligt:
- Grøn/gul/rød status pr. lag (Native app · Health bridge · Permissions · Data).
- Konkret næste-skridt under hvert lag der fejler.
- Skjul rå tekniske detaljer bag en "Vis tekniske oplysninger"-knap (kun synlig hvis noget fejler).

### 5. Fjern build-marker visningen fra hovedsiden
Build-markeren (`2026-04-30-detect-v3`) flyttes ind under "tekniske detaljer", så almindelige brugere ikke ser den.

## Filer der ændres
- `src/lib/wearables/index.ts` — løsnet detection-logik, nye tilstandskategorier
- `src/lib/wearables/promptDetection.ts` — bedre kategorisering af "never_shown"
- `src/pages/WearablesSettings.tsx` — opdateret UI/copy, samlet status-panel
- `src/components/wearables/WearableConnectWizard.tsx` — opdateret tekst og recovery-flow
- `src/i18n/translations.ts` — nye/justerede strenge på DA/EN/SV/DE/AR

## Tekniske noter
- Ingen ændringer i database eller edge functions.
- Ingen ændringer i `capacitor-health`-pluginet eller iOS-projektet.
- Hvis du STADIG ser "native app mangler bridge" efter denne opdatering, er årsagen i Xcode-projektet (manglende HealthKit capability eller stale build) — ikke i web-appen.

## Validering
Efter implementering skal følgende være sandt:
- På iPhone-app: ingen "du er ikke i native app"-besked vises medmindre appen reelt kører i Safari.
- Status-panelet viser tydeligt hvilket lag der evt. fejler.
- Forbind-knappen taler om iPhone Health, ikke om Apple Watch som adskilt enhed.