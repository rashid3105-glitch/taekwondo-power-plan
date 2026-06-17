ALTER TABLE public.session_attendance DROP CONSTRAINT IF EXISTS session_attendance_coach_id_athlete_id_session_date_key;
DROP INDEX IF EXISTS public.session_attendance_coach_athlete_date_uk;
-- Deduplicate any existing rows for the same athlete+date, keep newest
DELETE FROM public.session_attendance a
USING public.session_attendance b
WHERE a.athlete_id = b.athlete_id
  AND a.session_date = b.session_date
  AND a.created_at < b.created_at;
CREATE UNIQUE INDEX IF NOT EXISTS session_attendance_athlete_date_uk
  ON public.session_attendance (athlete_id, session_date);