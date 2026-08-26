# Afsluttende test af profilens fem licensfelter

## Bekræftet udgangspunkt
- Jens Jensen er en almindelig atlet: `role = athlete`, `roles = [athlete]`, aktivt klubmedlemskab som atlet og ingen admin-/coachrolle i `user_roles`.
- Den aktuelle databaseværdi er `gal_license = NULL`, `gal_license_expires_at = NULL`, `has_myfightbook = false`, `myfightbook_expires_at = NULL` og tom `license_values`.
- Profilopsætningen sender de fire faste felter: `gal_license`, `gal_license_expires_at`, `has_myfightbook` og `myfightbook_expires_at`.
- Profilredigeringen sender `license_values`; GAL-feltet dér er et dynamisk klubfelt og er ikke det samme som kolonnen `gal_license`.
- Alle fem felter findes i endpointets valideringsskema og skrives via det samme generiske update-objekt.

## Testforløb
1. Log ind med Jens Jensens egen atletsession og dokumentér identiteten og den manglende adminrolle i testsessionen.
2. Åbn profilopsætningen, udfyld og gem de fire faste felter med tydelige testværdier:
   - `gal_license = DEN-9999`
   - en gyldig GAL-udløbsdato
   - `has_myfightbook = true`
   - en gyldig MyFightBook-udløbsdato
3. Foretag en fuld browsergenindlæsning, og kontrollér at alle fire værdier læses tilbage og vises korrekt.
4. Kontrollér de samme fire kolonner direkte i databasen.
5. Åbn profilredigeringen, udfyld det dynamiske GAL-felt i `license_values`, og gem.
6. Foretag endnu en fuld browsergenindlæsning, og kontrollér at den dynamiske værdi læses tilbage.
7. Kontrollér `license_values` direkte i databasen og verificér samtidig, at de fire faste felter stadig er uændrede.
8. Hvis et felt fejler, indfang funktionsrespons og browserfejl, ret kun den konkrete skrive-/læsevej, og gentag hele testen som almindelig atlet.

## Godkendelseskriterier
- Alle fem felter er persistente efter fuld genindlæsning.
- Databaseværdierne matcher de indtastede værdier.
- Testen er udført med Jens Jensens egen atletidentitet, ikke en adminsession.
- Ingen øvrige profilfelter ændres.
- Punktet lukkes først, når der foreligger separat resultat for hvert af de fem felter.
