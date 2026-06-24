## Hvad undersøgelsen viser

- Kaldet til `scan-food` fejler ikke længere på login: netværksloggen viser `Status: 200` og en gyldig bruger-token.
- Backend returnerer faktisk en analyse for billedet, men svaret er i gammelt single-resultat format:
  - `{"result":{"name":"Røræg med laks...","calories":...}}`
- Frontend forventer nu det nye per-komponent format:
  - `result.items[]`
- Derfor viser appen fejlen “Kunne ikke analysere billedet”, selvom analysen lykkes. Problemet er altså primært en format-/deployment-mismatch mellem edge-funktionen og klienten.

## Plan

1. **Stop falske fejlbeskeder i frontend**
   - Opdater `FoodScanner.tsx`, så den accepterer både:
     - nyt format: `result.items[] + result.total`
     - gammelt format: `result.name/calories/protein/carbs/fat/portion/confidence`
   - Hvis gammelt format modtages, konverteres det lokalt til ét item med en full-image bounding box, så brugeren stadig får et brugbart resultat i stedet for fejl.

2. **Gør edge-funktionen bagud- og fremadssikker**
   - Bevar serverens normalisering, men stram valideringen så svaret altid sendes til klienten som:
     - `result.items`
     - `result.total`
     - legacy top-level felter
   - Tilføj en intern `schema_version`/diagnosemarkør i JSON-svaret, så vi kan se i netværksloggen om den nye funktion faktisk kører.

3. **Reducer spild af credits ved gentagne klik**
   - Tilføj en klient-side guard, så brugeren ikke kan sende samme billede flere gange parallelt.
   - Gem seneste succesfulde analyse for det aktuelle billede i komponent-state, så gentagne tryk ikke kalder modellen igen unødigt.

4. **Bedre fejlbeskeder uden at bruge ekstra modelkald**
   - Skeln tydeligt mellem:
     - session udløbet
     - billedet for stort
     - analyse lykkedes men svaret havde uventet format
     - model/gateway fejl
   - Behold brugerens billede på skærmen efter fejl, så man ikke skal uploade igen.

5. **Verificering efter implementering**
   - Test den konkrete response-form fra netværksloggen mod frontend-parseren.
   - Kontrollér at et legacy-resultat viser kalorier/makroer i UI i stedet for toast-fejl.
   - Kontrollér at nyt `items[]` format stadig viser komponenter og bounding boxes.

## Filer der ændres

- `src/components/FoodScanner.tsx`
- `supabase/functions/scan-food/index.ts`