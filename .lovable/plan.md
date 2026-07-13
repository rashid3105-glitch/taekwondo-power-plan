# Strava-løbedata integration

## Mål
Giv brugerne mulighed for at forbinde deres Strava-konto og automatisk hente løbeaktiviteter (distance, pace, varighed, kalorier) ind i Sportstalent. Data vises både i dagbogen og på health-dashboardet. Synkronisering sker ved app-start og via manuel refresh.

## Baggrund
- Der findes **ingen færdig Strava-connector** i Lovable, så vi bygger en custom OAuth 2.0-integration.
- Jeres `wearable_connections`-tabel findes allerede, men har pt. ingen kolonner til access/refresh tokens.
- `/health`-siden er skjult for ikke-admin indtil native HealthKit er klar. Strava-integrationen kan bygges parallelt og gøres synlig for alle, når health-modulet åbnes.

## Teknisk løsning

### 1. Database
Udvid `public.wearable_connections` med tokenfelter:
- `access_token_encrypted` (text)
- `refresh_token_encrypted` (text)
- `token_expires_at` (timestamptz)
- `provider_user_id` (text)
- `provider_email` (text)

Tokens krypteres i Edge Function med en `STRAVA_TOKEN_ENCRYPTION_KEY`-secret, før de skrives til databasen. Rækker scoperes til `auth.uid()` via RLS; service role bruges kun i Edge Functions.

### 2. Edge Functions
Tre nye funktioner:

**`strava-auth-start`**
- Validerer brugerens JWT.
- Genererer Strava OAuth URL med `activity:read_all` scope.
- Returnerer `{ authUrl }` til frontend.

**`strava-callback`**
- Modtager `code` fra Strava.
- Bytter koden til access + refresh token hos Strava.
- Krypterer tokens og upserter en række i `wearable_connections` med `provider = 'strava'`.

**`strava-sync`**
- Validerer JWT, finder brugerens Strava-forbindelse.
- Refresher token hvis det er udløbet.
- Henter seneste aktiviteter fra `https://www.strava.com/api/v3/athlete/activities`.
- For hvert løb:
  - Opretter/oppdaterer en `diary_entries`-række med `entry_type = 'running'` og felterne `run_distance_km`, `run_pace_seconds_per_km`, `run_duration_seconds`, `run_calories`.
  - Opdaterer `wearable_daily_summary` med trin/workout-count for aktivitetsdatoen.
- Returnerer `{ synced: n }`.

### 3. Frontend
- Ny komponent `StravaConnectButton` på Settings → Wearables og/eller Health-siden.
- Viser status: ikke forbundet / forbundet / sidste sync.
- "Synkroner nu"-knap, der kalder `strava-sync`.
- Kald `strava-sync` automatisk ved app-start, hvis en forbindelse findes.
- Løb vises automatisk i eksisterende dagbog og i Coach Athlete Overview (`AthleteRunningProgress`), da de nu har `entry_type = 'running'`.
- Health-dashboard viser workout-count fra `wearable_daily_summary`.

### 4. Oversættelser
Nye nøgler på alle 7 sprog:
- `stravaConnect`, `stravaDisconnect`, `stravaSyncNow`, `stravaLastSync`, `stravaConnected`, `stravaNotConnected`, `stravaRunsThisWeek`.

### 5. Dokumentation
- Opdater `Help.tsx` med changelog-entry for Strava-integrationen.
- Opret kort opsætningsguide til Strava API-app (client ID/secret).

## Forudsætninger / hvad I skal gøre
1. Opret en Strava API-app på https://developers.strava.com/.
2. Notér **Client ID** og **Client Secret**.
3. Sæt følgende secrets i Lovable:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - `STRAVA_TOKEN_ENCRYPTION_KEY` (kan genereres automatisk)
4. Godkend planen, så jeg implementerer den.

## Noter
- Strava OAuth kræver en autorisationsskærm; brugeren skal eksplicit tillade `activity:read_all`.
- Hvis brugeren senere ønsker push/webhooks fra Strava, kan vi tilføje en `strava-webhook`-funktion i en opfølgende iteration.
- Integrationen følger samme mønster som den eksisterende `health-sync-simple`-funktion, men med OAuth i stedet for email/password.