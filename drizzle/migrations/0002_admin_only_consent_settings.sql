DROP POLICY IF EXISTS "Signed-in users can read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Signed-in users can read digital consent ages" ON public.digital_consent_ages;
CREATE POLICY "Admins can read digital consent ages" ON public.digital_consent_ages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));