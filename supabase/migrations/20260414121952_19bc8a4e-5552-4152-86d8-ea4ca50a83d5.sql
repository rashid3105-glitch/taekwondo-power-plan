
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact form (no auth required)
CREATE POLICY "Anyone can insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only service role can read submissions
CREATE POLICY "Service role can read contact submissions"
ON public.contact_submissions
FOR SELECT
USING (auth.role() = 'service_role');

-- Only service role can delete
CREATE POLICY "Service role can delete contact submissions"
ON public.contact_submissions
FOR DELETE
USING (auth.role() = 'service_role');
