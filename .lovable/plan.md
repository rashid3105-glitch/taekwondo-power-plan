## Hvad jeg gør

Din bruger (`117a7c4c-…`) har i dag dobbelt-medlemskab i begge klubber:

- **Copenhagen City Taekwondo klub** — `athlete` + `coach`
- **UC Copenhagen** — `coach` (ingen athlete-række)

Jeg sletter den ene `athlete`-række i Copenhagen City, så du kun står som `coach` i begge klubber. `coach`-rækkerne og dit medlemskab af UC Copenhagen røres ikke.

## Teknisk

Én `DELETE` på `club_memberships`:

```sql
DELETE FROM public.club_memberships
WHERE user_id = '117a7c4c-5cae-44cf-a5e3-0bee2d1cbb70'
  AND club_id = '4b827e40-ff46-44a2-a1ba-2c87a8680756'
  AND role_in_club = 'athlete';
```

`profiles.role` / `profiles.roles` rører jeg ikke — efter dedup-fixet i `ActiveClubContext` afgøres din aktive rolle alligevel kun ud fra `club_memberships`.

## Bemærk

Det her fjerner ikke athlete-data (workout logs, dagbog, mental, osv.) der måtte ligge på din bruger — det sletter kun rolle-rækken. Sig til hvis du også vil have ryddet de data.

De data må du også gerne slette