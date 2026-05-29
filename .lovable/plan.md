## Mål
Coach skal kunne vælge moduler både **pr. atlet** (eksisterende) og **for hele klubben på én gang**.

## UI — `src/pages/CoachModules.tsx`
Tilføj en tab-switch øverst:
- **"Hele klubben"** (default) — én liste med 8 moduler + Switch. Gemmes som klub-standard.
- **"Pr. atlet"** — nuværende flow med atlet-dropdown + overrides.

Visuel hint pr. atlet: hvis modul har en override afvigende fra klub-standard, vis lille label "Overstyret" ved siden af Switch. Knap "Nulstil til klub" fjerner override.

## Database
Brug eksisterende tabeller (oprettet i migration `20260513133019`):
- `club_module_defaults (club_id, module, enabled)` — klub-niveau
- `athlete_module_overrides (user_id, module, enabled)` — pr. atlet

I dag tillader RLS kun admin at skrive. **Ny migration** der tilføjer coach-policies:
```sql
-- Coaches kan styre defaults for deres egen klub
CREATE POLICY "Coaches manage own club module defaults"
  ON public.club_module_defaults FOR ALL
  USING (has_role(auth.uid(),'coach') AND EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND club_id = club_module_defaults.club_id))
  WITH CHECK (same);

-- Coaches kan styre overrides for atleter i deres klub
CREATE POLICY "Coaches manage athlete overrides in club"
  ON public.athlete_module_overrides FOR ALL
  USING (has_role(auth.uid(),'coach') AND users_share_club(auth.uid(), user_id))
  WITH CHECK (same);
```

## Athlete-side — `src/pages/AthleteModules.tsx`
Nu læses kun `athlete_modules`. Skift til samme resolution som `useAthleteModuleAccess`:
1. `athlete_module_overrides` (hvis findes) →
2. `club_module_defaults` (hvis findes) →
3. default = true.

Drop afhængighed af `athlete_modules` (gammel coach-tabel) — eller behold som tredje fallback hvis du vil bevare data fra forrige commit. Anbefaling: skift helt til de nye tabeller for konsistens med admin-siden.

## Detaljer
- Klub-id hentes fra `profiles.club_id` for coachen ved mount.
- Hvis coach ikke har en `club_id`: vis fejlbesked og skjul "Hele klubben"-fanen.
- Upsert mod `(club_id, module)` hhv. `(user_id, module)`.
- Toast på fejl, optimistisk UI-update som i dag.

## Ingen ændringer
- `Help.tsx`, changelog, sidemenu — uændret.
- `useAthleteModuleAccess` — fungerer allerede korrekt.
