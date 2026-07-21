## Mål
Finde hvorfor `syncHealthConnect()` melder succes uden at indsætte noget. Ikke løse noget endnu — kun gøre de tavse fejl synlige, så næste build fortæller os den præcise årsag.

## Hvad koden gør i dag (bekræftet ved gennemlæsning)

`src/lib/healthConnect.ts` og `SportstalentHealthConnect.kt` har fire steder der **tavst returnerer 0**, uden at logge årsagen tydeligt i UI:

1. **`safeQty` / `safeCat` / `safeWorkouts`** (healthConnect.ts:259–296)
   `catch { return [] }`. Enhver Kotlin-side reject (manglende permission, HC-klientfejl, tom SDK) bliver til et tomt array — sync fortsætter som om intet skete.

2. **`samples.length === 0` early-return** (healthConnect.ts:410–413)
   Skriver `ok:true, inserted:0, workouts:0` uden at fortælle *hvilke* metrikker der var tomme.

3. **`requestAuthorization` → `permissionController.getGrantedPermissions()`** (SportstalentHealthConnect.kt:148–166)
   Hvis brugeren kun godkender et *subset* af de 7 permissions, kalder JS-siden bagefter `queryX` for typer den ikke må læse → Kotlin reject → tavst 0. Vi logger aldrig *hvilke* permissions der faktisk blev givet.

4. **`permissionLauncher` kan være `null`** (SportstalentHealthConnect.kt:47–71)
   `registerForActivityResult` i `load()` kaster hvis activity allerede er RESUMED. Så ryger permission-dialogen aldrig op, og brugeren tror den er godkendt fra forrige session.

Derudover: første sync bruger 90 dage, senere 30. Hvis Health Connect-appen på testenheden ikke har nogen data-producenter (ingen wear-app, ingen Fit-sync), er 0 samples fuldstændig forventet — men det er svært at afgøre uden per-type-tælling.

## Plan — kun instrumentering (ingen adfærdsændring)

### 1. `src/lib/healthConnect.ts`
- Log hvad `requestHealthConnectPermission` faktisk fik tilbage fra native (`granted`, `grantedPermissions[]`).
- I `syncHealthConnect` efter `Promise.all([...])`: log en per-type-tælling
  `{ sleep: N, resting_hr: N, hrv: N, heart_rate: N, active_energy: N, steps: N, workouts: N }`.
- Ændr `safeQty` / `safeCat` / `safeWorkouts` så fejlen bobles op via en delt `errors[]`-liste (ikke bare `console.warn`).
- Når `samples.length === 0`: returnér `reason: "no_samples:sleep=0,rhr=0,..."` (inkl. eventuelle native errors) i stedet for stille `ok:true`.
- Log `days`-vinduet (30 vs 90) og `startIso/endIso`.

### 2. `android/app/src/main/java/dk/sportstalent/app/SportstalentHealthConnect.kt`
- I `requestAuthorization`: log de *anmodede* permission-strenge og de *faktisk givne* (allerede logget som antal — tilføj navnene).
- I `queryQuantity` / `queryCategory` / `queryWorkouts`: log antal records returneret pr. type, før vi resolver.
- I `load()`: hvis `registerForActivityResult` kaster, log stacktrace og gem årsagen så `requestAuthorization` senere kan reject'e med den præcise besked ("Permission launcher not initialised: <cause>") i stedet for en tom streng.

### 3. UI-tråd i `src/pages/Health.tsx` (kun `console.info`, ingen visuelle ændringer)
- Log hele objektet returneret af `syncHealthConnect` (inkl. `reason` og per-type-tællinger) ved klik på **Forbind Health Connect** og efterfølgende sync.

## Hvad brugeren derefter skal sende
Efter `npm run build && npx cap sync android` og en genstart af app'en:
1. Toastens `reason`-streng.
2. Logcat filtreret på `SportstalentHealthConnect` **og** `HC sync:` — mindst linjerne fra permission-resultatet og per-type-tællingen.

Med dét kan vi entydigt sige om årsagen er (a) manglende permissions, (b) tom Health Connect-datastore på enheden, (c) native reject i én specifik query, eller (d) launcher-registration-fejl i `load()`.

## Uden for scope
Ingen ændring i wearable-ingest, DB-constraints, throttling, eller UI ud over log-linjer. Ingen retry-logik. Vi fikser først når loggen peger på ét konkret sted.
