## Situation

- DB: 0 `wearable_samples`, 0 `wearable_connections` for `apple_health`, 0 logs på `wearable-ingest`, 0 `workout_logs` med `wearable_source='apple_health'`.
- Bruger: fysisk iPhone via Xcode/TestFlight, HealthKit-capability tilføjet, men **intet permission-ark** vises når "Connect Apple Health" trykkes.
- Konklusion: JS-koden når frem til `requestHealthKitPermission`, men det native plugin svarer ikke → sheet vises aldrig.

## Mest sandsynlige årsag

`@perfood/capacitor-healthkit@1.3.2` er tilføjet til `package.json`, men det tilhørende CocoaPods-modul er ikke installeret i `ios/App`. Uden `npx cap sync ios` + `pod install` findes Swift-klassen ikke i binary. Capacitor's JS-bridge returnerer så tomt/undefined og `getPlugin()` fanger fejlen stille i `console.warn`.

## Trin 1 — Bekræfte hypotesen (ingen kodeændringer nødvendige for brugeren først)

Bede brugeren i terminalen i sin lokale checkout af repo'et:

```bash
git pull
bun install                # eller npm install
npx cap sync ios
cd ios/App && pod install  # kun hvis cap sync ikke gjorde det
```

Derefter i Xcode: **Product → Clean Build Folder**, genbyg og kør på device igen.

Hvis permission-arket nu dukker op → sagen løst.

## Trin 2 — Hvis sheet stadig ikke vises, tilføj synlig diagnostik

Jeg tilføjer midlertidig debug i `src/lib/healthkit.ts` så vi kan se præcis hvor det stopper. I dag sluger `getPlugin()` fejlen med `console.warn`; jeg ændrer det så `requestHealthKitPermission` returnerer en struktureret grund (`"no_plugin" | "no_native_bridge" | "auth_threw"`) og `Health.tsx` toaster grunden i stedet for kun "denied". Så kan brugeren aflæse på skærmen om plugin'et findes eller ej.

Filer:
- `src/lib/healthkit.ts` — udvid returtype for `requestHealthKitPermission` fra `boolean` til `{ ok: boolean; reason?: string }`.
- `src/pages/Health.tsx` — vis `reason` i toast.

## Trin 3 — Hvis diagnostik viser `no_native_bridge`

Så er det bekræftet at plugin'et ikke er i binary. Reelle fixes vi da kan lave herfra:

1. Tilføj `@perfood/capacitor-healthkit` til Podfile eksplicit hvis auto-linking svigter.
2. Alternativt skifte til `capacitor-health` (Cordova-baseret HealthKit-plugin med bedre Capacitor-support) hvis perfood-plugin'et viser sig ustabilt.

## Trin 4 — Hvis diagnostik viser `auth_threw`

Så bliver plugin'et kaldt men iOS afviser. Typisk fordi READ_TYPES-strengene ikke matcher hvad plugin'et forventer. Jeg verificerer så mod plugin'ets faktiske API (læse `node_modules/@perfood/capacitor-healthkit/dist/esm/definitions.d.ts`) og retter strengene.

## Hvad denne plan IKKE gør

- Ændrer ikke edge-funktionen `wearable-ingest` — den er verificeret aldrig at være blevet kaldt, så fejlen er client-side.
- Rører ikke Shortcut-vejen eller readiness-score.
- Fjerner ikke debug-koden i samme omgang — den bliver stående til vi ser første succesfulde sync i DB, derefter rydder vi op.

## Beslutningspunkt

Skal jeg gå videre med Trin 2 (tilføje diagnostik i client-koden nu), eller vil du først prøve Trin 1 (`bun install && npx cap sync ios && pod install` + rebuild) på din maskine og rapportere om sheet dukker op?
