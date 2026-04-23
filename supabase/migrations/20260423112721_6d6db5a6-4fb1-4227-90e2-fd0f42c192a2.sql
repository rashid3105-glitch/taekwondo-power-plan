-- Add demo_expires_at column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS demo_expires_at DATE;

-- Drop dependent policies first so the function can be replaced
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can update athlete profiles" ON public.profiles;

-- Drop and recreate function with new return type
DROP FUNCTION IF EXISTS public.get_profile_protected_fields(uuid);

CREATE FUNCTION public.get_profile_protected_fields(_user_id uuid)
 RETURNS TABLE(is_approved boolean, payment_status text, payment_date date, is_demo boolean, club_id uuid, demo_full_access boolean, demo_expires_at date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.is_approved, p.payment_status, p.payment_date, p.is_demo, p.club_id, p.demo_full_access, p.demo_expires_at
  FROM public.profiles p
  WHERE p.user_id = _user_id
  LIMIT 1
$function$;

-- Recreate user UPDATE policy
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
  AND (NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
  AND (NOT (demo_expires_at IS DISTINCT FROM (SELECT f.demo_expires_at FROM get_profile_protected_fields(auth.uid()) f LIMIT 1)))
);

-- Recreate coach UPDATE policy
CREATE POLICY "Coaches can update athlete profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM coach_athletes WHERE coach_athletes.coach_id = auth.uid() AND coach_athletes.athlete_id = profiles.user_id)
)
WITH CHECK (
  (EXISTS (SELECT 1 FROM coach_athletes WHERE coach_athletes.coach_id = auth.uid() AND coach_athletes.athlete_id = profiles.user_id))
  AND (is_approved = (SELECT f.is_approved FROM get_profile_protected_fields(profiles.user_id) f))
  AND (payment_status = (SELECT f.payment_status FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (payment_date IS DISTINCT FROM (SELECT f.payment_date FROM get_profile_protected_fields(profiles.user_id) f)))
  AND (is_demo = (SELECT f.is_demo FROM get_profile_protected_fields(profiles.user_id) f))
  AND (demo_full_access = (SELECT f.demo_full_access FROM get_profile_protected_fields(profiles.user_id) f))
  AND (NOT (club_id IS DISTINCT FROM (SELECT f.club_id FROM get_profile_protected_fields(profiles.user_id) f)))
  AND (NOT (demo_expires_at IS DISTINCT FROM (SELECT f.demo_expires_at FROM get_profile_protected_fields(profiles.user_id) f)))
);

-- Delete all clubs with no members
DELETE FROM public.clubs c
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.club_id = c.id);