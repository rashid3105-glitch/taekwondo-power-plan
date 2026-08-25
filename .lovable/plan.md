# Fix: træner kan ikke gemme atletens vægt

## Hvad der sker

I trænerpanelet er vægtfeltet aktivt ("Gem"-knappen vises), men databasen afviser gemningen med "new row violates row-level security policy for table weight_logs".

Årsagen er bekræftet i databasen: `weight_logs` har kun én skrivepolitik — "Users manage own weight logs" (`auth.uid() = user_id`). Der findes læsepolitikker for trænere, men ingen skrivepolitik. Til sammenligning har `weight_goals` allerede træner-politikker for oprettelse og redigering af mål for egne atleter — derfor kan træneren sætte målvægten ("Sat af coach"), men ikke registrere en vejning.

## Hvad der bygges

Træneren får lov til at registrere og rette vejninger for de atleter, træneren selv er tilknyttet — præcis samme afgrænsning som gælder for vægtmål i dag. Trænere kan fortsat ikke skrive vejninger for atleter, de ikke er tilknyttet, og atleten kan uændret styre sine egne data.

Ingen ændringer i brugerfladen: felterne er allerede synlige og aktive i trænerpanelet, de virker bare ikke i dag.

## Teknisk

Én migration på `public.weight_logs` (ingen eksisterende politikker ændres eller fjernes):

- Ny INSERT-politik for `authenticated` med `WITH CHECK (EXISTS (SELECT 1 FROM coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = weight_logs.user_id))`
- Ny UPDATE-politik for `authenticated` med samme betingelse i både `USING` og `WITH CHECK` — nødvendig fordi klienten bruger `upsert` med `onConflict: "user_id,log_date"`, så en vejning samme dag bliver en opdatering

Kodesiden (`src/components/weight/WeightModule.tsx`, `saveWeighIn`) kræver ingen ændring; den sender allerede `user_id`, `log_date` og `club_id`.

## Verifikation

Efter migrationen tjekkes at træner-atlet-relationen for Annamaria faktisk findes i `coach_athletes`, ellers vil politikken stadig (korrekt) afvise. Hvis relationen mangler, er det den egentlige rod, og så retter vi tilknytningen i stedet.
