# Multi-klub medlemskab for atleter + licenser pr. klub

## Mål
En atlet (og en coach) kan være aktivt medlem af flere klubber samtidig. ClubSwitcher styrer i hvilken klub data oprettes/vises. Licenser (max_athletes) tælles pr. klub — ikke pr. coach.

## Sandheden flyttes til `club_memberships`
I dag ligger `profiles.club_id` som "single source of truth" for klub-tilhørsforhold, og `coach_athletes` er en global coach↔atlet kobling uden klub-kontekst. Det er årsagen til at ClubSwitcher kun virker visuelt.

Fremover:
- **`club_memberships`** er den autoritative kilde for "hvem er i hvilken klub i hvilken rolle".
- **`profiles.club_id`** beholdes som "primær klub" (bagudkompatibel default), men er ikke længere isolations­nøglen for skrivninger.
- **`coach_athletes`** udvides med `club_id` så samme atlet kan være tilknyttet samme coach i flere klubber (eller forskellige coaches pr. klub).

## Databaseændringer (én migration)

1. `coach_athletes`:
   - Tilføj `club_id uuid references clubs(id)` (nullable i overgangsfasen).
   - Backfill `club_id` fra atletens `profiles.club_id`.
   - Ny unique constraint `(coach_id, athlete_id, club_id)` (erstatter den gamle `(coach_id, athlete_id)`).
   - RLS opdateres så coach kun ser link-rækker for klubber hvor de selv er aktiv coach via `is_coach_of_club(club_id)`.

2. `club_memberships`:
   - Sørg for at hver atlet med `profiles.club_id` har en aktiv `athlete`-membership i den klub (backfill).
   - Tilføj helper `public.user_is_active_member(_user uuid, _club uuid)` (security definer) til brug i RLS hvor relevant.

3. Licenstælling:
   - Tilføj security-definer funktion `public.club_athlete_count(_club_id uuid) returns int` som tæller `club_memberships` med `role_in_club='athlete' AND status='active'` for klubben.
   - `clubs.max_athletes` er allerede pr. klub — bare tælleren der ændres.

4. Ingen ændring til `profiles.club_id` semantik for læsning; det bliver athletens "hjemmeklub"/default visning.

## Edge function: `create-athlete`
- Accepter ny `club_id` i body (sendt fra frontend som `activeClubId`).
- Valider at caller er coach/admin i den klub via `is_coach_of_club`.
- Brug `club_id` (ikke `coachProfile.club_id`) til:
  - athletens `profiles.club_id` (hvis ny atlet — primær klub)
  - `club_memberships` insert (`role_in_club='athlete'`, `status='active'`)
  - klub-standard weekly_schedule
  - consent_records `club_id`
- `coach_athletes` insert får `club_id` med.
- Licenstjek: brug `club_athlete_count(club_id)` mod `clubs.max_athletes`.

## Edge function (ny): `add-athlete-by-code`
Eksisterende "add by code" sker direkte fra klienten via en `coach_athletes` insert, som rammer den gamle unique constraint og giver "allerede på din liste". Flyttes til en edge function for at:
- Acceptere `club_id` (aktiv klub).
- Validere caller er coach/admin i klubben.
- Validere licenstælling pr. klub.
- Tilføje atleten til klubbens `club_memberships` (idempotent, status=active).
- Indsætte `coach_athletes (coach_id, athlete_id, club_id)`; ON CONFLICT DO NOTHING.
- Returnere klart fejl­besked når atleten **allerede er i den valgte klub** vs. **lige er tilføjet**.

## Frontend

- `CreateAthleteDialog`:
  - Læs `activeClubId` fra `useActiveClub()`.
  - Send `club_id: activeClubId` til både `create-athlete` og den nye `add-athlete-by-code` funktion.
  - Fjern direkte `coach_athletes` insert + manuel club-default schedule copy (flyttes til edge function).
  - Vis aktiv klubs navn i dialogen ("Tilføj til <klubnavn>").

- `ActiveClubContext`: ingen ændring; den fungerer allerede korrekt.

- Coach-atletliste (`/coach`): filtrér på `activeClubId` (join via `coach_athletes.club_id` eller `club_memberships`).

## Bagudkompatibilitet
- Eksisterende `coach_athletes` rækker får `club_id` udfyldt fra atletens nuværende `profiles.club_id`. Coaches med kun én klub mærker ingen forskel.
- Den gamle unique `(coach_id, athlete_id)` droppes, så samme atlet kan linkes i flere klubber.
- Klienter der stadig læser `profiles.club_id` virker uændret (primær klub).

## Hvad jeg IKKE rører
- Auth flow, betaling, andre RLS-policies end de coach_athletes-relaterede, beskeder, chat, planer.
- `profiles.club_id` schema (kun semantik dokumenteres som "primær klub").

## Test efter implementering
- Coach i 2 klubber: skift aktiv klub → tilføj samme atlet i klub B → ingen "allerede på listen" fejl.
- Ny atlet oprettet i klub B får `profiles.club_id = B`, `club_memberships(B, athlete, active)`, `coach_athletes(coach, atlet, B)`.
- Licens­loft i klub A blokerer ikke oprettelse i klub B.
