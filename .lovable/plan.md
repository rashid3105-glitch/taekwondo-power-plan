## Svar på spørgsmål

Genvejen (`/health/sync-setup`) er i øjeblikket en **orphan route** — den findes i `App.tsx` og `HealthSyncSetup.tsx`, men der er **intet link til den nogen steder i UI'en**. Brugeren skal selv kende URL'en. Det skal vi rette.

## Mål

1. Tilføj synlige indgange til Health-opsætning under **Profil**.
2. Lav en **Android Health Connect placeholder-side** parallelt med iPhone-guiden, så strukturen er klar når Android-opsætningen bygges.

## Ændringer

### 1. Ny side: `src/pages/HealthSyncSetupAndroid.tsx`
Placeholder med samme dark cockpit-stil som iPhone-guiden:
- `PageMeta` (noindex), tilbage-knap til `/profile`.
- Stor ikon (Smartphone fra lucide), titel "Android Health Connect", undertitel "Kommer snart".
- Info-kort der forklarer at Android-opsætningen er under udvikling og linker til iPhone-guiden hvis brugeren har en iPhone.
- "Giv mig besked når den er klar"-knap → mailto eller toast (vi bruger toast: "Vi giver besked når Android er klar").
- Alt i `t()` med nye keys for alle 7 sprog.

### 2. Ny route i `src/App.tsx`
Tilføj `<Route path="/health/sync-setup-android" element={<Page><HealthSyncSetupAndroid /></Page>} />` lige under den eksisterende iPhone-route. Lazy/eager import matcher iPhone-importen.

### 3. Ny sektion i `src/pages/Profile.tsx`
Tilføj en "Sundhed & enheder"-blok i action-listen (mellem `change-password` og `Download`), med to knapper:
- **Apple Health (iPhone)** → `/health/sync-setup` — Apple-ikon (lucide `Apple`).
- **Google Fit / Health Connect (Android)** → `/health/sync-setup-android` — vises med "Kommer snart" badge (lucide `Smartphone`).

Stilen matcher de eksisterende `ActionRow`-knapper i Profile. Ingen ændring af eksisterende knapper.

### 4. Translations
Nye keys i `src/i18n/translations.ts` for alle 7 sprog (en, da, sv, de, ar, no, es):
- `profileHealthSectionTitle` — "Sundhed & enheder"
- `profileHealthAppleTitle`, `profileHealthAppleDesc`
- `profileHealthAndroidTitle`, `profileHealthAndroidDesc`
- `healthAndroidComingSoonTitle`, `healthAndroidComingSoonBody`
- `healthAndroidNotifyMe`, `healthAndroidNotifyToast`
- `comingSoonBadge` — "Kommer snart"

### 5. Changelog
`changelogEntry131` i alle 7 sprog + entry i `src/pages/Help.tsx`: "Health-opsætning er nu tilgængelig under Profil; Android Health Connect kommer snart."

## Uden for scope
- Ingen ændring af `HealthSyncSetup.tsx` (iPhone-guiden), `Health.tsx`, edge functions eller DB.
- Ingen reel Android-implementering — kun placeholder.
- Ingen ændring af bottom nav.

## Tekniske noter
- Profile-knappen til Android er **ikke disabled** — den navigerer til placeholder-siden så brugeren ser status og kan tilmelde sig notifikation.
- `Apple`-ikonet findes i lucide-react; falder ellers tilbage til `Heart`.
