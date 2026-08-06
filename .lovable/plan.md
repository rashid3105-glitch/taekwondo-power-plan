# Testfeedback fra Android-test (Johannes, S24 Ultra)

Tre ting fra testen: manuelle sundhedsdata blev slettet, danske oversættelser er ikke helt rigtige, og træneren kan ikke lægge egne øvelser/videoer ind til atleten.

## 1. Manuelle sundhedsdata forsvandt efter Health Connect (fejl — højeste prioritet)

Bekræftet årsag: når appen sender data fra Health Connect, kører serveren en genberegning af dagsoversigten, som **overskriver hele dagens række** med værdier udregnet fra de synkroniserede målinger. Har Health Connect ingen skridt eller puls den dag, skrives 0/tom oven i det, brugeren selv har tastet. Søvn overlevede, fordi Health Connect faktisk leverede søvn.

Rettelse:
- Genberegningen skal kun opdatere et felt, hvis der rent faktisk findes målinger for netop det felt den dag. Ingen målinger = rør ikke feltet, så manuelle tal bevares.
- Skridt og aktiv energi skal ikke længere skrive 0 ved tomt datasæt.
- Genopbyg dagsoversigten ud fra de manuelle registreringer, så data der allerede er blevet nulstillet for eksisterende brugere kommer tilbage (de manuelle rækker ligger stadig gemt separat).
- Health-siden markerer tydeligt, hvilke tal der er manuelle vs. synkroniserede.

## 2. Danske oversættelser

- Gennemgang af de danske tekster i trænings- og sundhedsflowet for engelske rester, forkert bøjning og fagudtryk.
- Retter det, der findes; hvis der er konkrete skærmbilleder fra testeren, prioriteres de først.

## 3. Træner-øvelser og videoer til atleten

I dag kan hver bruger kun oprette egne øvelser til sig selv — en træner kan ikke sende en øvelse eller en video videre til en atlet.

Foreslået omfang:
- Trænerens egne øvelser kan markeres som klub-øvelser og bliver synlige i atletens øvelsesvælger (også ved "skift øvelse" i planen).
- Øvelsen kan indeholde et videolink (YouTube/Vimeo) samt evt. en uploadet video, som atleten kan afspille direkte på øvelsen.
- Adgang begrænses til trænerens egen klub.

## Teknisk

- Migration: `recompute_wearable_summary` ændres til betinget opdatering pr. metrik (kun når der findes samples for metrikken den dag) + engangs-backfill fra `health_data` til `wearable_daily_summary`.
- `src/pages/Health.tsx`: kildemærkning (manuel/synk) på de enkelte nøgletal.
- `user_exercises`: tilføj `club_id` + `visibility` (privat/klub), RLS så klubmedlemmer kan læse klub-øvelser og kun ejeren kan redigere; GRANTs følger med.
- `ExercisePicker.tsx` / `ExerciseLibrary.tsx` / `AddExerciseForm.tsx`: hent også klub-øvelser, vis videofelt og afspilning.
- Nye tekstnøgler tilføjes på alle 7 sprog; `Help.tsx` + changelog opdateres (v1.5.21).

## Rækkefølge

1. Datatabsfejlen (migration + backfill)
2. Oversættelsesgennemgang
3. Træner-øvelser med video
