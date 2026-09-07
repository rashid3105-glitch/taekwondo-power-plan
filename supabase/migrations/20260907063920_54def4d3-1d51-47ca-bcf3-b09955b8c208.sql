CREATE OR REPLACE FUNCTION public.prepare_training_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _club uuid;
BEGIN
  SELECT p.club_id INTO _club FROM public.profiles p WHERE p.user_id = NEW.athlete_user_id;
  IF _club IS NULL THEN
    SELECT m.club_id INTO _club
    FROM public.club_memberships m
    WHERE m.user_id = NEW.athlete_user_id
      AND m.status = 'active'
    ORDER BY (m.role_in_club = 'athlete') DESC
    LIMIT 1;
  END IF;
  NEW.club_id := _club;
  IF NEW.status <> 'cleared_with_limits' THEN NEW.limitations := NULL; END IF;
  NEW.recorded_by := auth.uid();
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.prepare_training_status() FROM PUBLIC, anon, authenticated;