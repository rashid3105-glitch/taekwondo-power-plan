UPDATE public.retention_policies
SET warn_days = 14
WHERE category = 'left_club_health_data' AND warn_days <> 14;