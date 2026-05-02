-- 1. Add toggle column
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS share_coach_notes boolean NOT NULL DEFAULT false;

-- 2. Helper: does a club have shared coach notes enabled?
CREATE OR REPLACE FUNCTION public.club_shares_coach_notes(_club_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT share_coach_notes FROM public.clubs WHERE id = _club_id),
    false
  )
$$;

-- 3. Extra SELECT policy: coaches in the same club can read each other's notes
--    when the club has sharing enabled and the athlete is also in that club.
CREATE POLICY "Club coaches can view shared notes"
  ON public.coach_athlete_notes
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'coach'::app_role)
    AND auth.uid() <> coach_id
    AND users_share_club(auth.uid(), coach_id)
    AND users_share_club(auth.uid(), athlete_id)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.club_id IS NOT NULL
        AND public.club_shares_coach_notes(p.club_id)
    )
  );
