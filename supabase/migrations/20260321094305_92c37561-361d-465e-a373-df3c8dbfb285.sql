
-- Security definer function to get protected profile fields without triggering RLS
CREATE OR REPLACE FUNCTION public.get_profile_protected_fields(_user_id uuid)
RETURNS TABLE(is_approved boolean, payment_status text, payment_date date, is_demo boolean, club_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.is_approved, p.payment_status, p.payment_date, p.is_demo, p.club_id
  FROM public.profiles p
  WHERE p.user_id = _user_id
  LIMIT 1
$$;

-- Drop and recreate the problematic UPDATE policies

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_approved = (SELECT f.is_approved FROM public.get_profile_protected_fields(auth.uid()) f)
  AND payment_status = (SELECT f.payment_status FROM public.get_profile_protected_fields(auth.uid()) f)
  AND NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM public.get_profile_protected_fields(auth.uid()) f))
  AND is_demo = (SELECT f.is_demo FROM public.get_profile_protected_fields(auth.uid()) f)
  AND NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM public.get_profile_protected_fields(auth.uid()) f))
);

DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;
CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
    AND coach_athletes.athlete_id = profiles.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
    AND coach_athletes.athlete_id = profiles.user_id
  )
  AND is_approved = (SELECT f.is_approved FROM public.get_profile_protected_fields(profiles.user_id) f)
  AND payment_status = (SELECT f.payment_status FROM public.get_profile_protected_fields(profiles.user_id) f)
  AND NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM public.get_profile_protected_fields(profiles.user_id) f))
  AND is_demo = (SELECT f.is_demo FROM public.get_profile_protected_fields(profiles.user_id) f)
);
