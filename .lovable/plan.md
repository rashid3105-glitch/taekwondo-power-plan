## Mål
Når en coach er logget ind og har valgt en klub som IKKE er deres primære klub (fx superadmin/coach der har skiftet til en anden klub via klub-switcheren), skal hele app'ens baggrund være en anelse lysere end den normale mørke coach-baggrund. Alle øvrige farver (tekst, primary, accent, kort, border) bevares.

## Sådan opdager vi "anden klub"
- Bruger er coach (eller admin) — `hasCoachRole` fra `RoleContext` eller `isCoachMode`/`isCoachRoute`.
- `activeClubId` (fra `ActiveClubContext`) ≠ brugerens `profiles.club_id` (primær klub).

Vi henter den primære klub-id én gang (ved login) og sammenligner i `ThemeSync`.

## Implementation

### 1. `src/contexts/ActiveClubContext.tsx`
- Eksponér `primaryClubId` i context-værdien (vi henter den allerede via `profileRes` — bare gem den i state og send med ud).

### 2. `src/contexts/ThemeSync.tsx`
- Læs `activeClubId` og `primaryClubId` fra `useActiveClub()`.
- Beregn `isForeignClub = hasCoachRole && primaryClubId && activeClubId && activeClubId !== primaryClubId`.
- Når coach-tema er aktivt OG `isForeignClub` → toggle en ny body-klasse `coach-foreign-club` (i stedet for at sætte `--background` inline, så vi ikke fighter med eksisterende inline-styles).

### 3. `src/index.css`
- Tilføj override under coach-mode:
```css
body.coach-mode.coach-foreign-club {
  --background: 222 26% 16%;   /* vs. 222 30% 10% */
  --card: 222 26% 20%;          /* vs. 222 30% 14% */
  --sidebar-background: 222 26% 18%;
}
```
Værdier holdes tæt på eksisterende men ~6% lysere, så kontrast til tekst og primary blå bevares.

## Verifikation
- Log ind som rashid3105 (superadmin), skift mellem Tøyen og Copenhagen City → baggrund bliver lysere i den ikke-primære klub, normal mørk i primær klub.
- Log ind som ren atlet i én klub → ingen ændring (ikke coach).
- Log ud + log ind igen → temaet matcher startklubben uden flicker.

## Ingen ændringer
- Ingen UI-tekst, ingen layout-skift, ingen DB-migration, ingen nye komponenter.
