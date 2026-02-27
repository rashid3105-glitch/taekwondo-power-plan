
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Auto-approve the admin user
UPDATE public.profiles SET is_approved = true WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'rashid3105@gmail.com' LIMIT 1
);

-- Create function to check admin status (by email)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = _user_id AND email = 'rashid3105@gmail.com'
  )
$$;

-- Create function to auto-approve admin on signup trigger
CREATE OR REPLACE FUNCTION public.auto_approve_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'rashid3105@gmail.com' THEN
    UPDATE public.profiles SET is_approved = true WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- RLS policy: allow admin to read all profiles (for approval page)
CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS policy: allow admin to update all profiles (for approval)
CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));
