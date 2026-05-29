ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'athlete';

UPDATE public.profiles
SET role = 'coach'
WHERE active_role = 'coach' OR 'coach' = ANY(COALESCE(roles, ARRAY[]::text[]));