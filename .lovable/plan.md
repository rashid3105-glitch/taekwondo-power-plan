
## Mål
Tilføj en "Debug sync"-knap i `HealthSyncSetup.tsx`, så vi kan isolere om problemet sidder i Shortcut'en eller i selve `sync-health-data`-endpointet.

## Hvad bygges

I `src/pages/HealthSyncSetup.tsx`, lige under det eksisterende "Test forbindelse"-card, tilføjes et nyt card "Debug sync":

1. **Knap: "Send dummy record"**
   - Henter først en frisk session-token via `supabase.auth.getSession()` (samme bruger er allerede logget ind, så ingen kodeord-prompt nødvendig).
   - POST'er til `SYNC_URL` med:
     - Headers: `Content-Type: application/json`, `apikey: ANON_KEY`, `Authorization: Bearer <session.access_token>`
     - Body: én dummy `StepCount`-record dateret i dag:
       ```json
       { "records": [
         { "metric_type": "StepCount", "value": 1234,
           "start_date": "<today ISO>", "unit": "count",
           "source_name": "debug-button" }
       ] }
       ```

2. **Vis i UI'et**
   - HTTP-statuskode (badge — grøn ved 200, rød ved øvrigt)
   - Rå response-body i `<pre>` med `whitespace-pre-wrap break-all text-[11px]`
   - Loading-spinner mens kaldet kører
   - Kort hjælpetekst: "Hvis denne returnerer 200 og `upserted: 1`, så virker endpointet — så ligger fejlen i Shortcut'ens opsætning."

3. **State**
   - `debugLoading: boolean`
   - `debugResult: { status: number; body: string } | null`

## Hvad røres ikke
- Ingen ændringer i edge functions (`sync-health-data` er bekræftet korrekt).
- Ingen ændringer i database eller andre filer.
- Ingen i18n — siden er pt. dansk-hardcoded, samme stil bevares.

## Teknisk note
- Dummy-recorden vil oprette/opdatere en række i `health_data` for i dag med `steps = 1234`. Det er forventet — vi kan se det blive overskrevet næste gang Shortcut'en synker rigtige data.
