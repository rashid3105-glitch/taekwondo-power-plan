## Diagnose

Jeg slog Danilo (TKD-987907) op i databasen og fandt:

- **Profil**: `b8247617-…`, primær klub = Copenhagen City.
- **`club_memberships`** for Danilo: KUN Copenhagen City. Ingen UC Copenhagen-medlemskab.
- **`coach_athletes`** for (Farooq, Danilo): to rækker — én med `club_id = Copenhagen City` og én **legacy-række med `club_id = NULL`**. Ingen række med `club_id = UC Copenhagen`.
- Farooq er aktiv `coach` i begge klubber, så han har ret til at tilføje.
- UC Copenhagen har 4/10 atleter — pladsproblem er ikke årsagen.
- **Ingen edge function-logs** findes for `add-athlete-by-code`, så enten blev funktionen aldrig kaldt for UC Copenhagen, eller den blev kaldt og fejlede tidligt uden `console.log`.

Konsekvensen er at edge-funktionens to skrivninger (`club_memberships`-upsert + `coach_athletes`-insert) aldrig nåede databasen for UC Copenhagen. Den nuværende funktion logger ingenting og returnerer kun fejltekst som UI'en viser flygtigt i en toast, så vi ved ikke hvor det gik galt.

Derudover forstyrrer den gamle `club_id = NULL`-række adfærden: den blokerer ikke for tilføjelsen, men den optræder i dashboard-queries (som henter `coach_athletes` uden klub-filter) og forplumrer signalet.

## Plan: en holdbar fix i tre lag

### 1) Ryd legacy-data op (migration / data-fix)

- **Slet alle `coach_athletes`-rækker hvor `club_id IS NULL`** og der findes mindst én anden række for samme (`coach_id`, `athlete_id`) med en gyldig `club_id`. Det er ren støj fra tiden før `coach_athletes` blev klub-stemplet.
- For de få rækker hvor `club_id IS NULL` står alene: backfill med atletens primære `profiles.club_id` så hver coach-atlet relation har en klub.
- **Tilføj UNIQUE constraint** `(coach_id, athlete_id, club_id)` der kræver `club_id IS NOT NULL` (drop det gamle COALESCE-baserede unique index). Så er det fysisk umuligt at få NULL-rækker fremover.
- **Tilføj fix-data for Danilo**: skriv den manglende `club_memberships`-række (UC Copenhagen, athlete, active) + `coach_athletes`-række (Farooq, Danilo, UC Copenhagen).

### 2) Gør `add-athlete-by-code` bulletproof + observerbar

I `supabase/functions/add-athlete-by-code/index.ts`:

- **Log hvert trin** med `console.log` (input klub-id, opslået atlet, cross-club tjek-resultat, count-limit-tjek, membership-upsert resultat, coach_athletes-insert resultat). Så har vi spor i fremtiden.
- **Strammere fejl-returnering**: hvis `club_memberships`-upsert returnerer fejl → returner 500 med klar besked. I dag ignoreres dens fejl (ingen `if (err) return`).
- **Verificer i samme request** at både `club_memberships` *og* `coach_athletes` faktisk findes efter skrivningerne, og returner først `ok: true` når begge er på plads. Hvis verifikation fejler → returner specifik fejlkode `VERIFY_FAILED` så UI kan vise den.
- **Idempotent oprydning**: når en atlet tilføjes til en konkret klub, slet automatisk evt. legacy `(coach, athlete, NULL)`-række så den ikke duplikerer fremover.
- **Returnér også `_club_id` og `_athlete_id`** i success-payload, så frontenden kan dobbelttjekke.

### 3) Sørg for at dashboardet altid afspejler resultatet

I `src/pages/CoachDashboard.tsx`:

- **Filtrer `coach_athletes`-SELECT på `club_id = activeClubId`** i `loadAthletes`, ikke kun det efterfølgende membership-filter. Det fjerner risikoen for at en "spøgelses-NULL-række" eller en anden klubs link sniger sig ind i `athleteIds`.
- **Reload-strategi efter add**: i stedet for blot at kalde `onCreated()` (som tilfældigvis er `loadAthletes`), gør `addByCode` til at: (a) toaste success, (b) sætte `activeClubId` til target-klubben hvis den var en anden, (c) trigge `loadAthletes(coachUserId, targetClubId)` med target-klubben (returneret fra edge function) — så vi 100% loader for den klub atleten lige blev føjet til.
- **Visuel bekræftelse**: hvis vi efter reload ikke kan se atleten i listen, vis en advarsel ("Atleten blev tilføjet, men kunne ikke vises — opdater siden eller skift klub"). Det fanger eventuelle race conditions.

I `src/components/coach/CreateAthleteDialog.tsx`:

- Brug `payload.club_id` returneret fra edge-funktionen til at sætte aktiv klub før reload (via `setActiveClubId` fra `useActiveClub`).
- Vis i success-toasten klub-navnet eksplicit ("Danilo blev tilføjet til UC Copenhagen").

## Tekniske detaljer

### Migration
```sql
-- 1a. Slet duplikerede legacy NULL-rækker
DELETE FROM public.coach_athletes ca_null
WHERE ca_null.club_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.coach_athletes ca_real
    WHERE ca_real.coach_id  = ca_null.coach_id
      AND ca_real.athlete_id = ca_null.athlete_id
      AND ca_real.club_id IS NOT NULL
  );

-- 1b. Backfill resterende NULL-rækker med atletens primære klub
UPDATE public.coach_athletes ca SET club_id = p.club_id
FROM public.profiles p
WHERE ca.club_id IS NULL AND p.user_id = ca.athlete_id AND p.club_id IS NOT NULL;

-- 1c. Slet de få rækker hvor atleten ingen primær klub har (umulige at scope)
DELETE FROM public.coach_athletes WHERE club_id IS NULL;

-- 1d. Strammere unique constraint (drop gammel COALESCE-baseret)
DROP INDEX IF EXISTS public.coach_athletes_coach_athlete_club_uniq;
ALTER TABLE public.coach_athletes ALTER COLUMN club_id SET NOT NULL;
CREATE UNIQUE INDEX coach_athletes_coach_athlete_club_uniq
  ON public.coach_athletes(coach_id, athlete_id, club_id);

-- 1e. Manuel fix for Danilo
INSERT INTO public.club_memberships (user_id, club_id, role_in_club, status)
VALUES ('b8247617-2a2d-4d7a-9b81-e5dced8a016d',
        '440ea492-d704-454b-971b-f2dd3d1028c7','athlete','active')
ON CONFLICT (user_id, club_id, role_in_club) DO UPDATE SET status='active';

INSERT INTO public.coach_athletes (coach_id, athlete_id, club_id)
VALUES ('117a7c4c-5cae-44cf-a5e3-0bee2d1cbb70',
        'b8247617-2a2d-4d7a-9b81-e5dced8a016d',
        '440ea492-d704-454b-971b-f2dd3d1028c7')
ON CONFLICT DO NOTHING;
```

### Edge function-tjekliste
- `console.log('add-athlete-by-code start', { code, clubId, callerId: user.id })`
- Returner `{ status, message }` på hver fejl-gren.
- `if (membershipErr) return json({ error: 'MEMBERSHIP_UPSERT_FAILED', detail: membershipErr.message }, 500)`.
- Efter inserts: `SELECT EXISTS` på begge rækker og returner `VERIFY_FAILED` hvis nej.

### Frontend
- `addByCode` modtager `payload.club_id` og kalder `setActiveClubId(payload.club_id)` før `await onCreated()`.
- `loadAthletes` ændrer linjen til:
  ```ts
  let q = supabase.from("coach_athletes").select("athlete_id").eq("club_id", clubId);
  ```

## Risiko & rollout

- Migration er destruktiv på `coach_athletes` (sletter NULL-rækker). Vi har allerede backup via PITR. Antallet af NULL-rækker er meget lavt (jeg så kun 1 i Danilos tilfælde).
- `ALTER COLUMN club_id SET NOT NULL` fejler hvis nogen NULL-rækker overlever — derfor backfill + slet før constraint sættes.
- Frontend-ændringen er bagudkompatibel; den filtrerer bare strammere serverside i stedet for klientside.

## Spørgsmål

Kører jeg det hele i én tur (migration + edge function + frontend), eller vil du have at jeg deler det i to: først migration + manuel data-fix for Danilo (så han er synlig med det samme), og bagefter edge function- og dashboard-hærdningen?
