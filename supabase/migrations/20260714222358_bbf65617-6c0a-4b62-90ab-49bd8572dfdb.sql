
-- club_directory has its own WHERE clause (auth.uid() shares club, or is coach/parent of the user)
-- but running as security_invoker made athletes' profile RLS block every row except their own.
-- Switching to security_definer lets the view's own visibility rules take effect for all callers.
ALTER VIEW public.club_directory SET (security_invoker = false);
