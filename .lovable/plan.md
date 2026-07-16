
## Baggrund

`@perfood/capacitor-healthkit` distribueres kun via CocoaPods. Projektet bruger Swift Package Manager (`ios/App/CapApp-SPM/Package.swift`), ikke CocoaPods, så plugin'et bliver aldrig linket ind i binary → intet permission-ark på device. Løsningen er en lille lokal Swift-plugin der bor direkte i iOS-projektet og eksponeres til JS via Capacitors bridge.

## Hvad vi bygger

En intern Capacitor-plugin `SportstalentHealthKit` skrevet i Swift, placeret i `ios/App/App/`. Den dækker præcis de 6 metrikker `wearable-ingest` allerede forventer: sleep, restingHR, HRV, heartRate, activeEnergy, workouts. JS-siden i `src/lib/healthkit.ts` ombygges til at kalde det nye plugin via `registerPlugin` — samme sample-mapping og ingest-flow som i dag.

Ingen ændringer i: `wearable-ingest` edge-funktion, `recompute_wearable_summary` DB-funktion, Shortcut-vejen, readiness-score, DB-skema, UI.

## Filer

**Nye:**
- `ios/App/App/SportstalentHealthKit.swift` — plugin-klasse: `requestAuthorization`, `queryQuantity`, `queryCategory`, `queryWorkouts`, `isAvailable`. Bruger `HKHealthStore`, `HKSampleQuery`.
- `ios/App/App/SportstalentHealthKit.m` — Objective-C bridge macro (`CAP_PLUGIN` + `CAP_PLUGIN_METHOD`) så Capacitor kan finde metoderne.

**Ændret:**
- `src/lib/healthkit.ts` — udskift dynamisk `import("@perfood/capacitor-healthkit")` med `registerPlugin<SportstalentHealthKit>("SportstalentHealthKit")` fra `@capacitor/core`. Fjern `no_native_bridge`/`import_failed`-grene, behold `not_ios` og `auth_threw`. Mapper stadig til samme `IngestSample`-shape.
- `package.json` — fjern `@perfood/capacitor-healthkit` dependency.
- `ios-healthkit-info.md` — opdater setup-noter (ingen ekstern plugin, custom Swift; kun HealthKit-capability + Info.plist-nøgle skal sættes i Xcode).
- `.lovable/plan.md` — noter beslutning.

**Uændret bevidst:**
- `supabase/functions/wearable-ingest/index.ts` — samme kontrakt.
- `ios/App/App/Info.plist` — `NSHealthShareUsageDescription` er allerede sat korrekt.
- `ios/App/App/App.entitlements` — HealthKit entitlement er allerede sat.
- `ios/App/CapApp-SPM/Package.swift` — filer i App-target'et opdages automatisk; plugin registreres via `.m`-bridge.

## Swift-plugin API (JS-kald → Swift)

```text
isAvailable() → { available: Bool }
requestAuthorization({ read: [String] }) → { granted: Bool }
queryQuantity({ sampleType, startDate, endDate }) → { samples: [{uuid, startDate, endDate, value, unit, sourceName}] }
queryCategory({ sampleType, startDate, endDate }) → { samples: [{uuid, startDate, endDate, value, sourceName}] }
queryWorkouts({ startDate, endDate }) → { workouts: [{uuid, startDate, endDate, duration, totalEnergyBurned, totalDistance, activityType, averageHeartRate, maxHeartRate, sourceName}] }
```

Sample type-strings mappes internt i Swift: `"sleepAnalysis" → HKCategoryTypeIdentifier.sleepAnalysis`, `"restingHeartRate" → HKQuantityTypeIdentifier.restingHeartRate`, osv. Ingen dynamiske identifiers fra JS — hvidliste på Swift-siden.

For workouts beregnes `averageHeartRate`/`maxHeartRate` via `HKStatisticsQuery` over `heartRate` samples i workout-intervallet (kan udskydes til V1.1 hvis for meget — så sendes bare `nil`).

## JS-side simplificering

`src/lib/healthkit.ts` bliver:
- `registerPlugin` køres én gang på modul-load — ingen dynamisk import, ingen `getPlugin()`-dance.
- `isHealthKitAvailable()` kalder `plugin.isAvailable()` for at bekræfte binary faktisk har HealthKit-klassen.
- `requestHealthKitPermission()` kalder direkte, returnerer `{ ok, reason? }`.
- `syncHealthKit()` kalder `queryCategory("sleepAnalysis", ...)` for søvn, `queryQuantity` for RHR/HRV/HR/energy, `queryWorkouts` for træning. Mapping til `IngestSample` er stort set uændret.

## Rækkefølge

1. Skriv Swift + .m bridge.
2. Omskriv `src/lib/healthkit.ts` til `registerPlugin`.
3. Fjern `@perfood/capacitor-healthkit` fra `package.json`.
4. Opdater `ios-healthkit-info.md` med de faktiske Xcode-trin (ingen `pod install`, kun `npx cap sync ios` + rebuild).

## Hvad brugeren skal gøre lokalt bagefter

```bash
git pull
bun install
npm run build
npx cap sync ios
```
Åbn Xcode → verificer at `SportstalentHealthKit.swift` og `.m` er i App-target'et (skal ske automatisk hvis de ligger i `ios/App/App/`). Clean Build Folder → Run på device. Permission-ark skal nu dukke op ved "Connect Apple Health".

## Ikke i denne omgang

- Background delivery / observer queries (V2).
- Skrive workouts *til* HealthKit.
- Ny readiness-score baseret på HealthKit-data.
- Oprydning af midlertidig `reason`-toast i `Health.tsx` — bliver stående til vi ser første succesfulde sync i `wearable_samples`.
