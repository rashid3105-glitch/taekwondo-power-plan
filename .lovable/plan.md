## Mål
Fjern "📅 Ugentlig skabelon"-editoren i `/coach/season-calendar`. Lad i stedet sæsonkalenderen bygge på "Holdets standard-ugeplan" (`clubs.default_weekly_schedule`), som allerede vedligeholdes via `TeamWeeklyScheduleCard` på `/coach`.

## Hvad ændres

### `src/pages/SeasonCalendar.tsx`
1. Fjern hele det collapsible `<details>`-blok "Weekly template editor" (linje ~841-874) i sidebaren.
2. Fjern `updateTemplate()`-funktionen (linje ~439-447) — bruges ikke længere.
3. Behold `template` state, men hold den i hukommelsen kun (skriv ikke længere til `club_season_day_templates`). Den udledes nu af klubbens `default_weekly_schedule`:
   - Tilføj load af `clubs.default_weekly_schedule` når `clubId` ændres.
   - Map `DaySchedule[]` → `ClubSeasonDayTemplate[]` (én row pr. day_of_week 0..6). Mapping: dag-navn → index (Mon=0…Sun=6), `type` ("tkd" | "gym" | "rest") → `session_type` (samme værdier; `gym` forbliver `gym`). Hvis dagen har flere sessions, lav én template-row pr. session (multi-session understøttes allerede af `resolveSessionsForDate`). Hvis klubben ikke har en standard-ugeplan, fald tilbage til `GENERIC_DEFAULT_SCHEDULE` fra `TeamWeeklyScheduleCard`.
   - `id` og `season_plan_id` på de mappede rows er kosmetiske (kun brugt af `updateTemplate`, som nu fjernes) — sæt fx `id: ${dow}-${i}`, `season_plan_id: selectedPlanId ?? ""`.
4. Stop med at læse fra og skrive til `club_season_day_templates`:
   - Fjern read i `loadPlanData` (parallel select på linje ~201 og `setTemplate` på linje ~207).
   - Fjern seed-insert i `createPlan` (linje ~352-356).
   - Fjern delete i `deletePlan` (linje ~370).
5. `resolveSessionForDate` / `resolveSessionsForDate` får nu det klub-afledte template — ingen ændringer i `seasonCalendar.ts`.

### Hjælpetekst
- Tilføj en lille info-linje øverst i sidebaren (eller ved siden af fasen-card), fx "Ugeplan styres på holdsiden" med link til `/coach`. Brug eksisterende `t()`-nøgle hvis muligt, ellers tilføj ny key `seasonWeeklyFromTeam` på alle 7 sprog.

### i18n
- Ny nøgle `seasonWeeklyFromTeam` ("Ugeplan styres på holdsiden") tilføjes på da/en/sv/de/ar/no/es.
- Lad eksisterende `seasonWeeklyTemplate`-nøgle stå (kan stadig bruges andetsteds), men fjern dens UI-brug her.

## Hvad røres ikke
- DB-skemaet (`club_season_day_templates` beholdes for bagudkompatibilitet — nye planer skriver bare ikke til den).
- `clubs.default_weekly_schedule` og `TeamWeeklyScheduleCard` ændres ikke.
- Athlete-overrides, faser, teknikker, kompetencer, kompetitions-pinde rører vi ikke.
- `SeasonCalendarView.tsx` (athlete-siden) bruger samme data og fungerer videre.

## Effekt for brugeren
- Sidebaren bliver renere: ingen duplikeret ugentlig editor.
- Når træneren ændrer holdets standard-ugeplan på `/coach`, opdateres sæsonkalenderen automatisk.
- Eksisterende planer der har skrevet `rest` til alle dage (som på skærmbillede 1) viser nu klubbens rigtige ugeplan i kalendergittet.
