## Mål
Kian skal se de 5 demo-atleter (Emma, Leo, Maja, Noah, Sara) i sit coach-dashboard for Sportstalent Demo-klubben.

## Diagnose
- Kian er coach i klub `dec0dec0-…-0001` (Sportstalent Demo) ✅
- `coach_athletes` indeholder allerede links fra Kian til alle 5 demo-atleter ✅
- Demo-atleternes `profiles.club_id` peger på Sportstalent Demo ✅
- **Mangler:** Demo-atleterne har ingen rækker i `club_memberships`. Dashboardets squad-query (`get_squad_overview`, `CoachToday`, `SquadOverview`) joiner mod `club_memberships` for at filtrere efter aktiv klub → 0 resultater.

## Ændring (kun data, ingen kode)
Indsæt 5 nye rækker i `club_memberships`:

| user_id | club_id | role_in_club | status |
|---|---|---|---|
| Emma (b43075…) | dec0dec0-…-0001 | athlete | active |
| Leo (a8f339…) | dec0dec0-…-0001 | athlete | active |
| Maja (1c6054…) | dec0dec0-…-0001 | athlete | active |
| Noah (3cfba5…) | dec0dec0-…-0001 | athlete | active |
| Sara (15201e…) | dec0dec0-…-0001 | athlete | active |

Med `ON CONFLICT DO NOTHING` så det er sikkert at køre igen.

## Verifikation
Efter indsætning genindlæser Kian sit dashboard → de 5 demo-atleter vises i squad-listen, attendance og dialoger — som på det vedhæftede screenshot.
