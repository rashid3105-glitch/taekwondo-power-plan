
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending_verification',
  verification_token text,
  token_expires_at timestamptz,
  verified_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_comments_post_status_idx ON public.blog_comments(post_id, status);
CREATE INDEX blog_comments_token_idx ON public.blog_comments(verification_token);

GRANT SELECT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all blog comments"
  ON public.blog_comments FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update blog comments"
  ON public.blog_comments FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog comments"
  ON public.blog_comments FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_blog_comments(_post_id uuid)
RETURNS TABLE(id uuid, author_name text, content text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, author_name, content, created_at
  FROM public.blog_comments
  WHERE post_id = _post_id AND status = 'approved'
  ORDER BY created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_blog_comments(uuid) TO anon, authenticated;
