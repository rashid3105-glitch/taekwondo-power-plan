## Hvad sker der nu

Ingunn (coach i Tøyen Taekwondo) oprettede atleten **Axel Dahl-Engh** i dag. I databasen:
- `profiles.club_id = NULL` (ingen klub)
- ingen `club_memberships`-række
- ingen `coach_athletes`-link

Det betyder Axel sad i et "tomt" tilstand uden klubtilknytning, og UI'et viste "afventer admin-godkendelse" til Ingunn — selvom hun selv havde oprettet ham som coach i en betalt klub.

Konklusion: Axel blev ikke oprettet via coach-dialogen (`CreateAthleteDialog` → `create-athlete` edge function — den sætter både `club_id`, `is_approved=true`, `club_memberships` og `coach_athletes` korrekt). Han er sandsynligvis oprettet via offentlig signup eller via "tilføj med kode"-flowet, som **ikke** auto-godkender eller tilknytter klub på profilen.

## Fix (minimal, lav credit-omkostning)

### 1. `supabase/functions/add-athlete-by-code/index.ts`
Efter `club_memberships`-upsert og `coach_athletes`-insert: tilføj én `UPDATE profiles` der sætter:
- `is_approved = true`
- `club_id = clubId` (kun hvis NULL — rør ikke andres primære klub)
- ryd `pending_coach_id`, `pending_invite_code`, `rejection_reason`

Én ekstra query, ingen schema-ændring.

### 2. Backfill Axel manuelt (én migration / insert-script)
- Indsæt `club_memberships(Axel, Tøyen, athlete, active)`
- Indsæt `coach_athletes(Ingunn, Axel, Tøyen)`
- `UPDATE profiles SET club_id = Tøyen WHERE user_id = Axel`

### 3. CreateAthleteDialog — bedre fejlhåndtering (lille UI-tweak)
Hvis `create-athlete` returnerer fejl pga. e-mail-konflikt (bruger findes allerede), vis tydelig besked: "Atleten findes — brug 'Tilføj med atlet-kode' i stedet" så coachen ikke ender med en orphan profil.

### Verifikation
- Re-test: Ingunn tilføjer en eksisterende atlet via kode → atleten skal øjeblikkeligt være i hendes klubliste, uden admin-skærm.
- Tjek at Axel nu vises i Tøyen-rosteren og kan logge ind uden pending-skærm.

### Det vi IKKE rører
- `create-athlete` (virker allerede korrekt — sætter is_approved, club_id, membership, coach-link).
- RLS-policies.
- Onboarding-flowet for atleter der selv har tilmeldt sig via invite (`apply_invite_to_my_profile` auto-godkender allerede).

## Spørgsmål inden jeg går videre
Vil du have at jeg også tilføjer en defensiv `UPDATE profiles SET is_approved=true` i `apply_invite_to_my_profile` RPC'en? Den auto-godkender allerede, men hvis du vil have ekstra bælte+seler på samme tur, kan jeg gøre det. Ellers holder jeg mig til de tre punkter ovenfor.