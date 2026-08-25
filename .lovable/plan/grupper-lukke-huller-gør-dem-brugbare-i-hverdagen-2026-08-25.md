# Grupper: lukke huller + gør dem brugbare i hverdagen

## 1. Adgang og navigation
- Tilføj "Grupper" til trænerens bundnavigation? Nej — bunden har allerede 4 punkter (Hold, Træning, Stævner, Spørgeskemaer). I stedet:
  - Behold knappen "Grupper" på holdoversigten (den findes).
  - Tilføj samme genvej i side-/hamburgermenuen, så den kan nås fra alle sider.
- Rolle-gating på `/hold/grupper`: siden viser i dag oprettelsesformular til alle. Den skal kræve trænerrolle (samme tjek som andre `/coach`-sider) og ellers sende brugeren tilbage til dashboard med en kort besked.

## 2. Sletning af gruppe
- Ny "Slet"-handling på hvert gruppekort, med bekræftelsesdialog.
- Slet er kun mulig når gruppen har 0 medlemmer. Har den medlemmer, er knappen deaktiveret med forklaringen: "Fjern alle atleter fra gruppen før den kan slettes."
- Samme regel håndhæves i databasen med en trigger, så reglen ikke kun lever i brugerfladen.

## 3. Tysk oversættelse
- `clubTeamsTitle` (de) rettes fra "Gruppen" i entals-/bestemt betydning til korrekt overskrift "Gruppen" i flertalsbrug — gennemgår hele det tyske gruppe-blok (23 nøgler) og retter de nøgler der læser forkert.

## 4. Bedre forklaring af hvad grupper er
- Kort forklaringsboks øverst på gruppesiden: hvad en gruppe er (fx Kadet, Junior, Senior, Konkurrencehold), at en atlet kan være i flere grupper, og hvor filtrering virker.
- Tilføj afsnit i Hjælp + changelog.

## 5. Grupper som filter i holdoversigten (det du markerede)
- Ny dropdown "Alle grupper" ved siden af bælte-/sorteringsfiltrene i holdoversigten.
- Valg af gruppe filtrerer listen, og tælleren (10 / 10) følger med.
- Filteret vises kun når klubben har mindst én aktiv gruppe.
- Valget huskes i sessionen, så man ikke skal vælge igen ved hvert besøg.

## 6. Hvor giver grupper ellers mening (forslag, prioriteret)
1. Spørgeskemaer — vælg modtagere via gruppe i stedet for at klikke atleter enkeltvis. Størst tidsbesparelse.
2. Beskeder/chat — opret gruppechat ud fra en gruppe.
3. Sæsonplan-synlighed — tildel en plan til fx kun Junior i stedet for hele klubben.
4. Testsessioner — vælg deltagere ud fra gruppe.
5. Admin-broadcast (mail/push) — modtagervalg pr. gruppe.
6. Stævner/tilmelding og fremmøde — filtrér listen efter gruppe.

Forslag: byg punkt 1-5 i denne omgang kun som **filter/valg i holdoversigten** (afsnit 5), og tag 1-3 som næste opgave, så denne leverance forbliver overskuelig. Sig til hvis du hellere vil have spørgeskemaer med nu.

## Teknisk
- `src/pages/CoachTeams.tsx`: rolle-guard, slet-knap med bekræftelse og medlemstjek, forklaringsboks.
- Migration: trigger på `club_teams` der blokerer sletning når der findes rækker i `club_team_members`.
- `src/lib/clubTeams.ts`: `deleteClubTeam(id)`.
- `src/components/coach/SquadOverview.tsx`: hent grupper + medlemskaber for klubben, gruppe-dropdown, filtrering i `useMemo`.
- Genvej til grupper i trænerens sidemenu.
- Nye i18n-nøgler i alle 7 sprog; rettelse af tyske gruppe-nøgler.
- `Help.tsx` + changelog (v1.5.49).
