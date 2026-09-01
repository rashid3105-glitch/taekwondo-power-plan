# Træningslogs som eget punkt i trænernes bundnavigation

Trænerkøen ligger i dag øverst på `/coach/today` og på testsiden. Den får sin egen side og sit eget ikon i bundnavigationen — stadig kun synligt for platform-admins, så almindelige trænere ikke ser den under livetesten.

## Hvad der bygges

**Ny side: `/coach/logs`**
- Fuldskærms-visning af trænerkøen (samme komponent som i dag) med sidetitel "Træningslogs" og kort forklaring.
- Viser dagens delte logs fra klubben; "Kun mig"-opslag vises aldrig.
- Adgang: kun platform-admin. Andre sendes til `/coach`.

**Bundnavigation (trænertilstand)**
- Nyt punkt "Logs" med et notat-ikon, placeret mellem "I dag" og "Hold".
- Punktet vises kun når lab-adgang er aktiv (platform-admin), så navigationen forbliver 5 punkter for alle andre.
- Ulæst-tæller: lille badge med antal ubehandlede logs i dag, så man kan se det uden at åbne siden.

**`/coach/today`**
- Køen fjernes fra toppen af siden og erstattes af en kompakt linje: "X træningslogs venter" med link til `/coach/logs`. Det holder "I dag" kort og gør oversigten til ét fast sted.

**Tekster**
- Nye nøgler til fanelabel, sidetitel, beskrivelse og tomtilstand oversættes til alle 7 sprog.

## Teknisk

- `src/pages/coach/CoachLogs.tsx` (ny) — bruger `useSuperadminLab` som guard og genbruger `CoachLogQueue` med `bare`-varianten.
- Rute registreres i `src/App.tsx`.
- `src/components/AppBottomNav.tsx` — `coachMode`-arrayet får et betinget punkt baseret på `useSuperadminLab().labEnabled`; badge-tallet hentes med samme forespørgsel som køen (dagens delte `diary_entries` af typen `training` uden trænersvar).
- `src/pages/CoachToday.tsx` — erstatter `<CoachLogQueue />` med en lille genvejslinje.
- Nye nøgler i `src/i18n/translations.ts` (da, en, sv, de, ar, no, es).

Ingen databaseændringer.
