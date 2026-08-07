# Testklubber for karate, kickboxing og fitness

Opret tre testklubber (én pr. sportsgren, taekwondo undtaget), hver med én coach og to atleter, som rigtige login-konti med korrekte roller og rettigheder.

## Hvad der oprettes

| Klub | Sport | Coach | Atleter |
|---|---|---|---|
| Test Karate Klub | karate | karate@sportstalent.dk | karate.test1@ / karate.test2@sportstalent.dk |
| Test Kickboxing Klub | kickboxing | kickboxing@sportstalent.dk | kickboxing.test1@ / kickboxing.test2@sportstalent.dk |
| Test Fitness Klub | fitness | fitness@sportstalent.dk | fitness.test1@ / fitness.test2@sportstalent.dk |

Atlet-mails får sportspræfiks, fordi e-mail skal være unik på tværs af hele platformen — `test1@sportstalent.dk` kan kun bruges én gang. Alle konti får samme adgangskode (`Test1234!`) og oprettes med bekræftet e-mail, så de kan logge ind med det samme.

Profiler udfyldes med realistiske testdata: visningsnavn, alder, vægt, sportsspecifik grad (fx "Grønt bælte" i karate, "Øvet" i kickboxing, "Let øvet" i fitness), træningspas pr. uge og mål — så de sport-drevne labels fra fase 2 og 5 kan testes.

## Rettigheder der sættes op

- Hver klub oprettes med aktiv licens og plads til 10 atleter.
- Coach: rollen `coach` i rollelisten, aktivt coach-medlemskab i sin klub, og kobling til begge sine atleter — så coachen kan se og redigere præcis sine egne to atleter og intet på tværs af klubber.
- Atleter: aktivt atlet-medlemskab i egen klub, godkendt profil, ingen coach-rolle.
- Ingen konto får admin-adgang.
- Klub-isolationen håndhæves af de eksisterende adgangsregler via klub-id — der laves ingen ændringer i adgangsregler eller databasestruktur.

## Teknisk

- En midlertidig, admin-beskyttet edge-funktion (`seed-test-clubs`) opretter auth-brugere via service-nøglen, da brugerkonti ikke kan oprettes fra en SQL-migrering. Funktionen validerer kaldets JWT og afviser alle uden admin-rolle.
- Funktionen er idempotent: eksisterende klubber/brugere med samme mail genbruges frem for at fejle, så den kan køres igen uden dubletter.
- Efter kørslen skrives der rækker i `clubs`, `profiles`, `club_memberships`, `user_roles` og `coach_athletes`.
- Funktionen slettes igen efter kørslen, så der ikke ligger et seed-endpoint i produktion.
- Ingen ændringer i eksisterende UI-kode.

## Verifikation

Efter kørslen tjekkes i databasen at hver klub har præcis 1 coach + 2 atleter med aktive medlemskaber og korrekte coach-atlet-koblinger, og loginet testes for én af kontiene.
