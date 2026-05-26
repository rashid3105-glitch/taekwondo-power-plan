## Hvor bygges evalueringsskemaer?

- **Trænere**: Bunden af coach-bottom-nav → ikonet **Evalueringer** (ClipboardList) → `/coach/surveys`. Her opretter du nye skemaer, ser svar og styrer skabeloner (aktive/arkiv).
- **Atleter**: Hub → "Andre moduler" → kortet **Evalueringer** → `/surveys`. Her udfyldes skemaer (med valg om anonymitet, hvis træneren har tilladt det).

## Fejlen: `infinite recursion detected in policy for relation "surveys"`

### Årsag
RLS-loop mellem to tabeller:

- `surveys` SELECT-policy (atleter) laver `EXISTS (SELECT 1 FROM survey_recipients ...)`.
- `survey_recipients` har en `FOR ALL`-policy for coaches der laver `EXISTS (SELECT 1 FROM surveys ...)`.

Når atlet læser `surveys`, kalder Postgres `survey_recipients`-policies, som kalder `surveys`-policy igen → uendelig rekursion.

### Fix (migration)
Brug den eksisterende SECURITY DEFINER-funktion `public.is_survey_target(_survey_id, _user_id)` i atlet-policy'en, så Postgres ikke evaluerer `survey_recipients` RLS rekursivt.

```sql
DROP POLICY "Athletes view targeted surveys" ON public.surveys;

CREATE POLICY "Athletes view targeted surveys"
ON public.surveys
FOR SELECT
TO authenticated
USING (public.is_survey_target(id, auth.uid()));
```

Coach-policy (`auth.uid() = coach_id`) er uændret. Ingen ændringer i kode, types eller UI.

### Verifikation
- Genåbn `/surveys` som atlet — listen loader uden fejl.
- Coach kan stadig se/oprette/redigere egne skemaer på `/coach/surveys`.
