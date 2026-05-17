## Mål

1. **Fejlfix**: Når man indtaster en fases uger, skal de svare til ISO-ugenumre (samme som vises i kalenderen). I dag tolkes inputtet som "sæson-uger" (1 = første uge i planen), så hvis du skriver `47–50` rammer det helt forkerte uger.
2. **Ny funktion**: Hver fase får en eller flere **træningsfokus-tags** (fx Teknik, Kondition, Sparring, Styrke, Sparringskampe, Restitution) som vises i fase-banner og i kalenderen.

---

## Ændringer

### 1. Database (migration)

Tilføj kolonne `focus_tags text[] NOT NULL DEFAULT '{}'` til `club_season_phases`.

### 2. `src/lib/seasonCalendar.ts`

- Tilføj `focus_tags: string[]` til `ClubSeasonPhase`-typen.
- Eksportér konstant `PHASE_FOCUS_TAGS` med standardvalg: `tkd_technique`, `conditioning`, `sparring`, `strength`, `competition_prep`, `recovery`, `mental`.
- Tilføj hjælpefunktioner:
  - `isoWeekToSeasonWeek(seasonStart, isoWeek, year)` – konverterer et ISO-ugenummer (med år) til sæson-uge.
  - `seasonWeekToIsoWeek(seasonStart, seasonWeek)` – returnerer `{ isoWeek, year }`.

### 3. `src/pages/SeasonCalendar.tsx` – Fase-editor

**Fejlfix:**
- Erstat de to tal-inputs (`start_week` / `end_week`) med et **ISO-uge interval**: to inputs `Fra uge` og `Til uge` (ISO), evt. med automatisk år-detektion ud fra planens datoer.
- Ved gem: konvertér ISO-uge → sæson-uge (1-baseret offset fra `plan.start_date`) og gem i `start_week` / `end_week` som i dag. Validér at intervallet ligger inden for planen.
- I fase-listen vises stadig ISO-ugenumre (det er allerede korrekt), men nu stemmer input og visning overens.

**Ny: fokus-tags pr. fase:**
- I "Tilføj fase"-formularen: multi-select chips med `PHASE_FOCUS_TAGS` (i18n labels), valgfri.
- I fase-listen i sidebar: vis valgte tags som små badges under fasenavnet.
- I kalender-tabellens fase-banner-række (linje 486-491): vis tags ud for fasenavnet.

### 4. `src/components/hub/SeasonCalendarView.tsx` (athlete view)

I `currentPhase`-banneret: vis fokus-tags som badges under fokus-label.

### 5. `src/i18n/translations.ts`

Tilføj nøgler på alle 7 sprog:
- `seasonPhaseFocusTags` ("Træningsfokus")
- `phaseFocusTechnique`, `phaseFocusConditioning`, `phaseFocusSparring`, `phaseFocusStrength`, `phaseFocusCompetitionPrep`, `phaseFocusRecovery`, `phaseFocusMental`
- `seasonPhaseWeekHint` ("ISO-ugenumre, fx 47–50")
- `seasonPhaseWeekOutOfRange` ("Ugerne skal ligge inden for sæsonen")

### 6. Changelog-entry

I `translations.ts` changelog-array tilføjes "Sæsonkalender: fasens uge-input bruger nu ISO-ugenumre der stemmer med visningen, og hver fase kan markeres med træningsfokus-tags (teknik, kondition, sparring, styrke, m.fl.)" på alle sprog.

---

## Out of scope

- Egen ugeskabelon pr. fase (du valgte kun tags).
- AI-plan integration med tags (kan tilføjes senere).
