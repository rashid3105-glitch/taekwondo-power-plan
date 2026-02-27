
-- Allow coaches to update their athletes' profiles (e.g. weekly_schedule)
CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
    AND coach_athletes.athlete_id = profiles.user_id
  )
);

-- Allow coaches to view athlete rehab plans
CREATE POLICY "Coaches can view athlete rehab plans"
ON public.rehab_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
    AND coach_athletes.athlete_id = rehab_plans.user_id
  )
);

-- Allow coaches to insert rehab plans for athletes
CREATE POLICY "Coaches can insert athlete rehab plans"
ON public.rehab_plans
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
    AND coach_athletes.athlete_id = rehab_plans.user_id
  )
);

-- Allow coaches to update athlete rehab plans
CREATE POLICY "Coaches can update athlete rehab plans"
ON public.rehab_plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
    AND coach_athletes.athlete_id = rehab_plans.user_id
  )
);
