CREATE TYPE public.training_status AS ENUM ('cleared', 'cleared_with_limits', 'not_cleared');

CREATE TABLE public.athlete_training_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_user_id uuid NOT NULL,
  club_id uuid,
  status public.training_status NOT NULL,
  limitations text CHECK (limitations IS NULL OR char_length(limitations) <= 300),
  review_date date,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX athlete_training_status_athlete_idx
  ON public.athlete_training_status (athlete_user_id, created_at DESC);
CREATE INDEX athlete_training_status_club_idx
  ON public.athlete_training_status (club_id);

GRANT SELECT, INSERT ON public.athlete_training_status TO authenticated;
GRANT ALL ON public.athlete_training_status TO service_role;

ALTER TABLE public.athlete_training_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_status_select" ON public.athlete_training_status
  FOR SELECT TO authenticated
  USING (
    athlete_user_id = auth.uid()
    OR public.is_parent_of(auth.uid(), athlete_user_id)
    OR (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
  );

CREATE POLICY "training_status_insert" ON public.athlete_training_status
  FOR INSERT TO authenticated
  WITH CHECK (
    recorded_by = auth.uid()
    AND (
      athlete_user_id = auth.uid()
      OR public.is_parent_of(auth.uid(), athlete_user_id)
      OR (club_id IS NOT NULL AND public.is_coach_of_club(club_id))
    )
  );

CREATE OR REPLACE FUNCTION public.prepare_training_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT p.club_id INTO NEW.club_id
  FROM public.profiles p
  WHERE p.user_id = NEW.athlete_user_id;

  IF NEW.status <> 'cleared_with_limits' THEN
    NEW.limitations := NULL;
  END IF;

  NEW.recorded_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER athlete_training_status_prepare
BEFORE INSERT ON public.athlete_training_status
FOR EACH ROW EXECUTE FUNCTION public.prepare_training_status();