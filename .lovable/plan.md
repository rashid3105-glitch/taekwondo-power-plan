## Real fix: let coaches/admins read parent links for their athletes

### Root cause (verified)

`parent_athletes` SELECT policy:
```
parent_user_id = auth.uid() OR athlete_id = auth.uid()
```
Coaches and admins are blocked. So `getChattableContacts()` (and the recently-added club/admin parent queries) silently return empty arrays for Farooq, and Laila Rashid never appears in "Tilføj personer".

### Fix — DB migration

Add two SELECT policies to `parent_athletes`:

1. **Coach of the athlete**
```sql
CREATE POLICY "Coaches read parent links for their athletes"
ON public.parent_athletes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes ca
    WHERE ca.coach_id = auth.uid()
      AND ca.athlete_id = parent_athletes.athlete_id
  )
);
```

2. **Club coach / admin** (same club as the athlete, has coach or admin role)
```sql
CREATE POLICY "Club coaches read parent links for clubmates"
ON public.parent_athletes
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'coach'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND users_share_club(auth.uid(), parent_athletes.athlete_id)
);
```

These mirror the patterns already used on `diary_entries`, `competitions`, etc., so no new privilege surface.

### Code revert

Once RLS allows it, the `getChattableContacts()` changes I added last turn (clubmate parents, admin-all-parents block, extra `user_roles` query) become unnecessary. Revert `src/lib/chatApi.ts` to its previous shape — just `athleteIds`-based `parentIds` + `myParentIds`. Cleaner, fewer queries.

### Verification after migration

Run as Farooq:
```sql
select parent_user_id, athlete_id from parent_athletes
where athlete_id in (select athlete_id from coach_athletes where coach_id = auth.uid());
```
Should return Laila → Kian. Then reopen "Tilføj personer" in any group — Laila Rashid should appear in the **Forældre** section.

### Files

- New migration: `supabase/migrations/<ts>_parent_athletes_coach_select.sql`
- `src/lib/chatApi.ts` — revert the clubmate/admin parent expansion added last turn.

No UI changes.
