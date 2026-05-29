create table if not exists public.athlete_modules (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references auth.users(id) on delete cascade,
  coach_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default false,
  created_at timestamptz default now(),
  unique(athlete_id, module_key)
);

-- Grants: athletes read own, coaches manage their athletes
GRANT SELECT ON public.athlete_modules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_modules TO authenticated;
GRANT ALL ON public.athlete_modules TO service_role;

alter table public.athlete_modules enable row level security;

create policy "Athletes read own modules"
  on public.athlete_modules for select
  using (auth.uid() = athlete_id);

create policy "Coaches manage their athlete modules"
  on public.athlete_modules for all
  using (auth.uid() = coach_id);