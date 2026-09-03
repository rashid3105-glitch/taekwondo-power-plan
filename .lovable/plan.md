# Testresultater: hvem må rette tallet?

## Sådan er det i dag

Redigeringsknappen (blyanten) findes allerede i trænervisningen af fysiske tests, men databasen har **ingen opdateringsregel** for tabellen med testresultater. Der findes kun regler for at oprette, læse og slette:

- Træner: opret, læs, slet (for egne atleter/klub)
- Atlet: opret, læs, slet (egne resultater)
- Ingen — hverken træner eller atlet — kan opdatere en eksisterende række

Så når træneren retter et tal og gemmer, bliver ændringen afvist af databasen. Atleten kan heller ikke rette sit eget tal; det eneste, der virker i dag, er at slette resultatet og indtaste det på ny.

## Hvad der bygges

Rettelse tillades direkte, med samme afgrænsning som allerede gælder for at oprette og slette:

- **Træneren** kan rette resultater for atleter i sin egen klub / sine egne atleter.
- **Atleten** kan rette sine egne resultater.

Ingen ændringer i brugerfladen er nødvendige — blyantsknappen findes allerede i trænervisningen. Hvis du også vil have en redigeringsknap i atletens egen testvisning, siger du bare til, så tilføjer jeg den.

## Teknisk

Én migration på `public.physical_test_results` (eksisterende politikker røres ikke):

- UPDATE-politik "Coaches update club physical_test_results" for `authenticated`, med samme betingelse i `USING` og `WITH CHECK` som den nuværende slette-politik:
  `((club_id IS NOT NULL AND is_coach_of_club(club_id)) OR (club_id IS NULL AND is_coach_of_athletes_club(user_id)))`
- UPDATE-politik "Users update own test results" for `authenticated` med `auth.uid() = user_id` i både `USING` og `WITH CHECK`

Derefter verificeres, at en rettelse fra trænervisningen faktisk persisteres (offline-sync-motoren sender allerede opdateringen; fejlen ligger alene i den manglende politik).
