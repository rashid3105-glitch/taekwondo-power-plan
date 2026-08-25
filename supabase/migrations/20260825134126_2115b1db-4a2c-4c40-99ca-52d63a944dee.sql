CREATE OR REPLACE FUNCTION public.prevent_delete_team_with_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count FROM public.club_team_members WHERE team_id = OLD.id;
  IF _count > 0 THEN
    RAISE EXCEPTION 'TEAM_NOT_EMPTY: group still has % member(s)', _count
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delete_team_with_members ON public.club_teams;
CREATE TRIGGER trg_prevent_delete_team_with_members
BEFORE DELETE ON public.club_teams
FOR EACH ROW EXECUTE FUNCTION public.prevent_delete_team_with_members();