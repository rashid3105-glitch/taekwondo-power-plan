## Hvad skete der?
Anna-Marias 15. juni-indslag (og 2 andre) blev gemt med `club_id = NULL`. Coach-views filtrerede dem væk. Backfill + null-tolerant query er allerede kørt — de 3 gamle rækker er nu synlige.

## Hvorfor kan det ske igen?
`Diary.tsx` linje 220 stamper med `activeClubId ?? null`. Hvis `ActiveClubContext` endnu ikke har loadet (race), eller hvis indslaget oprettes offline før konteksten er klar, ryger der `null` ind. Sync-engine respekterer det — den tilføjer kun `club_id` hvis det allerede står på intent'en. Så fejlen kan gentage sig på enhver klient.

Samme mønster findes potentielt på andre offline-tabeller (readiness, workout_logs, mental_assessments, physical_tests), men dagbog er den eneste der pt. har null-rækker — så vi løser kilden ét sted.

## Plan (1 trin, database-trigger)

Tilføj `BEFORE INSERT` trigger på `public.diary_entries` der auto-stamper `club_id` fra `profiles.club_id`, hvis NEW.club_id er NULL:

```sql
CREATE OR REPLACE FUNCTION public.stamp_diary_club_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NULL THEN
    SELECT club_id INTO NEW.club_id
    FROM public.profiles
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER diary_entries_stamp_club_id
BEFORE INSERT ON public.diary_entries
FOR EACH ROW EXECUTE FUNCTION public.stamp_diary_club_id();
```

Robust uanset om indslaget kommer fra web, offline-sync, edge function eller fremtidig RN-klient. Klientens `activeClubId ?? null` bliver irrelevant — serveren retter det.

## Hvad ændres ikke
- Klient-koden i `Diary.tsx` (uændret — fungerer stadig som hurtig hint når kontext er klar)
- Coach-queries (null-tolerant or-filter beholdes som ekstra sikkerhed)
- Andre tabeller (kan overvejes senere hvis samme symptom dukker op)

Ingen Help.tsx, ingen changelog.