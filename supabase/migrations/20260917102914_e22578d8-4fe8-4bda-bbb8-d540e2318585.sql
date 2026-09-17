ALTER TABLE public.club_memberships ADD COLUMN IF NOT EXISTS ended_at timestamptz;

COMMENT ON COLUMN public.club_memberships.ended_at IS
  'Timestamp the membership was set to removed. Drives the 90-day health-data retention for athletes who left the club.';

CREATE OR REPLACE FUNCTION public.stamp_membership_ended_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'removed' AND (OLD.status IS DISTINCT FROM 'removed') THEN
    NEW.ended_at := now();
  ELSIF NEW.status <> 'removed' THEN
    NEW.ended_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_membership_ended_at ON public.club_memberships;
CREATE TRIGGER trg_stamp_membership_ended_at
BEFORE UPDATE ON public.club_memberships
FOR EACH ROW EXECUTE FUNCTION public.stamp_membership_ended_at();

UPDATE public.club_memberships
SET ended_at = now()
WHERE status = 'removed' AND ended_at IS NULL;