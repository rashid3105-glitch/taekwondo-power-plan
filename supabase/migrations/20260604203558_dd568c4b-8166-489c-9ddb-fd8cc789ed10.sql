CREATE TABLE public.supplement_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id),
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  input_type text NOT NULL CHECK (input_type IN ('text','image')),
  product_name text,
  extracted_substances jsonb,
  flag_status text NOT NULL CHECK (flag_status IN ('green','yellow','red')),
  age_band text CHECK (age_band IN ('under13','13_17','18plus')),
  result_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.supplement_checks TO authenticated;
GRANT ALL ON public.supplement_checks TO service_role;

ALTER TABLE public.supplement_checks ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_supplement_checks_user ON public.supplement_checks (user_id, created_at DESC);
CREATE INDEX idx_supplement_checks_club_flag ON public.supplement_checks (club_id, flag_status, created_at DESC);

CREATE POLICY "Athlete or parent inserts check"
  ON public.supplement_checks FOR INSERT
  TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND (
      user_id = auth.uid()
      OR public.is_parent_of(auth.uid(), user_id)
    )
  );

CREATE POLICY "Athlete reads own checks"
  ON public.supplement_checks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parent reads child checks"
  ON public.supplement_checks FOR SELECT
  TO authenticated
  USING (public.is_parent_of(auth.uid(), user_id));

CREATE POLICY "Coach reads flagged club checks"
  ON public.supplement_checks FOR SELECT
  TO authenticated
  USING (
    flag_status IN ('yellow','red')
    AND public.is_coach_of_club(club_id)
  );
