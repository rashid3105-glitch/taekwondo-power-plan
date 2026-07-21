## Hvor er vi nu?

Android Health Connect-integrationen er bygget færdigt i koden gennem fase 0–3:

- Fase 0: `minSdkVersion` hævet til 26 ✅
- Fase 1: Lokalt Kotlin-plugin `SportstalentHealthConnect` + manifest + gradle dependency ✅
- Fase 2: JS-laget `src/lib/healthConnect.ts` (spejler HealthKit) ✅
- Fase 3: "Forbind Health Connect"-knap i `Health.tsx` (kun Android) ✅

Backend (`wearable-ingest`) er allerede udvidet til at modtage `provider: 'health_connect'`, og `wearable_connections.status` er rettet til `'active'`.

## Hvad skal der gøres nu? — Fase 4: Byg & valider Android-appen

Det næste skridt er at kompilere den native Android-app og teste Health Connect-flowet på en rigtig Android-enhed eller emulator. Dette er en bygge-/testfase, ikke mere kode-arkitektur.

### Trin 1: Byg web-assets
```bash
npm run build
```
Sikrer at den seneste React-kode (inkl. `healthConnect.ts` og `Health.tsx`) kompileres til `dist/`.

### Trin 2: Sync Capacitor Android
```bash
npx cap sync android
```
Dette kopierer web-assets ind i `android/app/src/main/assets/public`, opdaterer native dependencies og sikrer at det lokale plugin registreres korrekt.

### Trin 3: Kompilér native Android-projekt
Åbn `android/` i Android Studio og kør en **Clean → Rebuild**, eller brug kommandoen:
```bash
cd android
./gradlew assembleDebug
```

Dette validerer at:
- Kotlin-pluginet `SportstalentHealthConnect.kt` kompilerer uden fejl
- `androidx.health.connect:connect-client` resolves korrekt
- `MainActivity.kt` registrerer pluginnet før bridge-init
- Alle Health Connect-permissioner er i manifestet

### Trin 4: Test på Android-enhed/emulator
Kør appen på en Android-enhed (eller emulator med API 26+).

Test følgende flow:
1. Log ind som atlet
2. Gå til **Sundhed** (Health)
3. Tryk **Forbind Health Connect**
4. Bekræft at Android viser Health Connect-tilladelsesdialogen
5. Tillad læseadgang til søvn, puls, skridt, aktiv energi og træning
6. Tryk det røde hjerte (resync)
7. Verificér i app-logcat / browser-konsol at `syncHealthConnect` returnerer `ok: true` med `inserted > 0`
8. Tjek at data vises i Health-siden (skridt, søvn, puls, energi, træning)

### Trin 5: Verificér backend-end-to-end
Efter en vellykket sync skal du tjekke at:
- `wearable_samples` indeholder rækker med `provider = 'health_connect'`
- `wearable_connections` har en aktiv række for `health_connect`
- `wearable_daily_summary` er genberegnet for de berørte datoer

### Forventede fejl vi skal rette undervejs
Baseret på erfaringen fra iOS vil følgende sandsynligvis dukke op:
- Plugin registreres ikke → tjek `MainActivity.kt` rækkefølge
- `UNIMPLEMENTED` / `plugin_not_registered` → tjek Capacitor-plugin-header eller `cap sync`
- `ingest_error` / edge function fejl → tjek CORS eller DB-constraints
- Data vises ikke → tjek at `recompute_wearable_summary` kører over de rigtige datoer

## Alternativ: Vil du springe bygget over?

Hvis du ikke har en Android-byggeopsætning klar lige nu, kan vi i stedet:

A) **Gennemgå og forstærke fejlhåndtering i JS-laget** (fx bedre toast-beskeder, retry-logik, tydeligere fejlkoder fra `healthConnect.ts`).
B) **Tilføje en "synkroniseret dato"-indikator** i Health UI, så brugeren kan se sidste sync.
C) **Forberede Play Butik / Health Connect-politik-dokumentation** (privacy policy, rationale-tekster).

## Anbefaling

Jeg anbefaler at vi går videre med **Fase 4: Byg & valider Android-appen**. Det er den eneste måde at vide om Health Connect-integrationen rent faktisk virker.

Hvis du er klar, skifter jeg til build-mode og kører `npm run build && npx cap sync android` først.