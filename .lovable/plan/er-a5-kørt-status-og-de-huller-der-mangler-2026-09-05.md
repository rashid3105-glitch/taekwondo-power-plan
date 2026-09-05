# Er A5 kørt? — status og de huller der mangler

Kort svar: A5 er stort set kørt, men den er ikke færdig, og tallene på statistiksiden er i dag misvisende.

## Hvad der beviseligt findes i dag

- Tabellen til hændelser er oprettet med adgangsregler (kun platformadmin kan læse, systemet skriver).
- Hændelser registreres fire steder: når en træner sender en samtykkeanmodning, når en ny atlet oprettes med værgemail, når værgen åbner linket, og når værgen bekræfter. Påmindelser logges også.
- Tragt-kortet ligger på statistiksiden og viser sendt / åbnet / bekræftet / "ikke mit barn" samt dækning af fødselsdato.

## Hvad der mangler

1. **Klubopdelingen mangler.** Planen kræver en opdeling pr. klub. Kortet viser kun samlede tal for hele platformen.
2. **Tallene er tomme og procenterne forkerte.** Der findes 28 samtykkelinks i alt, hvoraf 8 er bekræftet — men kun ét enkelt link har registrerede hændelser (åbnet + bekræftet). Ingen "sendt"-hændelser findes overhovedet, så kortet viser 0 sendt og dermed 0 % åbnet og 0 % bekræftet, selvom der reelt er bekræftet 8. Årsagen er, at målingen først begyndte at logge efter, at de gamle links blev sendt.
3. **"Det er ikke mit barn" kan endnu ikke opstå,** fordi den knap først kommer med punkt 8–13 (samtykkesiden), som ikke er bygget endnu. Feltet i tragten vil altid stå på 0 indtil da.

## Hvad jeg foreslår vi gør

**Trin 1 — gør de historiske tal sande.** Én engangs-datarettelse, der opretter en "sendt"-hændelse for hvert eksisterende samtykkelink (dateret til linkets oprettelsestidspunkt) og en "bekræftet"-hændelse for hvert link, der allerede er bekræftet. Ingen nye tabeller og ingen skemaændring — kun manglende historik der fyldes ud. Derefter viser tragten 28 sendt og 8 bekræftet (29 %), som svarer til virkeligheden.

**Trin 2 — klubopdeling på kortet.** Under de fem nøgletal tilføjes en liste pr. klub med sendt / åbnet / bekræftet og dækning af fødselsdato, sorteret efter flest manglende. Klubnavne hentes sammen med hændelserne. Tekster i alle 7 sprog.

**Trin 3 — robuste procenter.** Når "sendt" mangler for et link, men "åbnet" eller "bekræftet" findes, tælles linket alligevel med i nævneren, så procenterne aldrig kan overstige 100 eller falde til 0 ved manglende historik.

## Teknisk

- Datarettelse: `INSERT ... SELECT` fra `consent_tokens` ind i `consent_token_events` med `occurred_at = created_at` henholdsvis `confirmed_at`, beskyttet mod dubletter med `NOT EXISTS` på (token_id, event). Kan køres igen uden skade.
- `src/components/admin/ConsentFunnelCard.tsx`: hent `club_id` med i forespørgslen, join mod `clubs.name`, gruppér i klienten; nævner = antal unikke token_id med en hvilken som helst hændelse.
- `src/i18n/translations.ts`: nye nøgler til klubopdelingen i da/en/sv/de/ar/no/es.
- Ingen ændringer af autentificerede ruter, ConsentGate, aldersgrænsen (18) eller `android/`. Ingen nye kolonner på `profiles`.
