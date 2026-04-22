CREATE UNIQUE INDEX IF NOT EXISTS session_attendance_coach_athlete_date_uk
ON public.session_attendance (coach_id, athlete_id, session_date);