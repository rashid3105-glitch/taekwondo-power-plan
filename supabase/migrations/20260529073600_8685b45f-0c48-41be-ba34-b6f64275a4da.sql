CREATE POLICY "Coaches manage own club module defaults"
  ON public.club_module_defaults FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.club_id = club_module_defaults.club_id
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coach'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.club_id = club_module_defaults.club_id
    )
  );

CREATE POLICY "Coaches manage athlete overrides in club"
  ON public.athlete_module_overrides FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'coach'::app_role)
    AND public.users_share_club(auth.uid(), user_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'coach'::app_role)
    AND public.users_share_club(auth.uid(), user_id)
  );