## Mål

Opret `src/pages/HealthSyncSetup.tsx` som en interaktiv 8-trins guide, der hjælper iPhone-brugere med at sætte deres Apple Health → Sportstalent sync op via iOS Shortcuts. Den originale kode er tabt i historikken, så den bygges fra bunden, men matcher den eksisterende arkitektur så intet andet går i stykker.

## Tilpasninger til eksisterende kodebase

For at undgå at ødelægge andet:

- **Route**: i `src/App.tsx` linje 159 redirecter `/health/sync-setup` i dag til `/health`. Den redirect erstattes med `<Route path="/health/sync-setup" element={<Page><HealthSyncSetup /></Page>} />` + lazy/eager import af den nye side. Ingen andre routes røres.
- **Sync-backend**: Bruger den eksisterende `health-sync-simple` edge function (email + password + step/sleep/hr/hrv felter). Guiden viser brugerens email + Supabase project URL (`VITE_SUPABASE_URL`) som copy-værdier, så Shortcut'en kan kalde funktionen.
- **Auth**: Henter session via `supabase.auth.getUser()` ved mount for at autofill email; hvis ikke logget ind → redirect til `/auth?redirect=/health/sync-setup` (matcher mønster fra mem://tech/navigation-patterns).
- **Tilbage-knap** på trin 0 går til `/health` (ikke history.back, så deep links virker).
- **Design tokens**: bruger semantiske Tailwind tokens (`bg-card`, `text-foreground`, `border-border`, `text-primary`) – ingen hardcoded farver. Følger dark cockpit-temaet for authenticated sider (mem://style/aesthetic).
- **Mobil baseline**: `h-11` knapper/inputs, `pt-safe`, sonner toast top-center bruges allerede globalt, haptics via `@/lib/haptics` på copy/next.
- **i18n**: Tekster wraps i `t()` fra `useLanguage()`. Nye keys tilføjes for alle 7 sprog (en, da, sv, de, ar, no, es) i `src/i18n/translations.ts`. Ingen hardcoded engelsk.
- **PageMeta**: `<PageMeta title="..." noindex />` (auth-only side).
- **Help.tsx + changelog**: opdateres med ny entry "Health sync setup wizard for iPhone".

## Indhold af de 8 trin

1. **Velkomst** – forklaring + krav (iPhone iOS 15+, Apple Health aktiv).
2. **Åbn Genveje-appen** – iOS mockup illustration, link til App Store hvis ikke installeret.
3. **Tilføj Sportstalent Shortcut** – knap "Åbn Shortcut" (deep link `shortcuts://...` til offentlig iCloud-link) + copy-fallback.
4. **Indtast din email** – viser brugerens email med one-tap copy.
5. **Indtast dit password** – sikkerheds-notice + copy af endpoint URL.
6. **Tillad sundhedsdata-adgang** – screenshot/mockup af iOS permissions.
7. **Test sync nu** – knap der kører Shortcut + viser "venter på data" status (poller `daily_health` for nyeste række via supabase i 30 sek).
8. **Færdig** – grøn success state, link videre til `/health`, samt "Automatiser daglig kørsel" tip (Personal Automation kl. 07:00).

## UI-komponenter

- Top: progress bar (8 segmenter, fyldt op til aktuelt trin) + "Trin X af 8".
- Body: ét kort pr. trin med iOS-stil mockup (rendret som styled div, ikke billede), instruktion, og evt. copy-felt.
- Footer (sticky): "← Tilbage" + "Næste trin →" (Tilbage på trin 0 = `/health`, Næste skjult på trin 7).
- Copy-knapper: `navigator.clipboard.writeText` + haptics + sonner toast "Kopieret".

## Filer der ændres

- **Ny**: `src/pages/HealthSyncSetup.tsx`
- **Edit**: `src/App.tsx` (linje 57 import + linje 159 route)
- **Edit**: `src/i18n/translations.ts` (nye `healthSetup*` keys × 7 sprog)
- **Edit**: `src/pages/Help.tsx` (ny FAQ-entry + changelog)

## Ud af scope

- Ingen ændring af `Health.tsx`, edge functions, DB schema eller `HealthSourceGuide`.
- Ingen ny shortcut-fil – guiden refererer til den eksisterende iCloud-link (placeholder konstant øverst i komponenten, så den let kan opdateres).
