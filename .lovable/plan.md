# Verifikation af skrivvejene for club_id — og lukning af den reelle kilde

## Hvad jeg allerede har verificeret (læsninger, ikke påstande)

- **Databasen har stempel-triggere på 18 tabeller** (`stamp_club_id_from_user` / `_from_athlete` / `stamp_diary_club_id`) — bl.a. `workout_logs`, `competitions`, `diary_entries`, `readiness_checkins`, `physical_test_results`, `session_attendance`.
- **De fem tabeller fra fase 1 har INGEN trigger**: `diary_comments`, `weight_logs`, `weight_goals`, `athlete_module_overrides`, `athlete_week_technique_focus`. De afhænger 100 % af klientkoden.
- **Nuværende data**: diary_comments 35 rækker / 0 NULL, weight_goals 4 / 0, athlete_module_overrides 0 rækker, athlete_week_technique_focus 0 rækker, weight_logs 25 / 1 NULL — og den ene NULL er fra 22. april, en bruger uden profil-klub og uden aktivt medlemskab (kendt forældreløs række, ikke en ny lækage).
- **Afvigelse fra rapporten**: `WeightModule.tsx` bruger IKKE den aktive klub. Linje 34 henter `activeClubId`, men både vejning (linje 93) og mål (linje 111) sætter kun `profile?.club_id`. `activeClubId` er ubrugt. `DiaryComments.tsx` bruger derimod korrekt `activeClubId ?? primaryClubId`.
- Konsekvens: for en atlet med flere klubber skrives profilens standardklub, ikke den aktive — og hvis `profile` mangler `club_id`, skrives feltet slet ikke (feltet udelades, ingen fejl, tavst hul).

## Trin 1 — den faktiske skærmtest (det du bad om)

Kør en styret browsersession mod appen:
1. Log ind som træner, åbn en atlets dagbog, skriv en kommentar.
2. Åbn samme atlets vægtpanel, registrér en vejning.
3. Slå de to nye rækker op i databasen og bekræft at `club_id` er sat og peger på den rigtige klub.

Resultatet rapporteres med række-id, klub og tidsstempel. Hvis en af dem lander med NULL, er det ikke en teori længere, og trin 2 udføres alligevel.

## Trin 2 — luk kilden i databasen, ikke kun i UI'et

Klientkode er ikke en garanti: offline-sync, edge-funktioner, fremtidige skærme og importer kan alle skrive udenom. Derfor tilføjes stempel-triggere på de fem tabeller, så `club_id` udfyldes serverside når den mangler:

- `weight_logs`, `weight_goals`, `athlete_module_overrides` → udled af `user_id`
- `athlete_week_technique_focus` → udled af `athlete_id`
- `diary_comments` → udled via `diary_entries.user_id`

Triggeren overskriver ikke en værdi der allerede er sat (kun `NEW.club_id IS NULL`), så trænerens aktive klub vinder stadig. Det gør fase 2 (RLS) og fase 3 (NOT NULL) sikre.

## Trin 3 — ret den ene reelle kodefejl

`WeightModule.tsx`: brug `activeClubId ?? profile?.club_id` begge steder, så flerklub-trænere skriver til den klub de faktisk arbejder i — samme mønster som `DiaryComments.tsx`.

## Trin 4 — regressionsvagt

Tilføj en enkel forespørgsel til RUNBOOK'en der viser NULL-antal pr. tabel med `club_id`, så nye huller opdages på et minut i stedet for at dukke op når fase 2 fejler.

## Teknisk

- Én migration: fem `BEFORE INSERT`-triggere der genbruger de eksisterende funktioner (`stamp_club_id_from_user`, `stamp_club_id_from_athlete`) plus én ny lille funktion til `diary_comments`, som slår klubben op via dagbogsindlægget.
- Ingen RLS-ændring, ingen NOT NULL, ingen ændring af eksisterende politikker.
- Én kodeændring i `src/components/weight/WeightModule.tsx` (to linjer).
- Changelog opdateres ikke — dette er en verifikations- og hærdningsrunde uden brugersynlig ændring.
