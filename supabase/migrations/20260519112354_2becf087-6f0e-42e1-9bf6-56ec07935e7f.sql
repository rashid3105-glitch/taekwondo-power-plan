CREATE POLICY "Coaches read parent links for their athletes"
ON public.parent_athletes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = parent_athletes.athlete_id
  )
);

CREATE POLICY "Club coaches read parent links for clubmates"
ON public.parent_athletes
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'coach'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  AND public.users_share_club(auth.uid(), parent_athletes.athlete_id)
);