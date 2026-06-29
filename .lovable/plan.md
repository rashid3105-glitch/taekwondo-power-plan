
# Mål
En coach må aldrig se atleter fra andre klubber i lister, pickers, statistik eller søgninger. Den aktive klub (klubvælgeren) er den eneste sandhed. Skift klub for at se andre.

# Fundne lækager
Gennemgang af alle steder der henter atleter via `coach_athletes`, `club_memberships`, `profiles` eller `get_club_member_profiles`.

| # | Fil | Problem |
|---|-----|---------|
| 1 | `src/components/hub/CoachDashboard.tsx` (Hjem → trænerkort: total, inaktive, ugens sessions, aktive planer) | Henter `coach_athletes` for coach uden klubfilter — viser atleter fra ALLE klubber coachen er i. |
| 2 | `src/pages/CoachCompetitions.tsx` (Stævner) | `coach_athletes` uden klubfilter → stævner og atlet-picker viser tværklubsatleter. |
| 3 | `src/pages/MatchAnalysis.tsx` (Kamp-analyse picker) | Slår `coach_athletes` (uden klubfilter) sammen med ALLE profiler i ALLE coachens klubber. Ignorerer aktiv klub. |
| 4 | `src/components/testing/AthletesComparisonView.tsx` (Tests → Sammenlign) | Fallback når ingen aktiv klub → henter alle `coach_athletes` på tværs af klubber. |
| 5 | `src/lib/chatApi.ts` `getChattableContacts()` (Chat-kontaktliste) | Slår `coach_athletes` (begge retninger) sammen med klubmedlemmer, uden klubscope → tværklubsatleter dukker op som kontakter. |

Allerede korrekte (verificeret): `CoachToday`, `CoachMessages` (atletliste), `CoachModules`, `CoachDashboard.tsx` (siden), `SquadOverview`, `PhysicalTesting` (athlete picker), `AdminApproval` (er admin med vilje).

# Plan

## 1. `hub/CoachDashboard.tsx`
- Brug `useActiveClub()`.
- Hent atleter via `supabase.rpc("get_club_member_profiles", { _club_id: activeClubId })` (samme som CoachDashboard-siden) i stedet for `coach_athletes`.
- Hvis ingen aktiv klub: vis tom tilstand med besked om at vælge klub.

## 2. `pages/CoachCompetitions.tsx`
- Brug `useActiveClub()`.
- Filtrér `coach_athletes`-query med `.eq("club_id", activeClubId)` når aktiv klub er sat.
- Supplér med `get_club_member_profiles(activeClubId)` så virtuelle/uden-link atleter også vises (parallelt med `CoachToday`/`CoachMessages`-mønstret).

## 3. `pages/MatchAnalysis.tsx`
- Brug `useActiveClub()`.
- Erstat de to kilder (coach_athletes uden filter + alle klubprofiler) med `get_club_member_profiles(activeClubId)`. Hvis ingen aktiv klub, fald tilbage til kun direkte `coach_athletes` med `.eq("club_id", profile.club_id)`.

## 4. `components/testing/AthletesComparisonView.tsx`
- Fjern fallback-grenen der henter alle `coach_athletes` uden klub. Hvis `activeClubId` mangler, vis tom liste med hint "Vælg klub i toppen".

## 5. `lib/chatApi.ts` `getChattableContacts()`
- Skift fra `profiles.club_id` til den aktive klub (læs fra `localStorage` nøglen `activeClubId` som `useActiveClub` allerede skriver — eller eksponér en helper).
- Klubmedlemmer hentes via `club_directory` for aktiv klub (uændret mønster).
- Drop coach_athletes-grenen helt for kontakter — kontakter er per klub. Coachens egne managed-atleter i den aktive klub kommer alligevel med via klubmedlemskab.

## 6. Database-hygiejne (defense in depth)
- Verificér at alle eksisterende `coach_athletes`-rækker har `club_id` udfyldt (triggeren `stamp_club_id_from_athlete` stamper kun ved insert). Hvis NULL: backfill fra `profiles.club_id` for athlete_id.
- Migration: kort UPDATE der sætter `club_id` for `coach_athletes` hvor det er NULL.

# Verifikation
- Log ind som coach i klub A med aktiv klub A → ingen atleter fra klub B må optræde i: Hjem-trænerkort, Stævner, Match-analyse picker, Sammenlign-tests, Chat-kontakter.
- Skift til klub B → kun klub B's atleter vises.
- Axel (anden klub) må ikke længere optræde nogen steder for Sami i Copenhagen City.

# Tekniske noter
- Hovedhjælperne der bør bruges konsekvent: `useActiveClub()` for client-state + RPC `get_club_member_profiles(_club_id)` for autoritativ klubliste (respekterer både `club_memberships` og legacy `profiles.club_id`).
- Ingen RLS-ændringer nødvendige; problemet er udelukkende klient-queries der ikke scoper. RLS tillader fortsat at en coach SER tværklubsdata når de er coach i flere klubber — det er korrekt; UI skal bare ikke vise det utilsigtet.
