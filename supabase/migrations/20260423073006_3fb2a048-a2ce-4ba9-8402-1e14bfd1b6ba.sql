-- Create landing_announcements table
CREATE TABLE public.landing_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text_en TEXT NOT NULL DEFAULT '',
  text_da TEXT NOT NULL DEFAULT '',
  text_sv TEXT NOT NULL DEFAULT '',
  text_de TEXT NOT NULL DEFAULT '',
  text_ar TEXT NOT NULL DEFAULT '',
  text_no TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '/help#changelog',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_announcements ENABLE ROW LEVEL SECURITY;

-- Public (incl. anon) can read active announcement
CREATE POLICY "Public can view active announcements"
ON public.landing_announcements
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Admins can read all (including inactive)
CREATE POLICY "Admins can view all announcements"
ON public.landing_announcements
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admins can insert
CREATE POLICY "Admins can insert announcements"
ON public.landing_announcements
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Admins can update
CREATE POLICY "Admins can update announcements"
ON public.landing_announcements
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Admins can delete
CREATE POLICY "Admins can delete announcements"
ON public.landing_announcements
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_landing_announcements_updated_at
BEFORE UPDATE ON public.landing_announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();