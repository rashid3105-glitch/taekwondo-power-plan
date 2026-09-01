# Post-training log v2 — skjult livetest i appen

Prototypen fra `/prototypes/post-training-log-v2` bygges som en rigtig funktion, men skjult: kun synlig for superadmin, plus en hemmelig rute til test.

## Hvad brugeren får

**Atlet (hub, kun superadmin):**
- Kort efter træning: Trænede / Delvist / Sprang over
- Anstrengelse 1–10 med ord ("Moderat", "Hårdt", "Maksimalt")
- Kort note
- Modtager-vælger med klare labels i stedet for privatliv-jargon: **"Mine trænere"** / **"Kun mig"**
- Kvittering bagefter: hvad der blev sendt, til hvem, og trænerens svar når det kommer

**Træner (coach-forside, kun superadmin):
- Fælles kø over dagens logs for klubbens atleter (alle trænere ser samme kø)
- Hurtigsvar-knapper + fritekst
- Modtager-vælger på svaret: "Trænere + atlet" eller "Kun atleten"
- Når én træner svarer, forsvinder rækken fra køen for alle og markeres "Håndteret"

**Regler for mindreårige (under 18):**
- Et "kun atleten"-svar til en mindreårig er stadig synligt for klubbens øvrige trænere — aldrig en helt uovervåget voksen-til-barn-kanal
- Forældre ser aldrig selve noten; kun fakta (trænede/ikke, anstrengelse)

## Sådan skjules det

- Hemmelig rute `/lab/post-training-log` (ingen menupunkt, `noindex`) med begge roller i én visning
- Kortene vises også naturligt på hub og coach-forsiden — men kun hvis `is_superadmin()` er sand
- Ingen andre brugere ser noget som helst; ingen ændring i eksisterende visninger

## Data (rigtige data)

Genbruger eksisterende tabeller — ingen nye tabeller nødvendige:
- Loggen gemmes som `diary_entries` (entry_type `training`, `is_private` = "Kun mig", mood/energy = anstrengelse)
- Trænerens svar gemmes som `diary_comments` med `is_shared` som modtager-flag
- "Håndteret" udledes af, om der findes en kommentar på opslaget — ingen skemaændring

## Teknisk

- Ny side `src/pages/lab/PostTrainingLogLive.tsx` + rute i `src/App.tsx` (lazy, noindex)
- Nyt `src/hooks/useSuperadminLab.ts` — tjekker `is_superadmin` og eksponerer `labEnabled`
- Ny `src/components/lab/TrainingLogCard.tsx` (atlet) — udvider mønstret fra `QuickTrainingLog` med modtager-vælger, anstrengelses-ord og kvittering; skriver gennem `useOfflineDiary` så offline stadig virker
- Ny `src/components/lab/CoachLogQueue.tsx` (træner) — henter dagens `diary_entries` for klubbens atleter (respekterer eksisterende club-scoping og `is_private`), viser hurtigsvar og skriver `diary_comments`
- Mindreårig-reglen håndhæves i UI'et og i en RLS-justering, så et ikke-delt trænersvar altid kan læses af klubbens øvrige trænere (er allerede tilfældet for coach-policies — verificeres før build og justeres kun hvis nødvendigt)
- Alle tekster gennem `t()` med nøgler i alle 7 sprog
- Help.tsx + changelog opdateres ikke, da funktionen er skjult under test
