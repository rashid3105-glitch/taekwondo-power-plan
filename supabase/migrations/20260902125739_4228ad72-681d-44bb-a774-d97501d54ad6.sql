-- 1. Prevent coaches from granting/keeping 'admin' role in a club unless they are already a club admin
create or replace function public.is_club_admin(_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_memberships cm
    where cm.club_id = _club_id
      and cm.user_id = auth.uid()
      and cm.role_in_club = 'admin'
  ) or public.has_role(auth.uid(), 'admin'::app_role)
    or public.is_superadmin(auth.uid());
$$;

drop policy if exists "coach inserts club memberships" on public.club_memberships;
create policy "coach inserts club memberships"
on public.club_memberships for insert to authenticated
with check (
  is_coach_of_club(club_id)
  and (role_in_club is distinct from 'admin' or public.is_club_admin(club_id))
);

drop policy if exists "coach updates club memberships" on public.club_memberships;
create policy "coach updates club memberships"
on public.club_memberships for update to authenticated
using (is_coach_of_club(club_id))
with check (
  is_coach_of_club(club_id)
  and (role_in_club is distinct from 'admin' or public.is_club_admin(club_id))
);

-- 2. Scope competition invitation storage writes to the uploading coach's own objects
drop policy if exists "Coaches can upload competition invitations" on storage.objects;
create policy "Coaches can upload competition invitations"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'competition-invitations'
  and (storage.foldername(name))[1] = (auth.uid())::text
  and (
    has_role(auth.uid(), 'admin'::app_role)
    or (
      has_role(auth.uid(), 'coach'::app_role)
      and exists (select 1 from public.coach_athletes ca where ca.coach_id = auth.uid())
    )
  )
);

drop policy if exists "Uploaders can delete their competition invitations" on storage.objects;
create policy "Uploaders can delete their competition invitations"
on storage.objects for delete to authenticated
using (
  bucket_id = 'competition-invitations'
  and (storage.foldername(name))[1] = (auth.uid())::text
  and (owner = auth.uid() or owner is null or has_role(auth.uid(), 'admin'::app_role))
);