DROP POLICY IF EXISTS "Linked parent creates consent" ON public.consent_records;
DROP POLICY IF EXISTS "Linked parent updates consent" ON public.consent_records;

CREATE POLICY "Linked parent creates consent"
ON public.consent_records
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_parent_of(auth.uid(), athlete_id)
  AND consent_type = 'health_data_processing'
  AND granted_by_relation = 'parent'
);

CREATE POLICY "Linked parent updates consent"
ON public.consent_records
FOR UPDATE
TO authenticated
USING (
  public.is_parent_of(auth.uid(), athlete_id)
  AND consent_type = 'health_data_processing'
)
WITH CHECK (
  public.is_parent_of(auth.uid(), athlete_id)
  AND consent_type = 'health_data_processing'
  AND granted_by_relation = 'parent'
);