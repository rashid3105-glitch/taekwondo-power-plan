
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Add athlete_code to profiles
ALTER TABLE public.profiles ADD COLUMN athlete_code text UNIQUE;

-- 5. Auto-generate athlete_code trigger
CREATE OR REPLACE FUNCTION public.generate_athlete_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.athlete_code IS NULL THEN
    NEW.athlete_code := 'TKD-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_athlete_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_athlete_code();

-- 6. Generate codes for existing profiles
UPDATE public.profiles 
SET athlete_code = 'TKD-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0') 
WHERE athlete_code IS NULL;

-- 7. Create coach_athletes table
CREATE TABLE public.coach_athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coach_id, athlete_id)
);

ALTER TABLE public.coach_athletes ENABLE ROW LEVEL SECURITY;

-- 8. RLS on user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 9. RLS on coach_athletes
CREATE POLICY "Coaches can view their athletes" ON public.coach_athletes
  FOR SELECT TO authenticated USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can add athletes" ON public.coach_athletes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id AND public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can remove athletes" ON public.coach_athletes
  FOR DELETE TO authenticated USING (auth.uid() = coach_id);

-- 10. Coaches can view athlete profiles
CREATE POLICY "Coaches can view athlete profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.coach_athletes WHERE coach_id = auth.uid() AND athlete_id = profiles.user_id)
  );

-- 11. Coaches can create/view/update plans for their athletes
CREATE POLICY "Coaches can create plans for athletes" ON public.training_plans
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.coach_athletes WHERE coach_id = auth.uid() AND athlete_id = training_plans.user_id)
  );

CREATE POLICY "Coaches can view athlete plans" ON public.training_plans
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.coach_athletes WHERE coach_id = auth.uid() AND athlete_id = training_plans.user_id)
  );

CREATE POLICY "Coaches can update athlete plans" ON public.training_plans
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.coach_athletes WHERE coach_id = auth.uid() AND athlete_id = training_plans.user_id)
  );

-- 12. Seed admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'rashid3105@gmail.com'
ON CONFLICT DO NOTHING;
