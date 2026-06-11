ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS default_weekly_schedule jsonb;

CREATE OR REPLACE FUNCTION public.set_club_default_weekly_schedule(_club_id uuid, _schedule jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT (public.is_coach_of_club(_club_id) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  UPDATE public.clubs SET default_weekly_schedule = _schedule WHERE id = _club_id;
END;
$$;