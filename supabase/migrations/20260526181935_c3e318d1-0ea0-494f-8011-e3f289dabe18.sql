
-- Restrict clubs SELECT to members, coaches in the club, or admins
DROP POLICY IF EXISTS "Authenticated users can view clubs" ON public.clubs;

CREATE POLICY "Members, coaches and admins can view clubs"
ON public.clubs
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.club_id = clubs.id
  )
);

-- Allow athletes to view coach comments left on their own reflections
CREATE POLICY "Athletes view comments on own reflections"
ON public.coach_reflection_comments
FOR SELECT
TO authenticated
USING (auth.uid() = athlete_id);
