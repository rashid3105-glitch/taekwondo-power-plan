# Fase 5 — Terminologi og i18n gøres sport-drevet

Sidste større hardkodning af taekwondo-sprog i selve appen fjernes. Klubbens sport bestemmer, hvad felter og labels hedder. Taekwondo-klubber ser præcis det samme som i dag.

## Hvad brugeren oplever

- Profil og onboarding: "Taekwondo-træninger pr. uge" og "Startdato i taekwondo" bliver til klubbens egen betegnelse — fx "Karate-træninger pr. uge", "Kickboxing-træninger pr. uge" eller "Træninger pr. uge" for fitness.
- Profilsiden viser klubbens faktiske sport i stedet for et fast "Taekwondo".
- Bibliotek: "Taekwondo-drills" bliver til klubbens sportsnavn + drills.
- Coach- og atletvisninger, der nævner sportens træninger, følger samme betegnelse.
- Marketing-/SEO-siderne (taekwondo-træningsprogram, poomsae, teknik, stævneforberedelse) beholdes som de er — de er bevidst taekwondo-målrettede.

## Databaseændring

To kolonner på `profiles` får sport-neutrale navne:

```text
tkd_sessions_per_week  ->  sessions_per_week
tkd_start_date         ->  sport_start_date
```

Data flyttes med — ingen atlet mister oplysninger. Én migration med omdøbning; alle 13 kodefiler og edge functions opdateres i samme runde, så der ikke findes et mellemstadie hvor noget peger på det gamle navn.

Bemærk: offline-cachede profiler i browseren/appen kan indeholde de gamle feltnavne. Læsning laver derfor et fallback på de gamle nøgler, så en bruger, der åbner appen offline lige efter opdateringen, stadig ser sine tal.

## Teknisk omfang

1. Migration: `ALTER TABLE public.profiles RENAME COLUMN ...` for begge felter.
2. Opdater alle referencer (13 filer): `Dashboard`, `ProfileSetup`, `Library`, `CoachDashboard`, `CoachAthleteOverview`, `CoachAthleteDetail`, `SquadOverview`, `NutritionPlan`, `WeightModule`, `AdminApproval`, samt edge functions `generate-plan`, `generate-nutrition-plan`, `update-my-profile`.
3. Ny helper i `src/lib/sportGrade.ts`-stil: `sportTermFor(sportSlug, key, t, locale)` (eller udvid `src/config/sportProfiles.ts` med `sessionsPerWeekLabel`, `startDateLabel`, `drillsLabel`) — server-kopien i `supabase/functions/_shared/sportProfiles.ts` holdes i sync.
4. Erstat de faste i18n-strenge (`tkdSessionsPerWeek`, `tkdStartDate`, `libDrillsLabel`, `drillsTitle`, `disciplineHint`) med sport-drevne labels; behold nøglerne som taekwondo-fallback, så intet bliver tomt.
5. `Profile.tsx`: `value="Taekwondo"` → klubbens sportsnavn fra `useMySportProfile()`.
6. Offline-læsning i `src/lib/profileOfflineDB.ts` og `useOfflineProfile.ts` får fallback fra gamle til nye feltnavne.
7. Hjælpeside + changelog opdateres (v1.5.27) på alle 7 sprog.

## Uden for scope

- Teknik-/færdighedstaksonomien (fase 3) og sportsvalg i onboarding (fase 6).
- Match-analyse med WT-regler — den er reelt taekwondo-specifik og tages sammen med fase 3.
