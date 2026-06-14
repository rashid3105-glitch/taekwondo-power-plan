INSERT INTO public.consent_records (athlete_id, consent_type, status, granted_by_relation, grace_until, club_id)
SELECT p.user_id, 'health_data_processing', 'pending', 'self', now() + interval '30 days', p.club_id
FROM public.profiles p
WHERE (p.role = 'athlete' OR p.active_role = 'athlete')
  AND (
    (p.birth_date IS NOT NULL AND date_part('year', age(p.birth_date)) >= 18)
    OR (p.birth_date IS NULL AND p.age IS NOT NULL AND p.age >= 18)
    OR (p.birth_date IS NULL AND p.age IS NULL)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.consent_records cr
    WHERE cr.athlete_id = p.user_id AND cr.consent_type = 'health_data_processing'
  )
ON CONFLICT (athlete_id, consent_type) DO NOTHING;