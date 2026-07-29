CREATE TABLE public.admin_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  link_url text,
  audience text NOT NULL DEFAULT 'all',
  club_ids uuid[] NOT NULL DEFAULT '{}',
  sent_by uuid NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_announcements_audience_check CHECK (audience IN ('all','clubs','users'))
);

CREATE TABLE public.admin_announcement_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.admin_announcements(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_announcement_recipients_unique UNIQUE (announcement_id, recipient_id)
);

CREATE INDEX admin_announcement_recipients_idx
  ON public.admin_announcement_recipients (recipient_id, is_read, created_at DESC);

GRANT SELECT ON public.admin_announcements TO authenticated;
GRANT ALL ON public.admin_announcements TO service_role;
GRANT SELECT, UPDATE ON public.admin_announcement_recipients TO authenticated;
GRANT ALL ON public.admin_announcement_recipients TO service_role;

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_announcement_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all announcements"
  ON public.admin_announcements FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Recipients can view their announcements"
  ON public.admin_announcements FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_announcement_recipients r
    WHERE r.announcement_id = admin_announcements.id
      AND r.recipient_id = auth.uid()
  ));

CREATE POLICY "Recipients can view their announcement rows"
  ON public.admin_announcement_recipients FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id OR public.is_admin(auth.uid()));

CREATE POLICY "Recipients can mark announcements read"
  ON public.admin_announcement_recipients FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);