-- 1) Add columns (additive only)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_email text;
ALTER TABLE public.clubs    ADD COLUMN IF NOT EXISTS deleted_at  timestamptz;

-- 2) Backfill parent_email from latest consent_tokens.parent_email per athlete
WITH latest_tok AS (
  SELECT DISTINCT ON (ct.athlete_id)
    ct.athlete_id, ct.parent_email
  FROM public.consent_tokens ct
  WHERE ct.parent_email IS NOT NULL
    AND length(trim(ct.parent_email)) > 0
  ORDER BY ct.athlete_id, ct.created_at DESC
)
UPDATE public.profiles p
SET parent_email = lt.parent_email
FROM latest_tok lt
WHERE p.user_id = lt.athlete_id
  AND p.parent_email IS NULL;

-- 3) Fallback: consent_records.granted_by_email where relation = 'parent'
WITH latest_rec AS (
  SELECT DISTINCT ON (cr.athlete_id)
    cr.athlete_id, cr.granted_by_email
  FROM public.consent_records cr
  WHERE cr.granted_by_relation = 'parent'
    AND cr.granted_by_email IS NOT NULL
    AND length(trim(cr.granted_by_email)) > 0
  ORDER BY cr.athlete_id, cr.created_at DESC
)
UPDATE public.profiles p
SET parent_email = lr.granted_by_email
FROM latest_rec lr
WHERE p.user_id = lr.athlete_id
  AND p.parent_email IS NULL;