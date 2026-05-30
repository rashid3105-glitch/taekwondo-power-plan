# Plan

Jeg vil rette profilbillede-fejlen i det flow, der faktisk bruges nu.

## Hvad der er galt
- Din app sender ikke længere brugeren gennem den gamle `ProfileSetup`-skærm ved profilredigering.
- Ruten `/profile-setup` redirecter nu til `/profile`, og selve redigeringen sker i `src/pages/ProfileEdit.tsx`.
- De tidligere fixes blev derfor lagt det forkerte sted.
- Runtime-signalerne viser også mismatch: previewet viser billedet lokalt og toast siger “Profil gemt”, men den efterfølgende profil-fetch har stadig `avatar_url: null`, så derfor forsvinder billedet overalt bagefter.

## Jeg vil ændre
1. Gennemgå og rette gemmelogikken i `src/pages/ProfileEdit.tsx`, så success kun vises når `avatar_url` faktisk er persisteret korrekt.
2. Sikre at navigationen fra dashboard/profil ikke fortsat sender brugeren gennem det gamle `/profile-setup`-spor, hvis det skaber forkert forventning eller forkert save-path.
3. Tilføje målrettet fejlhåndtering/logik i `ProfileEdit`, så et uploadet billede ikke bare bliver et lokalt preview uden database-opdatering.
4. Validere efter rettelsen ved at følge samme kæde som i din fejlrapport: vælg billede → gem → navigér væk → bekræft at `profiles.avatar_url` ikke længere er `null` og at avatar vises i profil og dashboard.

## Teknisk fokus
- `src/pages/ProfileEdit.tsx`
- `src/App.tsx`
- Eventuelt mindre justering i fælles avatar-visning kun hvis nødvendigt efter validering
- Ingen databaseændring planlagt med den evidens jeg har nu

## Forventet resultat
- Billedet bliver ikke kun vist lokalt i redigeringen.
- Når du har gemt, findes billedestien også i profil-data.
- Samme avatar vises bagefter i profilheader, dashboard og andre steder der læser `avatar_url`.