CREATE OR REPLACE FUNCTION public.ensure_club_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.club_id IS NOT NULL AND COALESCE(NEW.is_approved, false) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.club_memberships m
      WHERE m.user_id = NEW.user_id AND m.club_id = NEW.club_id
    ) THEN
      INSERT INTO public.club_memberships (user_id, club_id, role_in_club, status)
      VALUES (NEW.user_id, NEW.club_id, 'athlete', 'active')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_club_membership_trg ON public.profiles;
CREATE TRIGGER ensure_club_membership_trg
AFTER INSERT OR UPDATE OF club_id, is_approved ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_club_membership();