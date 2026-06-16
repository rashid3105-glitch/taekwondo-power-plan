## Plan

### 1. Engangs-oprydning i databasen (migration)

- **Slet** legacy `coach_athletes`-række hvor `coach_id = <din userId>`, `athlete_id = <Annamarias userId>`, `club_id IS NULL` (rækken fra 16. juni).
- **Tilføj** `club_memberships`-række: Annamaria som `role_in_club='athlete'`, `status='active'` i UC Copenhagen (`440ea492…`). Brug upsert på `(user_id, club_id, role_in_club)` så den er idempotent.
- **Tilføj** `coach_athletes`-række: (din coach_id → Annamaria, club_id = UC Copenhagen).

Resultat: Annamaria er korrekt tilknyttet dig i begge klubber (Copenhagen City + UC Copenhagen), og den forvirrende NULL-række er væk.

### 2. Cross-club bekræftelsesdialog (frontend + edge function)

**`supabase/functions/add-athlete-by-code/index.ts`**
- Tilføj `confirm_cross_club: boolean` flag i request body (default `false`).
- Inden insert: tjek om atleten allerede har en `coach_athletes`-række med samme `coach_id` men *anden* `club_id`. Hvis ja og `confirm_cross_club !== true`:
  - Returnér `409` med `{ error: "CROSS_CLUB_CONFIRM", other_club_names: [...], target_club_name }`.
- Hvis `confirm_cross_club === true`: kør insert som normalt (idempotent på samme klub bevares).

**`src/components/coach/CreateAthleteDialog.tsx`**
- I `addByCode` `catch CROSS_CLUB_CONFIRM`: åbn en `AlertDialog`:
  - Titel: *"Tilføj også til {target_club_name}?"*
  - Tekst: *"{athleteName} er allerede tilknyttet dig i {other_club_names}. Vil du også tilføje hende til {target_club_name}?"*
  - Knapper: **Annullér** / **Tilføj også her**.
- Ved bekræft: kald edge-funktionen igen med samme `code` + `club_id` + `confirm_cross_club: true`.

### 3. Translations (`src/i18n/translations.ts`)

Tilføj nøgler på alle 7 sprog (da/en/sv/de/ar/no/es):
- `addAthleteCrossClubTitle` — "Tilføj også til {club}?"
- `addAthleteCrossClubBody` — "{name} er allerede tilknyttet dig i {otherClubs}. Vil du også tilføje til {targetClub}?"
- `addAthleteCrossClubConfirm` — "Tilføj også her"

### 4. Tekniske detaljer

- Migrationen rammer kun tre rækker — ingen schema-ændring.
- `confirm_cross_club` er bagudkompatibel: gamle klienter får bare 409'eren og kan vise rå fejlmeddelelsen via eksisterende fallback.
- Ingen ændringer i `ActiveClubContext` — den prominente badge fra forrige runde gør allerede klart hvilken klub der er aktiv.
