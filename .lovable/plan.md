
# HealthKit V1 — rene observationer

Ingen ny score, ingen anbefaling, ingen farvekodning. HealthKit fylder blot `wearable_samples`, den eksisterende `recompute_wearable_summary` genberegner `wearable_daily_summary`, og den eksisterende Health.tsx/RecoveryTile viser dagsværdi + 7-dages baseline + afvigelse.

## Plugin-valg
`@perfood/capacitor-healthkit` (senest v9.x, aktiv, Cap 7/8 kompatibel gennem peer-range). Den er den mest vedligeholdte og eneste med solid workout+sleep-læsning. `capacitor-health` er nyere men understøtter primært aktivitet, ikke sleep/HRV workflows i den grad vi skal bruge. Version fastlåses ved install (rapporteres i slutrapport).

## Del A — Backend

**Migration** (én migration):
- Unique index for idempotent upsert:
  `CREATE UNIQUE INDEX IF NOT EXISTS wearable_samples_ext_uniq ON public.wearable_samples (user_id, provider, metric_type, external_id) WHERE external_id IS NOT NULL;`
- Tilføj kolonner hvis de mangler: `provider text`, `external_id text`, `source_device text` (tjek types.ts først; hvis de findes, skip).

**Ny edge function `supabase/functions/wearable-ingest/index.ts`** (`verify_jwt = true`, default JWT check):
- Auth: hent user fra `Authorization: Bearer <token>` med `supabase.auth.getUser(token)`.
- Body: zod-valideret `{ samples: Array<{ metric_type, value_numeric, unit?, start_at, end_at?, source_device?, external_id?, payload? }> }`. Max 5000 samples/batch.
- Insert med service-role client i `wearable_samples` med `provider='apple_health'`, `user_id` fra JWT, `ON CONFLICT (user_id, provider, metric_type, external_id) DO NOTHING`.
- HKWorkout: for hver `metric_type='workout'` sample, opret også en `workout_logs`-række (`wearable_source='apple_health'`, `entry_type='wearable'`, `avg_hr`, `max_hr`, `duration_minutes`, `calories`, `activity_label`, `logged_date=start_at::date`) med idempotens: skip hvis `workout_logs` allerede har `wearable_source='apple_health'` + `external_id` matchende (tilføj `external_id text` kolonne til `workout_logs` hvis den ikke findes; unique index på `(user_id, wearable_source, external_id)`).
- Beregn min/max af berørte datoer og kald `recompute_wearable_summary(user_id, min, max)`.
- Opdatér `wearable_connections` for provider `apple_health`: `last_sync_at=now()`, `status='connected'`, `granted_scopes`, `device_label`.
- Returnér `{ inserted, workouts_inserted, from, to }`.

**Konflikt Shortcut vs HealthKit**: `mirror_health_data_to_summary` triggeren skriver rå Shortcut-værdier direkte i `wearable_daily_summary` og kalder derefter `recompute_wearable_summary`, som *overskriver* med aggregat fra `wearable_samples`. Nu hvor `wearable_samples` er ikke-tom, vil `recompute_wearable_summary` vinde — hvilket er det vi ønsker (HealthKit er sandhedskilde). Shortcut-brugere uden HealthKit påvirkes ikke (samples-aggregat bliver NULL for dem, men det bliver overskrevet af 0/null — det er en regression). **Løsning:** i `wearable-ingest` kalder vi kun `recompute_wearable_summary` for datoer hvor vi rent faktisk indsatte samples, så Shortcut-only brugere er urørte. Rapporteres i slutrapport.

## Del B — Workout-import
Håndteres inde i `wearable-ingest` (se ovenfor). Ingen auto-match mod plan (day_index/exercise_index) — udtrykkeligt fravalgt scope for V1.

## Del C — Native klient

`bun add @perfood/capacitor-healthkit` derefter `npx cap sync ios` (brugerens job).

**Ny fil `src/lib/healthkit.ts`**:
- `isHealthKitAvailable()` — kun iOS + native.
- `requestHealthKitPermission()` — læse-authorization for de 6 typer. Ved fejl: `console.warn`, returnér false.
- `syncHealthKit(userId, opts?)` — læs sidste 30 dage (90 ved første sync via `wearable_connections.last_sync_at IS NULL`). Map til ingest-format, POST til `wearable-ingest`. Opdatér lokal last-sync throttle (Preferences), max 1/time.
- Kald `syncHealthKit` i `nativeInit.ts` efter auth-ready + på `App.resume` (throttled).

## Del D — Native config (dokumenteres i `ios-healthkit-info.md` opdatering + rapporten)
- `ios/App/App/Info.plist`: `NSHealthShareUsageDescription` = "Sportstalent læser dine sundhedsdata (søvn, puls, HRV og træning) fra Apple Health for at vise din restitution og dokumentere din træning." Ingen write-usage-nøgle (kun læsning).
- Xcode: App target → Signing & Capabilities → **+ HealthKit** (ingen Clinical Records, ingen Background Delivery i V1).
- `capacitor.config.ts`: ingen ændringer nødvendige.
- Podfile: auto-linked, `npx cap sync ios` genererer.

## Del E — UI
- Fjern `useIsAdmin` gate i `src/pages/Health.tsx` og `src/pages/HealthSyncSetup.tsx` (behold TODO-kommentar historisk fjernet).
- I `Health.tsx`: tilføj "Forbind Apple Health"-knap (kun `isHealthKitAvailable()`). Viser status fra `wearable_connections` (connected/last_sync_at). Ved klik: request + sync + toast.
- Ingen ny score. Ingen puls/energi som selvstændige daglige tal — kun søvn/RHR/HRV i den eksisterende observations-UI.

## Del F — i18n + Help + changelog
Tilføj 3 nye keys på tværs af alle 7 sprog:
- `healthConnectAppleHealth` — "Forbind Apple Health"
- `healthAppleHealthConnected` — "Apple Health forbundet"
- `healthAppleHealthSyncing` — "Synkroniserer …"

Help.tsx changelog (alle 7 sprog): "Apple Health-integration: automatisk import af søvn, puls, HRV og træning."

## RØR IKKE
readiness_checkins/submit-readiness, Shortcut/health-sync-simple/resync-health, push, betaling, chat, indsendt App Store build.

## GDPR / App Store to-do (rapporteres, bygges ikke)
- Privatlivspolitik: tilføj kategori "Sundhedsdata via Apple HealthKit (læsning): søvn, hvilepuls, HRV, puls, aktiv energi, træningspas".
- App Privacy skema (App Store Connect): tilføj Health & Fitness → Health, brugsformål "App Functionality", ikke koblet til tredjepartsanalyse.
- Skal opdateres FØR næste TestFlight/App Store submission.

## Teknisk sekvens
1. Migration (unique-index + eventuelle kolonner).
2. Edge function `wearable-ingest`.
3. `bun add @perfood/capacitor-healthkit`.
4. `src/lib/healthkit.ts` + hook i `nativeInit.ts`.
5. UI: fjern admin-gate + knap i Health.tsx.
6. i18n + Help changelog.
7. Opdatér `ios-healthkit-info.md` med præcise Xcode-steps.

Skal jeg gå videre og bygge dette?
