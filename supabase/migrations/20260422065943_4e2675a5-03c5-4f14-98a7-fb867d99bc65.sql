CREATE TABLE public.coach_athlete_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

ALTER TABLE public.coach_athlete_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own notes"
  ON public.coach_athlete_notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role))
  WITH CHECK (auth.uid() = coach_id AND has_role(auth.uid(), 'coach'::app_role));

CREATE TRIGGER trg_coach_notes_updated_at
  BEFORE UPDATE ON public.coach_athlete_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('present','absent','late')),
  rpe integer CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id, session_date)
);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage attendance for own athletes"
  ON public.session_attendance
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = coach_id
    AND has_role(auth.uid(), 'coach'::app_role)
    AND (
      EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = session_attendance.athlete_id)
      OR users_share_club(auth.uid(), athlete_id)
    )
  )
  WITH CHECK (
    auth.uid() = coach_id
    AND has_role(auth.uid(), 'coach'::app_role)
    AND (
      EXISTS (SELECT 1 FROM public.coach_athletes ca WHERE ca.coach_id = auth.uid() AND ca.athlete_id = session_attendance.athlete_id)
      OR users_share_club(auth.uid(), athlete_id)
    )
  );

CREATE POLICY "Athletes view own attendance"
  ON public.session_attendance
  FOR SELECT
  TO authenticated
  USING (auth.uid() = athlete_id);

CREATE TRIGGER trg_session_attendance_updated_at
  BEFORE UPDATE ON public.session_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_session_attendance_coach_date ON public.session_attendance(coach_id, session_date);