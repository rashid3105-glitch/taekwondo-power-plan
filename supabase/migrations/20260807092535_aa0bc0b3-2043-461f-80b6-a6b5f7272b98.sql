ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'taekwondo';
UPDATE public.clubs SET sport = 'taekwondo' WHERE sport IS NULL;