## 1) Flyt "Ugentlig atletrapport" ind i Holdets puls (grønt ikon)

**Nu:** `WeeklySquadExport` ligger som et rødt PDF-ikon i handling-rækken øverst på `/coach` (ved siden af "Manglende forældresamtykke").

**Ændring:**
- Fjern `<WeeklySquadExport />` fra action-rækken i `src/pages/CoachDashboard.tsx` (linje ~432).
- Læg den ind i toppen af `SquadPulse`-kortet (`src/components/coach/SquadPulse.tsx`) som en lille "Ugentlig atletrapport"-knap over pulse-tiles, højrestillet.
- Ikon farves grønt: `text-emerald-500` (Tailwind), matcher "success" tone i cockpittet. Hover: `hover:text-emerald-400`.
- Behold `title` + `aria-label` (i18n) så web-hover-hint stadig virker.
- `WeeklySquadExport` udvides med en valgfri `variant="inline" | "icon"` prop, så knappen både kan vise ikon + kort label ("Ugerapport") inde i SquadPulse-headeren.

## 2) Konsistent klubvælger på coach-siderne

**Nu:** `ClubSwitcher` vises kun på `/coach` (dashboard) og `/dashboard`. Derfor kan man på f.eks. `/coach/competitions` ikke skifte klub, og siden viser data ud fra den klub der sidst blev valgt på dashboardet — hvilket forvirrer.

**Ændring:** Introducér én genbrugelig topbar `CoachPageHeader` (ny fil `src/components/coach/CoachPageHeader.tsx`) med:
- Titel + evt. tilbage-pil.
- Fast `ClubSwitcher` i højre side (samme komponent som allerede findes).
- Bruger `useActiveClub()` — ingen ny state.

Sæt den ind i toppen af de datatunge coach-sider:
- `src/pages/CoachCompetitions.tsx`
- `src/pages/SeasonCalendar.tsx` (coach-varianten)
- `src/pages/CoachToday.tsx` (Fremmøde)
- `src/pages/CoachMessages.tsx`
- `src/pages/CoachSurveys.tsx`
- `src/pages/CoachModules.tsx`
- `src/pages/CoachAthleteOverview.tsx`

Ikke tilføjet på indstillinger/hjælp/profil — kun sider hvor data er klub-scoped.

## 3) Verificér "true to club selection" på Competitions

`CoachCompetitions` filtrerer allerede athletes via `get_club_member_profiles(activeClubId)` og henter kun `competitions` for de user_ids (linje 109–129). Så snart klubvælgeren skifter til fx **UC Copenhagen** (uden atleter), bliver `athleteIds = []` → early return sætter `comps = []` → siden viser tom-tilstand. Ingen SQL-ændring nødvendig.

Ekstra sikring:
- Tilføj tom-tilstands-kort med tekst "Ingen atleter i denne klub endnu" (i18n, 7 sprog) på Competitions, når `myAthletes.length === 0`, så det er tydeligt hvorfor listen er tom.
- Samme mønster tjekkes/tilføjes hurtigt på de andre klub-scopede sider hvis de mangler tom-tilstand.

## Ikke i scope
- Ingen ændringer af RLS/backend.
- Ingen ny farve-token; bruger eksisterende Tailwind `emerald` fordi "success" tone allerede findes visuelt i cockpittet.
- Ingen ændring til athlete-dashboard.

## Tekniske detaljer
- `WeeklySquadExport` refactor: intern knap-render styres via `variant`-prop; default beholder eksisterende look så andre steder (hvis brugt) ikke brydes.
- `CoachPageHeader` bruger `sticky top-0 z-30 bg-background/80 backdrop-blur` for at være synlig ved scroll.
- i18n-nøgler: `weeklyAthleteReport`, `noAthletesInSelectedClub` — tilføjes for da/en/sv/de/ar/no/es i `src/i18n/translations.ts`.
