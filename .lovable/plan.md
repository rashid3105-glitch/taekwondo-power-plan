## Plan: Få mad-billedanalyse til at virke igen

### Problemet
`scan-food` bliver ramt med et anonymt token i stedet for brugerens login-token. Derfor svarer backend med `401 unauthorized`, og appen viser kun den generiske besked “Kunne ikke analysere billedet”.

### Fix
1. **Frontend: stop anonymt kald**
   - I `FoodScanner.tsx` henter vi den aktuelle session før analysen.
   - Hvis der ikke findes en rigtig bruger-session, stopper vi før backend-kaldet og viser: “Log ind igen for at analysere mad”.
   - Kaldet til `scan-food` sendes med brugerens access token eksplicit.

2. **Backend: robust token-validering**
   - I `supabase/functions/scan-food/index.ts` valideres kun rigtige bruger-JWTs.
   - Anonyme publishable/anon tokens afvises tydeligt, så fejlen ikke ligner en billedanalyse-fejl.

3. **Bedre brugerfejl**
   - `401` oversættes i UI til en login/session-besked.
   - AI/model-fejl og billed-fejl holdes adskilt, så vi kan se om problemet er auth, billede eller analyse.

4. **Verificering**
   - Deploy/test `scan-food` direkte med en autentificeret request.
   - Tjek at den ikke længere sender anonymt token fra preview.
   - Tjek TypeScript for de ændrede filer.

### Ingen ændringer
- Ingen UI redesign.
- Ingen databaseændringer.
- Ingen ændring af nutrition logging eller eksisterende måltidsdata.