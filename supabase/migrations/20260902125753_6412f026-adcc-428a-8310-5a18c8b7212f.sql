revoke all on function public.is_club_admin(uuid) from public, anon;
grant execute on function public.is_club_admin(uuid) to authenticated, service_role;