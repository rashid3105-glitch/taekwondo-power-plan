## Problem
`adminClient.auth.admin.deleteUser(user_id)` i `supabase/functions/delete-user/index.ts` kaster `AuthRetryableFetchError` med tom body og status 500. Det betyder at selve HTTP-kaldet til GoTrue's admin-endpoint fejler — ikke en valideringsfejl. Sandsynlig årsag: efter Supabases overgang til signing-keys accepterer admin-API'et ikke længere den gamle `SUPABASE_SERVICE_ROLE_KEY` for dette projekt, mens den nye secret key (eksponeret som `SUPABASE_SECRET_KEYS`) gør.

## Fix (kun `supabase/functions/delete-user/index.ts`)

1. Vælg admin-nøgle med fallback:
   - Prøv `SUPABASE_SECRET_KEYS` først (kan være ren nøgle eller JSON — håndter begge: hvis den starter med `{` eller `[`, parse og tag første værdi/`secret` felt; ellers brug råstrengen).
   - Fald tilbage til `SUPABASE_SERVICE_ROLE_KEY`.
   - Hvis ingen findes → 500 med klar besked.

2. Erstat `auth.admin.deleteUser`-kaldet med et direkte `fetch` til `${SUPABASE_URL}/auth/v1/admin/users/${user_id}` (DELETE) med headers `apikey` + `Authorization: Bearer <adminKey>`. Det giver os rå HTTP-status + body i fejltilfælde i stedet for auth-js' tomme `AuthRetryableFetchError`.
   - Hvis `!res.ok`: læs `await res.text()`, log det, returnér 400 med `{ error: "auth admin deleteUser failed", status: res.status, body: text }` så vi ser den faktiske årsag i UI'et næste gang.

3. Resten af filen (admin-tjek via RPC, cleanup-deletes, CORS) er uændret.

## Verifikation
- Deploy `delete-user`.
- Bed bruger prøve sletning igen fra `/admin/approval`.
- Hvis det stadig fejler vil svaret nu indeholde præcis GoTrue-status og -body (fx 401/403 + besked) i stedet for `{}`, og vi kan ramme rodårsagen direkte.

## Rør ikke
- Ingen ændringer i config, RLS, andre edge functions eller frontend.
- `SUPABASE_SECRET_KEYS`/`SUPABASE_SERVICE_ROLE_KEY` secrets ændres ikke.
