# Adgangsgennemgang: hvorfor du så 0 klubber og 0 brugere

## Kort svar: databasen fejler ikke

Jeg har gennemgået alle adgangsregler (RLS) og testet admin-siden live — både i preview og på den publicerede sportstalent.dk med en rigtig admin-session. Begge steder viser den korrekt:

- 76 brugere i alt, 51 betalende, 32 demo, 28 coaches
- Alle 28 klubber vises grupperet med atletantal

Så tallene "0" på din telefon kom ikke fra manglende rettigheder i databasen.

## Hvad gennemgangen viste (verificeret)

- 103 tabeller i databasen: **alle** har RLS slået til og mindst én adgangsregel. Ingen huller.
- Data findes: 81 profiler, 28 klubber, 89 klubmedlemskaber, 29 rolle-rækker.
- Admin-reglerne er intakte: admin kan læse alle profiler, alle klubber og alle roller.
- Data-API-rettighederne (GRANTs) er på plads på alle tabeller.
- Databasens sikkerhedsscanner rapporterer 0 fejl (kun 133 informative advarsler om, at interne funktioner kan kaldes af indloggede brugere — normalt for dette design, ikke et hul).
- Kun én bruger har admin-rollen: Farooq Rashid. Superadmin-kontakten står pt. slået **fra**.

## Den sandsynlige årsag på din telefon

Siden viser tal uden fejlbesked, hvis dataforespørgslen fejler eller returnerer tomt — fx ved:

1. udløbet/ugyldig session på mobilen (appen henter så 0 rækker i stedet for at sige fra), eller
2. en gemt offline-version (service worker/PWA-cache) der viser en tom skal uden friske data.

Begge fører til præcis det billede du sendte: siden loader, men alle tal er 0.

## Hvad jeg foreslår at bygge

1. **Synlige fejl i stedet for tavse nuller** på admin-siderne (Brugergodkendelse, Statistik, Klubstyring): hvis en forespørgsel fejler eller sessionen er udløbet, vis en tydelig fejlbesked med "Prøv igen"-knap i stedet for 0.
2. **Session-tjek før indlæsning**: opdater sessionen automatisk, og send brugeren til login hvis den er udløbet — i stedet for at vise en tom side.
3. **Ingen offline-cache på admin-sider**: admin-ruterne skal altid hente friske data, aldrig fra offline-lageret.
4. **Superadmin-status synlig i toppen** af Brugergodkendelse, så det altid er tydeligt om du ser alt eller kun dine egne klubber.

Ingen ændringer i databasen eller adgangsreglerne — de er sunde, og at pille ved dem ville kun sænke sikkerheden.

## Teknisk

- `src/pages/AdminApproval.tsx`: `loadUsers()` ignorerer i dag `error` på alle seks parallelle forespørgsler og sætter blot tomme lister. Tilføj fejl-state + retry.
- Samme mønster i `src/pages/AdminStats.tsx` (RPC `get_admin_user_stats`) og `src/pages/AdminClubs.tsx`.
- Sessionstjek via eksisterende `src/lib/authSession.ts` (`getCurrentUser` / `isDefinitelySignedOut`) før `is_admin`-kaldet, så udløbet token giver redirect til login frem for tom side.
- Service worker: undtag `/admin/*` fra cache-first, så admin altid går på nettet.
