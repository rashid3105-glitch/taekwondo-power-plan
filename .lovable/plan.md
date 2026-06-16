## Diagnose

En sikkerhedsaudit af RLS-policies viste at multi-club isolation **ikke** håndhæves i dag. Roden er to mønstre der bruges overalt:

1. **`users_share_club(a, b)`** joiner `profiles p1 ↔ p2` på `profiles.club_id` (én klub pr. bruger). Den ignorerer `club_memberships`, så en atlet med to klubber bliver behandlet som om hun kun har sin primære klub. Resultat: en coach i Klub A kan se data der hører til Klub B, hvis atletens `profiles.club_id` tilfældigvis matcher.
2. **`EXISTS coach_athletes WHERE coach_id=auth.uid() AND athlete_id=X`** uden `club_id`-filter. Selv efter at `coach_athletes` nu har `club_id`, scopes policies ikke til en bestemt klub.

Tilsammen betyder det at en coach der har Annamaria i Copenhagen City også ville kunne se workout-logs, dagbog, tests, planer osv. som er produceret i UC Copenhagen — og omvendt.

## Plan: tre faser

### Fase 1 — Kritiske policy/funktion-fixes (denne tur)

Lav én migration der:

1. **Omskriver `users_share_club`** til at bruge `club_memberships` (begge brugere aktive i samme `club_id`). Dette alene lukker en stor del af lækagen automatisk siden ~15 policies kalder den.
2. **Strammer `match_videos` SELECT** så club-coach-policy bruger `match_videos.club_id` via `is_coach_of_club(club_id)` i stedet for `users_share_club`.
3. **Strammer `diary_entries` SELECT** så coach-policy kræver `is_coach_of_club(diary_entries.club_id)` (klub-stemplet allerede via trigger).
4. **Strammer `form_curve_weekly` SELECT** på samme måde mod `form_curve_weekly.club_id`.
5. **Fjerner/strammer `profiles "Anyone can lookup by athlete_code" USING(true)`** så den ikke længere afslører hele profilen til alle autentificerede brugere. Erstattes med en SECURITY DEFINER RPC `lookup_public_profile_by_code(_code)` som kun returnerer `display_name`, `avatar_url`, `athlete_code`.
6. **Opdaterer `get_squad_overview`** til at tage `_club_id uuid` parameter og filtrere både `coach_athletes.club_id = _club_id` og `club_memberships`-medlemmer for den specifikke klub. Frontend skal sende `activeClubId` med.
7. **Opdaterer `get_athlete_recovery_trend` og `get_club_test_medians`** så deres SECURITY DEFINER-guards også kræver coach-membership i en *fælles aktiv klub* (via `club_memberships`).
8. **Strammer `can_chat_with`** så `coach_athletes`-grenen kræver at både coach og athlete har aktivt medlemskab i `coach_athletes.club_id`.

### Fase 2 — Tilføj `club_id` til athlete-data tabeller (efterfølgende tur)

For at opnå *per-row* klub-isolation skal data-rækker stemples med klub. Migration:

- Tilføj `club_id uuid REFERENCES public.clubs(id)` på:
  `workout_logs`, `readiness_checkins`, `physical_test_results`, `competitions`, `competition_reflections`, `training_plans`, `rehab_plans`, `nutrition_plans`, `health_data`, `wearable_daily_summary`, `session_attendance`, `event_reminders`, `workout_log_feedback`, `coach_athlete_notes`, `mental_assessments`.
- Tilføj `stamp_<table>_club_id()` BEFORE INSERT trigger der sætter `NEW.club_id = COALESCE(NEW.club_id, profiles.club_id_for_user(NEW.user_id))`. For nye records sætter klienten eksplicit `activeClubId`.
- Backfill: `UPDATE <table> SET club_id = (SELECT club_id FROM profiles WHERE profiles.user_id = <table>.user_id)` (best-effort — historiske rækker peger på atletens primære klub).
- Opdater alle coach-SELECT-policies til at kræve `is_coach_of_club(<table>.club_id)`.

### Fase 3 — Frontend klub-kontekst (efterfølgende tur)

- Alle queries/inserts fra coach-views skal sende `activeClubId` så data filtreres serverside.
- Alle nye athlete-skrivninger (workout_logs, diary, readiness osv.) skal sætte `club_id = profile.club_id` (atletens *aktive* klub for sessionen — i øjeblikket den primære, indtil vi giver atleten en aktivitets-klubvælger).
- `get_squad_overview(_club_id)`-kald i CoachDashboard skal sende `activeClubId`.

## Tekniske detaljer (Fase 1 SQL-skitse)

```sql
-- 1. Fix root function
CREATE OR REPLACE FUNCTION public.users_share_club(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.club_memberships m1
    JOIN public.club_memberships m2 ON m1.club_id = m2.club_id
    WHERE m1.user_id = _a AND m2.user_id = _b
      AND m1.status = 'active' AND m2.status = 'active'
  )
$$;

-- 2-4. Tighten policies on stamped tables
DROP POLICY "Coaches can view club member diary entries" ON public.diary_entries;
CREATE POLICY "Coaches view club-stamped diary entries"
  ON public.diary_entries FOR SELECT
  USING (club_id IS NOT NULL AND public.is_coach_of_club(club_id));

-- 5. Lock down profile public lookup
DROP POLICY "Anyone can lookup by athlete_code" ON public.profiles;
CREATE OR REPLACE FUNCTION public.lookup_public_profile_by_code(_code text)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, athlete_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, display_name, avatar_url, athlete_code
  FROM public.profiles WHERE athlete_code = upper(_code) LIMIT 1
$$;

-- 6. get_squad_overview gets _club_id
DROP FUNCTION public.get_squad_overview(uuid);
CREATE FUNCTION public.get_squad_overview(_coach_id uuid, _club_id uuid) ... 
  -- guard: is_coach_of_club(_club_id)
  -- athletes from coach_athletes WHERE club_id = _club_id
  --                UNION club_memberships WHERE club_id = _club_id

-- 8. can_chat_with via club_memberships
CREATE OR REPLACE FUNCTION public.can_chat_with(_a uuid, _b uuid) ... 
  -- coach_athletes branch joins club_memberships on both sides
```

## Risiko & rollout

- Fase 1 er **bagudkompatibel** for data-læsning men kræver at **`get_squad_overview`-kald i frontenden tilføjer `activeClubId`**. Jeg opdaterer kaldene i samme tur. Forventet berørte filer: `src/pages/CoachDashboard.tsx`, `src/pages/CoachToday.tsx`, evt. `useThreads`-hooks.
- Fase 1 vil få `profiles`-lookup via `athlete_code` til at fejle for klienter der ikke skifter til den nye RPC; jeg tjekker callsites og opdaterer dem (typisk `JoinInvite`, `AddAthleteByCode`).
- Fase 2 er den store; vi kan vente og se hvor langt Fase 1 rækker før vi skalerer.

## Spørgsmål

1. **Skal jeg køre Fase 1 nu?** (Migration + frontend-callsite opdateringer i én tur.)
2. **Fase 2 senere?** Den indebærer schema-ændring på 15 tabeller + backfill — vil du gerne gå hele vejen for ægte per-row klub-isolation, eller stoppe ved Fase 1 og acceptere at *delte* atleter (samme atlet i to klubber) bliver fuldt synlige for begge klubs coaches?
