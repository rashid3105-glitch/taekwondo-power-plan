ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['athlete'],
ADD COLUMN IF NOT EXISTS active_role text DEFAULT 'athlete';

-- Eksisterende rækker får defaults automatisk, men sikr os at profiles med coach/parent/admin allerede
-- fra user_roles-tabellen får korrekte værdier.
UPDATE public.profiles
SET roles = ARRAY['athlete']
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

UPDATE public.profiles
SET active_role = 'athlete'
WHERE active_role IS NULL;
