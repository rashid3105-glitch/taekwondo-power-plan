# Jesper Upul Westh Olsen vises som atlet i stedet for træner

## Hvad jeg fandt (verificeret i databasen)

Jesper har trænerrettigheder ét sted, men atlet-status alle andre steder:

| Kilde | Værdi i dag |
|---|---|
| `user_roles` (platformrolle) | `coach` |
| Profilens `role` / `roles` | `athlete` / `[athlete]` |
| Profilens `active_role` | `athlete` |
| Klubmedlemskab (Bornholm Taekwondo Klub - Hae Sung) | `role_in_club = athlete` |
| Tilknyttede atleter (`coach_athletes`) | 1 |

Appen afgør trænervisningen ud fra det aktive klubmedlemskab (`Dashboard.tsx` linje 227-229: `role_in_club === "coach" || "admin"`). Fordi hans medlemskab står som `athlete`, bliver han aldrig sendt til trænerdashboardet og vises med atlet-mærke — nøjagtig samme mønster som tidligere set hos Tommy Mortensen og Johannes Stender Hansen.

## Rettelse

Én dataopdatering, ingen kodeændringer:

1. `club_memberships.role_in_club` → `coach` for Jesper i Bornholm Taekwondo Klub - Hae Sung.
2. `profiles.role` → `coach` og `roles` → `['coach','athlete']` (så han stadig kan skifte til atletvisning).
3. `profiles.active_role` → `coach`, så han lander på trænerdashboardet ved næste login.
4. `user_roles` er allerede `coach` — røres ikke.

Bagefter verificerer jeg med en forespørgsel, at alle fire felter er konsistente.

## Bemærkning

Dette er tredje bruger med samme uoverensstemmelse. Hvis du vil, kan jeg i en senere opgave lave en engangsoprydning, der finder alle brugere med `user_roles = coach` men `role_in_club = athlete`, plus en rettelse i admin-UI'et så trænerrolle sættes begge steder på én gang. Det er ikke med i denne plan.
