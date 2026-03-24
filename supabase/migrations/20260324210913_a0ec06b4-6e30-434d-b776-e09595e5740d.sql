
-- Step 1: Add column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS demo_full_access boolean NOT NULL DEFAULT false;

-- Step 2: Drop dependent policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;

-- Step 3: Drop and recreate function with new return type
DROP FUNCTION IF EXISTS public.get_profile_protected_fields(uuid);

CREATE FUNCTION public.get_profile_protected_fields(_user_id uuid)
 RETURNS TABLE(is_approved boolean, payment_status text, payment_date date, is_demo boolean, club_id uuid, demo_full_access boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.is_approved, p.payment_status, p.payment_date, p.is_demo, p.club_id, p.demo_full_access
  FROM public.profiles p
  WHERE p.user_id = _user_id
  LIMIT 1
$$;

-- Step 4: Recreate user update policy
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (demo_full_access = (SELECT f.demo_full_access FROM get_profile_protected_fields(auth.uid()) f LIMIT 1))
  AND (
    ((SELECT f.club_id FROM get_profile_protected_fields(auth.uid()) f LIMIT 1) IS NULL)
    OR (NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
  )
);

-- Step 5: Recreate coaches update policy
CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
WITH CHECK (
  (EXISTS (SELECT 1 FROM coach_athletes WHERE coach_athletes.coach_id = auth.uid() AND coach_athletes.athlete_id = profiles.user_id))
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(profiles.user_id) f))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(profiles.user_id) f)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(profiles.user_id) f))
  AND (demo_full_access = (SELECT f.demo_full_access FROM get_profile_protected_fields(profiles.user_id) f))
);
