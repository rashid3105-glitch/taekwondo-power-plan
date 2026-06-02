# Option A + C — Hostet Genvej nu, native app senere

## Strategi
- **Nu (Option A):** Erstat den komplekse byggevejledning med én download-knap til en færdig `.shortcut`-fil. To taps + email/kode én gang.
- **Sigt (Option C):** Marker tydeligt at native Apple Health-integration kommer i juli 2026 med native appen, så brugere ved hvorfor "midlertidig" løsning er OK.

## Hvad du (Rashid) skal levere én gang
1. På din iPhone: byg genvejen i Genveje-appen efter den eksisterende 5-trins opskrift (Find sundhedssampler × Skridt/Hvilepuls/HRV/Søvn → Hent indhold fra URL → POST til `health-sync-simple`).
2. Brug **"Spørg hver gang"** for `email` og `password` — iOS prompter brugeren første gang og husker svarene.
3. Tilføj automation: "Hver dag kl. 07:00 → Kør genvej, spørg ikke".
4. Eksportér som `sportstalent-sync.shortcut` og send filen til mig.

Indtil filen er klar peger knappen på `/sportstalent-sync.shortcut` (404). Du kan også uploade den via Lovable-filupload bagefter — ingen kodeændring nødvendig.

## Kodeændringer

### 1. `src/pages/HealthSyncSetup.tsx`
Reducér fra 8 → **4 trin**: intro · hent genvej · tillad Apple Health · test & færdig.

Trin 2 (nuværende "byg genvej") bliver:
- Stor primær-knap "Tilføj genvej til iPhone" → `<a href="/sportstalent-sync.shortcut" download>`.
- Kort tekst: "iOS åbner Genveje-appen. Tryk Tilføj genvej, indtast din Sportstalent-email og adgangskode én gang — så husker iPhone dem."
- Lille fodnote: "Skal åbnes på iPhone i Safari."

Fjern:
- `JSON_BODY_TEMPLATE`, `SYNC_ENDPOINT`-konstanten (kun brugt i guide).
- Hele 5-trins byggevejledning + JSON CopyField + security-note blokken.
- Email-trin (S4) og Endpoint-trin (S5) — ikke længere relevante, brugeren indtaster i iOS prompt.
- Ikoner: `Wrench`, `Mail`, `KeyRound`, `Copy` (CopyField bruges ikke mere), `ShieldCheck`.

Behold:
- Intro (S1), HealthKit-tilladelser illustration (S6 → ny S3), Test & færdig (S7+S8 slået sammen → ny S4).

Tilføj **info-banner** øverst på trin 1: "Midlertidig løsning indtil native iPhone-app i juli 2026 — så bliver opsætning automatisk."

### 2. `public/sportstalent-sync.shortcut`
Tom placeholder indtil du uploader. Vite serverer statiske filer i `public/` som de er — `.shortcut` MIME håndteres af iOS via URL-extension.

### 3. `src/i18n/translations.ts` — alle 7 sprog (en/da/sv/de/ar/no/es)
**Tilføj nye nøgler:**
- `healthSetupNativeAppBanner` → "Midlertidig løsning. Native iPhone-app klar juli 2026 — så bliver opsætning automatisk."
- `healthSetupS2NewTitle` → "Hent genvejen"
- `healthSetupS2NewBody` → "iOS åbner Genveje-appen. Tryk Tilføj genvej og indtast din email + adgangskode én gang."
- `healthSetupS2DownloadBtn` → "Tilføj genvej til iPhone"
- `healthSetupS2SafariNote` → "Skal åbnes på iPhone i Safari."

**Genbruges:** `healthSetupS6Title/Body` (HealthKit tilladelser), `healthSetupS7*` (test), `healthSetupS8*` (færdig). Bliver til S3 og S4 i ny rækkefølge.

**Lader stå (ubrugt, sikker fallback):** `healthSetupS3Step1..5`, `healthSetupS3JsonLabel`, `healthSetupS3SecurityNote`, `healthSetupS3Body`, `healthSetupS3Title`, `healthSetupS4Title/Body`, `healthSetupS5Title/Body`, `healthSetupOpenShortcut`.

### 4. Changelog
`changelogEntry133` i alle 7 sprog + linje i `src/pages/Help.tsx` v1.0.1:
- DA: "Apple Health-opsætning er nu ét tap: hent genvejen, indtast email og adgangskode én gang."

## Uden for scope
- Edge function `health-sync-simple` — uændret (samme kontrakt).
- `HealthSyncSetupAndroid.tsx` — uændret.
- Ingen DB-ændringer, ingen routing-ændringer, intet auth.
- Native app-arbejdet — separat spor, kun annonceret som banner.

## Verifikation efter implementering
1. TS bygger uden fejl.
2. `/health/sync-setup` viser 4 trin, progress-bar 25%→100%.
3. Trin 1 viser native-app banner.
4. Trin 2 har én download-knap, ingen JSON, ingen byggevejledning.
5. På iPhone Safari: tap knappen → Genveje-appen åbner med "Tilføj genvej" når filen er uploadet.
6. Test-trin lyser stadig grønt når wearable_daily_summary opdateres.

## Næste skridt efter implementering
Du bygger og eksporterer `.shortcut`-filen og uploader den til `public/sportstalent-sync.shortcut`.