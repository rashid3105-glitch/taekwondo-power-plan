## 1) Sammenklappelige paneler i "Administrer"-fanen

I `src/components/CoachAthleteDetail.tsx` er der ~6 paneler i `TabsContent value="profile"` (Atletprofil, Licenser, Discipline, Goals, Weekly Schedule, AI-plan, Rehab-plan). De er i dag åbne `<div className="rounded-xl border …">`-kort.

- Byg en lille lokal `CollapsiblePanel`-wrapper (bruger shadcn `Collapsible` + `ChevronDown`-rotation), der beholder samme kort-styling (`rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card`).
- Hvert panel får en unik `id` (fx `profile`, `licenses`, `discipline`, `goals`, `schedule`, `ai-plan`, `rehab`).
- Åben/lukket-status gemmes i `localStorage` pr. træner under nøglen `coach.athleteDetail.panels.v1` som `{ [panelId]: boolean }`. Læses ved mount, skrives ved toggle. Ingen backend/DB — det er en personlig UI-præference for træneren.
- Standard-tilstand første gang: `Atletprofil` og `AI-plan` åbne, resten lukkede — så mobilvisningen ikke er én lang scroll.
- Samme wrapper genbruges også i de andre 3 tabs (Mental, Præstation, Aktivitet) hvis de har flere paneler, så adfærden er konsistent.

Ingen ændringer i felter, validering eller gem-knapper — kun UI-indpakning.

## 2) Nyt "Næste stævne"-panel i "Overblik"

I `src/components/coach/AthleteOverviewTab.tsx` findes allerede "Kommende stævner"-listen. Vi tilføjer et nyt, mere handlingsorienteret panel *øverst* efter KPI-strippen med fokus på det næste stævne:

**Indhold i panelet (kun for næste stævne, hvis der er ét):**
- Stævnenavn + dato + nedtælling (dage) + prioritet-badge.
- **Dagens vægt**: seneste `weight_logs` for atleten (samme kilde som `Competitions.tsx`).
- **Målvægt**: `competitions.weight_class_kg` for stævnet (skjules ved poomsae-disciplin).
- **Gap**: `latestWeight - weight_class_kg` med grøn/rød on-track/behind-indikator (samme formel som `Competitions.tsx`: `targetGap <= (days/7) * 0.7`).
- **Plan-status**: hvis `plan_data.taperSummary` findes → knap "Vis plan" som åbner `CompetitionPlanDialog` (genbrug fra `src/components/CompetitionPlanDialog.tsx`). Ellers knap "Generér plan" som kalder edge function `generate-competition-plan` med `competition_id` + `locale` (samme kald som i `Competitions.tsx`) og viser spinner/toast.
- Link "Åbn stævneside" → `/competitions` (atlet-siden vises kun i eget dashboard, så det er reelt et informations-link).

**Datahentning:** udvid det eksisterende `load()` i `AthleteOverviewTab.tsx`:
- Udvid `competitions`-select til også at hente `weight_class_kg, priority, plan_data`.
- Tilføj `weight_logs`-query for atleten (seneste 1 række).
- Tilføj `profiles.discipline` for at skjule vægt-blok ved poomsae.

**Adfærd:** hvis der ikke er nogen kommende stævner, vises panelet ikke (så vi undgår tomt kort).

Alle tekster går gennem `t()` med nye i18n-nøgler for alle 7 sprog: `nextCompPanelTitle`, `nextCompCountdown`, `nextCompTodayWeight`, `nextCompTargetWeight`, `nextCompGap`, `nextCompOnTrack`, `nextCompBehind`, `nextCompGeneratePlan`, `nextCompViewPlan`, `nextCompNoWeight`.

## Tekniske noter
- Ingen DB-migrationer.
- Ingen ændringer i edge functions.
- localStorage-persistence er pr. browser/enhed (bevidst valg — enkel og hurtig; kan senere flyttes til `profiles`-tabel hvis I ønsker cross-device).
- Genbrug af eksisterende `CompetitionPlanDialog` sikrer identisk visning som atletens egen side.
