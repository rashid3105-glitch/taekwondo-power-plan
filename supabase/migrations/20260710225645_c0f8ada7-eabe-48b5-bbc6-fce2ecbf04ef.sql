
CREATE TABLE public.team_test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL,
  name text NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_mode text NOT NULL DEFAULT 'guided' CHECK (entry_mode IN ('guided','grid')),
  focus_areas text[] NOT NULL DEFAULT '{}'::text[],
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_test_session_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.team_test_sessions(id) ON DELETE CASCADE,
  test_id text NOT NULL,
  test_name text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_test_session_athletes (
  session_id uuid NOT NULL REFERENCES public.team_test_sessions(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, athlete_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_test_sessions TO authenticated;
GRANT ALL ON public.team_test_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_test_session_tests TO authenticated;
GRANT ALL ON public.team_test_session_tests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_test_session_athletes TO authenticated;
GRANT ALL ON public.team_test_session_athletes TO service_role;

ALTER TABLE public.team_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_test_session_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_test_session_athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage team sessions in their club"
  ON public.team_test_sessions FOR ALL TO authenticated
  USING (public.is_coach_of_club(club_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_coach_of_club(club_id));

CREATE POLICY "Athletes view sessions they are in"
  ON public.team_test_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_test_session_athletes a
      WHERE a.session_id = team_test_sessions.id AND a.athlete_id = auth.uid()
    )
  );

CREATE POLICY "Coaches manage session tests"
  ON public.team_test_session_tests FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.team_test_sessions s
            WHERE s.id = session_id
              AND (public.is_coach_of_club(s.club_id) OR public.is_superadmin(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_test_sessions s
            WHERE s.id = session_id AND public.is_coach_of_club(s.club_id))
  );

CREATE POLICY "Athletes view tests of their sessions"
  ON public.team_test_session_tests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_test_session_athletes a
      WHERE a.session_id = team_test_session_tests.session_id AND a.athlete_id = auth.uid()
    )
  );

CREATE POLICY "Coaches manage session athletes"
  ON public.team_test_session_athletes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.team_test_sessions s
            WHERE s.id = session_id
              AND (public.is_coach_of_club(s.club_id) OR public.is_superadmin(auth.uid())))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.team_test_sessions s
            WHERE s.id = session_id AND public.is_coach_of_club(s.club_id))
  );

CREATE POLICY "Athletes view their own membership"
  ON public.team_test_session_athletes FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());

CREATE TRIGGER team_test_sessions_updated_at
  BEFORE UPDATE ON public.team_test_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_team_test_sessions_club_date ON public.team_test_sessions(club_id, session_date DESC);
CREATE INDEX idx_team_test_session_tests_session ON public.team_test_session_tests(session_id, order_index);
CREATE INDEX idx_team_test_session_athletes_athlete ON public.team_test_session_athletes(athlete_id);

ALTER TABLE public.physical_test_results
  ADD COLUMN session_id uuid REFERENCES public.team_test_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_physical_test_results_session ON public.physical_test_results(session_id);
