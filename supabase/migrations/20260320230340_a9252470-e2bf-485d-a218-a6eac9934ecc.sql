
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can lookup by athlete_code" ON public.profiles;

-- Create a security definer function for safe athlete code lookups
-- Returns only user_id (no sensitive data exposed)
CREATE OR REPLACE FUNCTION public.lookup_athlete_by_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.profiles
  WHERE athlete_code = upper(_code)
  LIMIT 1
$$;
