CREATE TABLE public.compliance_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  club_id uuid,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  due_date date,
  period_key text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT compliance_alerts_type_check CHECK (alert_type IN ('gal_license','myfightbook','antidoping')),
  CONSTRAINT compliance_alerts_severity_check CHECK (severity IN ('warning','expired','missing')),
  CONSTRAINT compliance_alerts_unique UNIQUE (recipient_id, athlete_id, alert_type, period_key)
);

CREATE INDEX compliance_alerts_recipient_idx ON public.compliance_alerts (recipient_id, is_read, created_at DESC);

GRANT SELECT, UPDATE ON public.compliance_alerts TO authenticated;
GRANT ALL ON public.compliance_alerts TO service_role;

ALTER TABLE public.compliance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recipients can view their compliance alerts"
ON public.compliance_alerts FOR SELECT TO authenticated
USING (auth.uid() = recipient_id OR public.is_superadmin(auth.uid()));

CREATE POLICY "Recipients can mark their compliance alerts read"
ON public.compliance_alerts FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);