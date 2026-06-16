ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS license_active boolean NOT NULL DEFAULT false;
UPDATE public.clubs SET license_active = true WHERE id = '4b827e40-ff46-44a2-a1ba-2c87a8680756';