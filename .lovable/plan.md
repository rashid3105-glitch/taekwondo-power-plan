
## Problem
`SHORTCUT_URL` i `src/pages/HealthSyncSetup.tsx` peger på `https://www.icloud.com/shortcuts/sportstalent-health-sync` — den genvej findes ikke på iCloud, så Apple svarer "Ikke fundet". Vi kan ikke publicere en rigtig genvej fra koden; den skal bygges manuelt i Genveje-appen på en iPhone/Mac.

## Løsning
Skift trin 3 fra "hent genvej" til en indbygget byggevejledning, så brugeren selv kan oprette genvejen én gang. Den eksisterende test-sync på trin 7 bekræfter at den virker.

## Ændringer

### 1. `src/pages/HealthSyncSetup.tsx`
- Fjern konstanten `SHORTCUT_URL` og knappen "Åbn genvej" + tilhørende CopyField.
- Behold `SYNC_ENDPOINT`.
- Omskriv **Trin 3 (`step === 2`)** til "Byg din genvej i Genveje-appen":
  - Kort intro: "Vi bruger Apples Genveje-app. Du bygger den én gang — tager ~3 minutter."
  - Nummereret liste med handlinger:
    1. Åbn **Genveje**-appen → tryk **+** for ny genvej.
    2. Tilføj handling **Find sundhedssampler** → vælg **Skridt**, sidste 1 dag.
    3. Gentag for **Hvilepuls**, **Hjertefrekvensvariabilitet (HRV)**, **Søvnanalyse** (sengetid).
    4. Tilføj **Hent indhold fra URL** → vælg `SYNC_ENDPOINT` (kopiknap), metode **POST**, header `Content-Type: application/json`, body som JSON med `email`, `password`, `steps`, `resting_hr`, `hrv`, `sleep_hours`.
    5. Navngiv genvejen "Sportstalent Sync" og tilføj **Automation** → "Hver dag kl. 07:00 → Kør genvej".
  - CopyField til `SYNC_ENDPOINT` + CopyField til en JSON-body-skabelon (foruddefineret eksempel).
  - Lille info-boks: "Din email + adgangskode bruges kun til at logge ind sikkert. Gemmes lokalt på din iPhone i Genveje."

### 2. Trin-tæller
Bibehold `TOTAL_STEPS = 8` (intro, app, byg-guide, email, endpoint, HealthKit-tilladelser, test, færdig). Rækkefølgen er allerede korrekt — kun indholdet på trin 3 ændres.

### 3. Oversættelser (`src/i18n/translations.ts`)
Tilføj/opdater for alle 7 sprog (en, da, sv, de, ar, no, es):
- `healthSetupS3Title` → "Byg din genvej" (DA)
- `healthSetupS3Body` → ny kort intro
- `healthSetupS3Step1` … `healthSetupS3Step5` → de 5 handlinger
- `healthSetupS3JsonLabel` → "JSON-body (kopiér ind i Genveje)"
- `healthSetupS3SecurityNote` → kort tryghedstekst
- Fjern brug af `healthSetupOpenShortcut` (lad nøglen blive, men ubrugt — sikker fallback).

### 4. Changelog
Tilføj `changelogEntry132` i alle 7 sprog + i `src/pages/Help.tsx` under v1.0.1: "Apple Health-opsætning bruger nu en indbygget byggevejledning i stedet for et eksternt iCloud-link."

## Uden for scope
- `HealthSyncSetupAndroid.tsx` — uændret.
- `health-sync-simple` edge function — uændret (kontrakten er allerede `email`+`password`+felter).
- Ingen DB-ændringer, ingen ny ikon-pakke, ingen routing-ændringer.

## Verifikation efter implementering
1. Bygger uden TS-fejl.
2. Navigér til `/health/sync-setup` → trin 3 viser de 5 handlinger + 2 copy-felter, ingen død iCloud-knap.
3. Kopiér endpoint + JSON og bekræft korrekt indhold.
4. Trin 7 test-sync uændret og kalder stadig `wearable_daily_summary`-poll.
