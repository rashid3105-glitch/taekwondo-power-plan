
-- Club-wide read-only SELECT policies for coaches
-- Coaches can view profiles of all athletes in their club
CREATE POLICY "Coaches can view club member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND public.users_share_club(auth.uid(), user_id)
  AND user_id != auth.uid()
);

-- Coaches can view diary entries of all club members
CREATE POLICY "Coaches can view club member diary entries"
ON public.diary_entries
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND public.users_share_club(auth.uid(), user_id)
);

-- Coaches can view physical test results of all club members
CREATE POLICY "Coaches can view club member test results"
ON public.physical_test_results
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND public.users_share_club(auth.uid(), user_id)
);

-- Coaches can view training plans of all club members
CREATE POLICY "Coaches can view club member training plans"
ON public.training_plans
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND public.users_share_club(auth.uid(), user_id)
);

-- Coaches can view rehab plans of all club members
CREATE POLICY "Coaches can view club member rehab plans"
ON public.rehab_plans
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coach')
  AND public.users_share_club(auth.uid(), user_id)
);
