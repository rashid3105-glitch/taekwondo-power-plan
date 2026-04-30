## Problem

På din iPhone (kørt fra Xcode) viser wizard og diagnostik stadig "Du er ikke i den native app", selvom du faktisk kører den installerede app. Det betyder at `Capacitor.isNativePlatform()` returnerer `false` i WebView'et — typisk fordi:

1. `dist/` der blev bundlet ind i iOS-projektet er en ældre build hvor `@capacitor/core` ikke fik injiceret bridgen korrekt (eller `npx cap sync ios` ikke er kørt efter sidste `npm run build`).
2. Den lokale `capacitor.config.ts` har en `server.url` som peger på Lovable-preview — så WebView'et loader webversionen i stedet for `dist/`-bundle'et, og Capacitor-runtime'en bliver ikke injiceret.
3. Vi tjekker kun `isNativePlatform()` / `getPlatform()`, ikke `isPluginAvailable("Health")` eller `window.webkit.messageHandlers`, som er stærkere signaler på iOS.

Vi har ingen synlig diagnose i UI, der fortæller *hvorfor* detektionen siger "ikke native", så det er umuligt at adskille de tre årsager fra hinanden.

## Løsning

Gør detektion + diagnostik selvforklarende, så enhver iOS-build enten registreres som native eller fortæller præcis hvad der mangler.

### 1. Hærd `detectPlatform()` i `src/lib/wearables/index.ts`

Tilføj flere uafhængige signaler og betragt det som native hvis ét af dem matcher:

- `Capacitor.isNativePlatform()` (officiel)
- `Capacitor.getPlatform() === 'ios' | 'android'`
- `(window as any).Capacitor?.isNativePlatform?.()`
- `(window as any).webkit?.messageHandlers?.bridge` (iOS WKWebView bridge marker)
- `navigator.userAgent` indeholder `"CapacitorWebView"` eller URL'en starter med `capacitor://` / `ionic://` (iOS) eller `https://localhost` med Capacitor user-agent (Android).

Hvis nogen af disse er sande → returnér `"ios"`/`"android"`. Det fjerner false-negatives når én bridge-detektion fejler.

### 2. Udvid `WearableDiagnostics` med ægte fejlårsager

Føj nye felter (alt synligt i UI):

- `capacitorPlatform: string` (rå værdi fra `getPlatform()`)
- `capacitorIsNative: boolean`
- `hasWebkitBridge: boolean` (iOS specifikt)
- `userAgent: string` (kort)
- `serverUrl: string | null` (læs `(window as any).Capacitor?.serverUrl` hvis sat — afslører hot-reload-konfig)
- `healthPluginAvailable: boolean` via `Capacitor.isPluginAvailable("Health")`

### 3. Opdater "Device readiness"-stripe i `WearablesSettings.tsx`

Erstat den enkelte "Not in native app"-linje med en lille tabel der viser hver af de fem råværdier ovenfor. Når mindst ét signal er native, marker raden "Running in native app" som grøn, men vis stadig de detaljerede signaler (foldet ind under en "Vis detaljer"-knap, så det ikke spammer almindelige brugere).

Tilføj en målrettet hjælpetekst når `serverUrl` er sat:

> "Hot-reload er aktiveret i `capacitor.config.ts` (`server.url`). HealthKit virker ikke i denne tilstand — fjern `server.url`, kør `npm run build && npx cap sync ios` og åbn appen igen fra Xcode."

Og når `capacitorIsNative === false` men `hasWebkitBridge === true`:

> "Capacitor-bridgen blev fundet, men `dist/` matcher ikke det installerede bundle. Kør `npm run build && npx cap sync ios` og rebuild i Xcode."

### 4. Opdater wizardens trin 1 med samme logik

`WearableConnectWizard.tsx` step 1 skal:

- Bruge den nye, mere tolerante `inNativeApp`-værdi.
- Vise samme detaljer-knap som settings når den fejler, så du på telefonen kan se den præcise grund.

### 5. Konsollog ved mount

I `getDiagnostics()` log alle råsignaler én gang via `console.info("[wearables] platform signals", { ... })`, så vi i næste fejlrapport kan se data direkte fra Xcode-konsollen.

## Filer der ændres

- `src/lib/wearables/index.ts` — hærdet `detectPlatform()`, udvidet `WearableDiagnostics`, console-log.
- `src/pages/WearablesSettings.tsx` — ny diagnose-detalje-strip, målrettet fejlforklaring.
- `src/components/wearables/WearableConnectWizard.tsx` — trin 1 bruger ny detektion + viser detaljer ved fejl.
- `src/i18n/translations.ts` — nye nøgler (DA + EN minimum, evt. SV/DE/AR).

## Tekniske noter

- Vi rører ikke ved `capacitor-health`-pluginnet eller permission-flowet — kun detektion + UI.
- Ingen build-script-ændringer; brugeren skal stadig køre `npm run build && npx cap sync ios` efter pull (det fortæller den nye fejlbesked nu eksplicit).
- Når planen er implementeret: pull, `npm run build && npx cap sync ios`, rebuild i Xcode, åbn wizarden — strippen fortæller præcis hvilket signal der mangler.
