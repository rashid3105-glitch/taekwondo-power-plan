## Kort svar

Der findes ingen side at guide dig til — funktionen mangler i brugerfladen.

Jeg har tjekket koden for trænerens sæsonplanlægning (`/coach/season-calendar`): den redigerer sæsonplaner, faser, teknikfokus og individuelle undtagelser — men den rører aldrig tabellen med ugentlige træningsdage (`club_season_day_templates`). Ingen anden side i appen skriver til den tabel heller.

I databasen har to ældre planer stadig dagsskabeloner (fx Tøyen-planen med TKD man/ons/fre/lør og gym tirsdag), men din nye "Sommerplan" har nul rækker. Derfor er felterne i kalenderen tomme — både for dig og for atleterne.

## Hvad jeg foreslår at bygge

En "Ugeskabelon"-sektion på trænerens sæsonplan-side, lige under fase-editoren.

**Indhold**
- Én række pr. ugedag (Ma–Sø).
- Pr. dag: vælg sessionstype (TKD, Gym, Styrke, Selvtræning, Stævne, Fri), et frit felt til sted, og et felt til note.
- Mulighed for at tilføje flere sessioner samme dag (fx morgen-gym + aften-TKD) — kalenderen understøtter allerede flere rækker pr. ugedag.
- Slet-knap pr. session.
- Ændringer gemmes med det samme og kalenderen opdateres.

**Effekt**
- Trænerens grid og atleternes sæsonkalender viser straks TKD/Gym-labels, farvetoninger og teknik-chips i felterne.
- "I dag"-kortet på atletens forside får holdets session for dagen.

**Hjælp til at komme i gang**
- Knap "Kopiér fra klubbens standardskema", der fylder ugeskabelonen ud fra klubbens eksisterende ugeplan, så en ny sæsonplan ikke starter tom.
- Den hjælpetekst, der nu står under kalenderen ved tom skabelon, får et link/scroll til ugeskabelonen.

## Teknisk

- Ny komponent `src/components/season/WeekTemplateEditor.tsx`, indsat i `src/pages/SeasonCalendar.tsx`.
- CRUD mod `club_season_day_templates` (insert/update/delete pr. række), scoped til `selectedPlanId`.
- Sessionstyper og labels genbruges fra `src/lib/seasonCalendar.ts` (`SESSION_TYPES`, `sessionLabelKey`, `sessionRowClass`).
- RLS: eksisterende politik "Coaches manage club day templates" tillader kun planens `created_by`. Den udvides til alle trænere/admins i klubben, så en kollega også kan redigere skemaet.
- Nye i18n-nøgler til alle 7 sprog.
- `Help.tsx` + changelog opdateres med et afsnit om ugeskabelonen.
