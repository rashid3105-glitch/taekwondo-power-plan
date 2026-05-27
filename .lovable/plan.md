## Diagnose

Fejlen "You do not have access to this project" på `supabase.com` kommer fra **Supabase-dashboardet i Safari**, ikke fra vores API. Det betyder den importerede iCloud-Shortcut indeholder en action der *åbner en URL i browseren* mod et gammelt/forkert Supabase-projekt, i stedet for at lave et POST-kald til vores nye `get-health-token` endpoint.

Den delte iCloud-Shortcut ligger udenfor vores kodebase — vi kan ikke ændre dens actions herfra. Løsningen er at rette den lokalt i Genveje-appen (one-time) eller bygge en frisk.

## Hvad du skal rette i Genveje-appen

Åbn Shortcut'en → tryk på de tre prikker for at redigere → find disse actions:

1. **"Åbn URL"-action der peger på supabase.com** → SLET denne. Den er den der trigger fejlen.
2. **"Hent indhold fra URL" (Get Contents of URL)** — der skal være to:
   - **Token-kald:**
     - Method: `POST`
     - URL: `https://zklwergsziidgyxewbkw.supabase.co/functions/v1/get-health-token`
     - Headers: `Content-Type: application/json`, `apikey: <ANON_KEY>`
     - Request body (JSON): `{ "email": "<din email>", "password": "<dit kodeord>" }`
     - Output: parse `token` fra JSON via "Get Dictionary Value"
   - **Sync-kald:**
     - Method: `POST`
     - URL: `https://zklwergsziidgyxewbkw.supabase.co/functions/v1/sync-health-data`
     - Headers: `Content-Type: application/json`, `Authorization: Bearer <token fra forrige step>`, `apikey: <ANON_KEY>`
     - Request body: `{ "records": [ ...HealthKit samples... ] }`

`<ANON_KEY>` er den publishable nøgle der allerede ligger i `.env` (`VITE_SUPABASE_PUBLISHABLE_KEY`).

## Hvad jeg vil ændre i appen for at gøre det nemmere

Tilføj en **udvidet "Sådan virker det"-sektion på `HealthSyncSetup.tsx`** med:

- En tydelig advarsel: *"Hvis du ser 'You do not have access to this project' kommer den fra Safari/Supabase-dashboardet — det betyder Shortcut'en har en gammel 'Åbn URL'-action der skal slettes."*
- En accordion/expandable med trin-for-trin tjekliste til at verificere Shortcut'ens actions (de 2 POST-kald ovenfor)
- Tre kopier-knapper:
  - Kopier token-URL: `https://zklwergsziidgyxewbkw.supabase.co/functions/v1/get-health-token`
  - Kopier sync-URL: `https://zklwergsziidgyxewbkw.supabase.co/functions/v1/sync-health-data`
  - Kopier API-nøgle (`apikey` header-værdi = anon key)
- En knap "Test forbindelse" der laver et POST til `get-health-token` med brugerens loggedin email (beder om password i en dialog) og viser ✓ hvis 200 / fejlbesked hvis 401, så brugeren kan verificere setup uden at køre hele Shortcut'en.

Ingen ændringer i edge functions — de er korrekte og deployed.

## Filer der ændres

- `src/pages/HealthSyncSetup.tsx` — udvidet UI med advarsel, tjekliste, 3 kopier-knapper og test-forbindelse-knap.
- `src/i18n/translations.ts` — nye DA/EN/SV/DE/AR/NO/ES strings for advarsel + tjekliste.

## Tekniske detaljer

- Test-knappen kalder `fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/json", apikey: ANON_KEY }, body: JSON.stringify({ email, password }) })`.
- Password indtastes i en lokal `<Dialog>` og bruges kun til testkaldet — gemmes ikke.
- Inkluderer `apikey` header for at undgå Supabase gateway-afvisning når `verify_jwt = false`.
- Statuskoder: 200 = ✓, 401 = "Forkert email/kodeord", andet = vis fejl-tekst.
