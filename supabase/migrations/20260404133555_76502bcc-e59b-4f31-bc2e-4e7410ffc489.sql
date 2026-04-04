
-- Create a security definer function that returns only non-sensitive profile fields
-- for club members (excludes payment_status, payment_date, is_approved, is_demo, demo_full_access)
CREATE OR REPLACE FUNCTION public.get_club_member_profiles(_club_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  athlete_code text,
  age integer,
  weight_kg numeric,
  belt_level text,
  experience_years integer,
  goals text[],
  tkd_sessions_per_week integer,
  current_injury text,
  program_weeks integer,
  weekly_schedule jsonb,
  avatar_url text,
  discipline text,
  club_id uuid,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id, p.display_name, p.athlete_code, p.age, p.weight_kg,
    p.belt_level, p.experience_years, p.goals, p.tkd_sessions_per_week,
    p.current_injury, p.program_weeks, p.weekly_schedule, p.avatar_url,
    p.discipline, p.club_id, p.country
  FROM public.profiles p
  WHERE p.club_id = _club_id
    AND has_role(auth.uid(), 'coach')
    AND EXISTS (
      SELECT 1 FROM public.profiles cp
      WHERE cp.user_id = auth.uid() AND cp.club_id = _club_id
    )
$$;

-- Drop the overly broad club member SELECT policy
DROP POLICY IF EXISTS "Coaches can view club member profiles" ON public.profiles;
