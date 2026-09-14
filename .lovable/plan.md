# Trådvisning i dagbogen

Hvert svar skal høre synligt til det indlæg, det handler om — og atleten skal kunne svare tilbage i samme tråd. Ændringen sker på atletens dagbogsside.

## Sådan kommer det til at se ud

```text
┌ Tir 14. sep — Teknik ─────────────────────┐
│ "Følte mig tung i benene i dag..."        │
│                                           │
│ ▸ Samtale · 4 svar                        │
│   ┌ Farooq (træner) · 14. sep 19:12 ─────┐│
│   │ Godt arbejde — hold fokus på hofte.  ││
│   └──────────────────────────────────────┘│
│   ┌ Dig · 14. sep 20:02 ─────────────────┐│
│   │ Okay, jeg prøver i morgen.           ││
│   └──────────────────────────────────────┘│
│           [ Vis alle 4 svar ]             │
│   [ Skriv et svar...            ] [ Send ]│
└───────────────────────────────────────────┘
```

- Svar vises altid inde i indlæggets kort, aldrig som en løs liste.
- Som standard vises de 2 nyeste svar; "Vis alle N svar" folder resten ud.
- Atletens egne svar står til højre/markeret anderledes end trænerens, så det er tydeligt hvem der skriver.
- Er der ingen svar endnu, vises kun et diskret "Skriv et svar"-felt.

## Atleten kan svare tilbage

Under hver tråd får atleten et svarfelt med send-knap og emoji, samme stil som trænerens. Atletens svar er altid synligt for de trænere, der i forvejen kan se tråden — atleten har ikke noget "kun til mig"-valg. Trænerens eksisterende valg mellem "del med klubbens trænere" og "kun mig og atleten" ændres ikke.

## Hvad der ikke ændres

- Trænerens dagbogsvisning, forsiden/I dag-kortet og kvitteringen efter træning beholder deres nuværende visning.
- Ingen ændring af hvem der må læse hvilke svar.

## Tekniske detaljer

- `src/components/DiaryComments.tsx`: omskrives til trådvisning — grupperet under `diary_entry_id` (uændret datamodel), collapse-logik (2 nyeste + "vis alle"), forfatterskelnen via `coach_id === currentUserId` kombineret med indlæggets ejer, og svarfelt der nu også vises når `canComment` er falsk (atlet på egen tråd). Komponenten får en `entryOwnerId`-prop fra `Diary.tsx`, så den kan afgøre, om den aktuelle bruger er atleten bag indlægget.
- `src/pages/Diary.tsx`: sender `entryOwnerId={entry.user_id}` med.
- Én migration på `public.diary_comments`:
  - Ny kolonne `author_role text not null default 'coach'` med check `('coach','athlete')`, så visningen kan skelne uden at gætte. Eksisterende rækker bliver `'coach'`.
  - Ny INSERT-policy: atleten må indsætte kommentar på eget indlæg (`coach_id = auth.uid()`, `author_role = 'athlete'`, `is_shared = true`, og `diary_entries.user_id = auth.uid()`).
  - Ny SELECT-policy: klubtrænere, der allerede kan se tråden, kan også se atletens svar (samme betingelser som den eksisterende delte-visning, blot uden `coach_id <> auth.uid()`-kravet for `author_role = 'athlete'`).
  - Eksisterende coach-policies, delete/update og superadmin-adgang ændres ikke.
- Nye oversættelsesnøgler på alle 7 sprog: `diaryThreadReplies`, `diaryThreadShowAll`, `diaryThreadReplyPlaceholder`, `diaryThreadYou`.
- Changelog-punkt i `src/pages/Help.tsx`.
