## Diagnose

Annamaria (TKD‑203205) er allerede tilknyttet dig som coach i **Copenhagen City** (rækken fra 14. juni), og det er DEN klub `add-athlete-by-code` blev kaldt med — ikke UC Copenhagen.

Bevis fra databasen:
- `coach_athletes` har to rækker for (dig → Annamaria):
  1. `club_id = 4b827e40` (Copenhagen City) — 14. juni
  2. `club_id = NULL` (legacy admin‑approve række) — 16. juni 20:37
- Ingen række for `club_id = 440ea492` (UC Copenhagen).
- Den unique index `(coach_id, athlete_id, COALESCE(club_id, sentinel))` ville tillade UC‑rækken. Den blev altså aldrig forsøgt.

Konklusion: edge‑funktionen modtog `club_id = Copenhagen City` (ikke UC). `activeClubId` i `ActiveClubContext` var stadig Copenhagen City da du trykkede "Add" — sandsynligvis fra localStorage `activeClubId:<din-userId>` der huskede sidste valg fra tidligere session. Funktionen gjorde det rigtige (afslog dublet) — fejlmeddelelsen var bare ikke informativ nok til at afsløre at den arbejdede på den forkerte klub.

## Hvad der ændres

### 1. `supabase/functions/add-athlete-by-code/index.ts`
- Returnér `ALREADY_IN_CLUB` med klubnavn i payload: `{ error: "ALREADY_IN_CLUB", club_name }` så frontend kan vise hvilken klub.
- Slå klubnavn op (én ekstra `clubs.name` query) inden insert‑forsøget for at have navnet ved hånden.
- Returnér også 200 succes hvis Annamaria allerede er en active athlete‑membership i den valgte klub OG `coach_athletes`‑rækken eksisterer for samme `(coach, athlete, club_id)` — dvs. behandl re‑add som idempotent for samme klub (men stadig informativ via `{ already: true, club_name }`).

### 2. `src/components/coach/CreateAthleteDialog.tsx`
- I `addByCode` `catch ALREADY_IN_CLUB`: vis toast med klubnavnet, f.eks. `Annamaria er allerede tilknyttet dig i "Copenhagen City Taekwondo klub". Skift aktiv klub øverst for at tilføje hende til en anden klub.`
- Gør den eksisterende `→ {activeMembership.club_name}` mere prominent: flyt op i `DialogHeader` som badge med en kontrastfarve, så det er umuligt at overse hvilken klub atleten lander i.

### 3. Translations (`src/i18n/translations.ts`)
- Tilføj nye nøgler i alle 7 sprog (da/en/sv/de/ar/no/es):
  - `athleteAlreadyAddedInClub` ("{name} er allerede i {club}. Skift aktiv klub for at tilføje til en anden.")
  - `addingToClub` ("Tilføjes til")

### 4. Engangs‑oprydning (valgfrit, kun hvis du bekræfter)
- Slet den legacy NULL‑club_id række i `coach_athletes` for (dig → Annamaria), så datamodellen er rent klub‑skaleret.
- Hvis du faktisk ønsker Annamaria tilknyttet både Copenhagen City og UC Copenhagen, så indsætter jeg manuelt en `coach_athletes`‑række + `club_memberships`‑række for UC Copenhagen som engangs‑fix.

## Tekniske detaljer

- Edge function endrer kun fejl‑payload + tilføjer "already linked to this club" idempotency‑gren — ingen breaking changes.
- Dialog ændringer er rene UI/i18n.
- Ingen migration nødvendig.

## Spørgsmål før jeg implementerer

1. Skal jeg også gennemføre engangs‑oprydningen i punkt 4 (NULL‑række + tilføj Annamaria til UC Copenhagen)?
2. Vil du have en hård guard, der nægter add‑by‑code hvis atleten allerede er tilknyttet dig i en *anden* klub (med en "Bekræft for at også tilføje til {ny klub}"‑dialog), eller skal vi bare lade den gå igennem stille?
