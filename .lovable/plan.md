## Hvorfor du ikke kan se Annamarias dagbog

Annamarias seneste dagbogsindslag (15. juni 2026) er gemt med `club_id = NULL` i databasen. Coach-visningerne filtrerer dagbogsindslag på den aktive klub med `eq("club_id", activeClubId)`, så rækker uden klub-stempel bliver filtreret væk — selvom RLS faktisk tillader dig at se dem.

Det rammer i alt 3 dagbogsindslag på tværs af alle atleter (resten af de 101 er stemplet korrekt). Nye indslag oprettet via `Diary.tsx` bliver allerede stemplet med `activeClubId`, så problemet er begrænset til ældre/offline-skrevne indslag.

## Plan (2 trin, samme commit)

### 1. Backfill manglende `club_id` i databasen
Migration der sætter `diary_entries.club_id` ud fra `profiles.club_id`, hvor det er NULL:

```sql
UPDATE public.diary_entries d
SET club_id = p.club_id
FROM public.profiles p
WHERE d.user_id = p.user_id
  AND d.club_id IS NULL
  AND p.club_id IS NOT NULL;
```

Rammer netop de 3 forældreløse rækker (inkl. Annamarias).

### 2. Gør coach-læsninger null-tolerante (forsikring mod fremtidige offline-indslag)
Samme mønster som rehab_plans bruger i forvejen. To steder:

- `src/pages/CoachAthleteOverview.tsx` linje ~180:
  - Skift `q = q.eq("club_id", activeClubId)` → `q = q.or(\`club_id.eq.${activeClubId},club_id.is.null\`)`
- `src/components/coach/AthleteOverviewTab.tsx` (samme `eq("club_id", activeClubId)` på diary_entries)

Ingen ændringer i `useOfflineDiary` / sync-engine — de stempler allerede `club_id` korrekt fra `Diary.tsx`. Ingen Help.tsx eller changelog.

## Hvad ændres ikke
- RLS-policies (de er allerede korrekte)
- Create-stien (allerede stempler `club_id`)
- Andre coach-faner end dagbog
