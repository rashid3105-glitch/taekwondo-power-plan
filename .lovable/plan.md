# Coach-anmodning om evaluering efter stævne

I dag bliver atleten selv promptet i op til 14 dage efter et stævne (`ReflectionPromptCard` + Competitions-side). Coachen har ingen måde at bede om en evaluering på. Vi tilføjer en eksplicit "Bed om evaluering"-handling pr. deltager (og hele holdet) i stævnebottom-sheet'en på coach-siden.

## Brugerflow (coach)

1. Coach åbner `Stævner` → vælger et stævne (drawer åbner med deltagerliste).
2. Hvis stævnet er **i dag eller tidligere**, vises en ny sektion **"Evaluering"** i drawer:
   - Knap: **"Bed alle om evaluering"** (sender til alle deltagere uden eksisterende reflection).
   - Pr. deltager vises status-badge:
     - `Indsendt` (grøn) – hvis der findes en `competition_reflections`-række for atlet + comp.
     - `Anmodet` (muted) – hvis vi tidligere har sendt en anmodning.
     - `—` (intet) – default, med lille "Bed om evaluering"-knap.
3. Hvis stævnet er **fremtidigt**, skjules sektionen (giver ingen mening endnu).

## Brugerflow (atlet)

- Atleten får i forvejen automatisk prompt i 14 dage. Coach-anmodningen tilføjer:
  - En **event_reminder**-række (vises i atletens påmindelsesliste, "Coach beder dig evaluere {Stævne}").
  - Push-notifikation via `send-push` med deeplink `/competitions/:id/reflect`.
  - `ReflectionPromptCard` på dashboardet får et lille "Anmodet af coach"-mærke når en åben anmodning findes.

## Datamodel

Ny tabel `competition_reflection_requests` (minimal, audit + status):

```
id uuid pk
competition_id uuid -> competitions(id) on delete cascade
athlete_id uuid -> auth.users
coach_id uuid -> auth.users
club_id uuid null
requested_at timestamptz default now()
unique (competition_id, athlete_id)
```

RLS:
- `INSERT`: coach kan oprette hvis (`coach_athletes` link) ELLER (`users_share_club(auth.uid(), athlete_id)` og `has_role(auth.uid(),'coach')`).
- `SELECT`: atleten selv + samme coach-regler som ovenfor.
- `DELETE`: kun coach der ejer rækken.
- GRANT SELECT/INSERT/DELETE til `authenticated`; ALL til `service_role`.

(Vi genbruger ikke `event_reminders` som primær kilde, fordi vi har brug for unik nøgle på (competition, athlete) for at vise status korrekt. Men vi opretter ÆOgså en `event_reminders`-række så atleten ser den i den eksisterende påmindelsesliste — samme mønster som andre coach-nudges.)

## Ny edge function

`request-competition-reflection`:

- Input: `{ competition_id: uuid, athlete_ids?: uuid[] }` (hvis ikke angivet → alle deltagere uden eksisterende reflection).
- Auth: validér `getUser(token)`, bekræft coach-role + relation til hver atlet (coach_athletes ELLER samme klub).
- For hver atlet:
  - Spring over hvis der allerede findes en `competition_reflections`-row for (athlete, competition).
  - Upsert i `competition_reflection_requests` (idempotent på unique nøglen).
  - Insert i `event_reminders` (title = stævnets navn, message = "Coachen beder dig evaluere stævnet").
  - Invoke `send-push` med titel "Evaluering ønskes", body "{Stævne} — del din evaluering", url `/competitions/:id/reflect`.
- Output: `{ requested: n, skipped_already_submitted: m }`.

## Frontend-ændringer

- `src/pages/CoachCompetitions.tsx`
  - Hent `competition_reflections` og `competition_reflection_requests` for de viste stævner.
  - I drawer: ny "Evaluering"-sektion (kun ved past/today). Status-badge pr. deltager. To handlinger: bed alle / bed enkelt atlet. Kald edge function, refresh state, toast.
- `src/components/ReflectionPromptCard.tsx`
  - Hvis der findes en `competition_reflection_requests`-række for atletens kommende prompt → vis lille "Anmodet af coach"-badge øverst og evt. lidt stærkere CTA-styling. Ingen ny route, ingen ændret logik for når kortet vises.
- `src/components/coach/CoachAthleteReflections.tsx`
  - I listen over forventede reflections: når der er en anmodning men ingen reflection → vis "Anmodet {dato}". (Lille nice-to-have, samme query.)

## Oversættelser

Tilføj keys for alle 7 sprog (en, da, sv, de, ar, no, es):
`reflectionRequestSection`, `requestReflectionAll`, `requestReflectionOne`, `reflectionStatusSubmitted`, `reflectionStatusRequested`, `reflectionRequestedByCoachBadge`, `reflectionRequestSent`, `reflectionPushTitle`, `reflectionPushBody`.

## Acceptkriterier

1. Coach ser ny "Evaluering"-sektion kun for stævner ≤ i dag.
2. "Bed alle" springer atleter med eksisterende reflection over og viser hvor mange der blev kontaktet.
3. Atleten får både en in-app påmindelse og en push (hvis push aktiveret), der deeplinker direkte til `/competitions/:id/reflect`.
4. Status-badge opdateres korrekt når atleten indsender (kræver bare refetch ved åbning af drawer — ingen realtime nødvendigt).
5. Idempotent: at trykke "Bed om evaluering" igen sender ikke duplikerede rækker (men sender godt nok en frisk push hvis coach trykker manuelt på enkelt-atlet igen — vi vurderer det rimeligt).
6. RLS forhindrer en coach i at sende anmodninger til atleter udenfor egen klub eller managed-liste.

## Ikke i scope

- Ingen email — kun in-app + push (samme mønster som event reminders i dag).
- Ingen redigering/sletning af afsendte anmodninger fra UI (kun via DB hvis nødvendigt).
- Ingen ændring af 14-dages auto-prompt-vinduet.
- Ingen changelog (mindre tilføjelse — kan tilføjes hvis ønsket).
