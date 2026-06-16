
-- 1. Add club_id to coach_athletes
ALTER TABLE public.coach_athletes
  ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE;

-- 2. Backfill club_id from athlete's primary profile.club_id
UPDATE public.coach_athletes ca
SET club_id = p.club_id
FROM public.profiles p
WHERE ca.athlete_id = p.user_id
  AND ca.club_id IS NULL
  AND p.club_id IS NOT NULL;

-- 3. Backfill club_memberships for all athletes that have a profiles.club_id but no active membership
INSERT INTO public.club_memberships (user_id, club_id, role_in_club, status)
SELECT p.user_id, p.club_id, 'athlete'::membership_role, 'active'::membership_status
FROM public.profiles p
WHERE p.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.club_memberships m
    WHERE m.user_id = p.user_id AND m.club_id = p.club_id AND m.role_in_club = 'athlete'
  )
ON CONFLICT DO NOTHING;

-- Also ensure coach_athletes link implies an active athlete membership in that club
INSERT INTO public.club_memberships (user_id, club_id, role_in_club, status)
SELECT DISTINCT ca.athlete_id, ca.club_id, 'athlete'::membership_role, 'active'::membership_status
FROM public.coach_athletes ca
WHERE ca.club_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Swap unique constraint: drop (coach_id, athlete_id) -> add (coach_id, athlete_id, club_id)
ALTER TABLE public.coach_athletes
  DROP CONSTRAINT IF EXISTS coach_athletes_coach_id_athlete_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS coach_athletes_coach_athlete_club_uniq
  ON public.coach_athletes (coach_id, athlete_id, COALESCE(club_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS coach_athletes_club_id_idx ON public.coach_athletes(club_id);

-- 5. RLS — let coaches insert via is_coach_of_club(club_id) (today only admin can insert)
DROP POLICY IF EXISTS "Coaches insert athletes in their club" ON public.coach_athletes;
CREATE POLICY "Coaches insert athletes in their club"
  ON public.coach_athletes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = coach_id
    AND club_id IS NOT NULL
    AND public.is_coach_of_club(club_id)
  );

-- Allow coaches to see all link rows for clubs where they are an active coach
DROP POLICY IF EXISTS "Coaches view links in their clubs" ON public.coach_athletes;
CREATE POLICY "Coaches view links in their clubs"
  ON public.coach_athletes
  FOR SELECT
  TO authenticated
  USING (club_id IS NOT NULL AND public.is_coach_of_club(club_id));

-- Allow coaches to delete athletes in clubs they coach (not just rows they own)
DROP POLICY IF EXISTS "Coaches delete links in their clubs" ON public.coach_athletes;
CREATE POLICY "Coaches delete links in their clubs"
  ON public.coach_athletes
  FOR DELETE
  TO authenticated
  USING (club_id IS NOT NULL AND public.is_coach_of_club(club_id));

-- 6. Per-club athlete count helper for license enforcement
CREATE OR REPLACE FUNCTION public.club_athlete_count(_club_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.club_memberships
  WHERE club_id = _club_id
    AND role_in_club = 'athlete'
    AND status = 'active'
$$;

GRANT EXECUTE ON FUNCTION public.club_athlete_count(uuid) TO authenticated, service_role;
