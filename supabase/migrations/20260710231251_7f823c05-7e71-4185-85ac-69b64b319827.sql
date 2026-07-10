
CREATE OR REPLACE FUNCTION public.is_athlete_in_team_session(_session_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_test_session_athletes
    WHERE session_id = _session_id AND athlete_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "Athletes view sessions they are in" ON public.team_test_sessions;
CREATE POLICY "Athletes view sessions they are in" ON public.team_test_sessions
FOR SELECT USING (public.is_athlete_in_team_session(id, auth.uid()));

DROP POLICY IF EXISTS "Athletes view tests of their sessions" ON public.team_test_session_tests;
CREATE POLICY "Athletes view tests of their sessions" ON public.team_test_session_tests
FOR SELECT USING (public.is_athlete_in_team_session(session_id, auth.uid()));
