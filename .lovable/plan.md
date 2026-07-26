## Hvad jeg har tjekket (læsning, ingen ændringer)

- Kontoen findes: `eliejbadr@gmail.com`, oprettet 18. marts 2026, e-mail bekræftet, sidste login 18. marts 2026.
- Adressen er **ikke** på spærrelisten (kun én anden adresse er blokeret pga. bounce).
- E-mail-domænet `notify.sportstalent.dk` er verificeret, og køen er sund (13 sendte de sidste 7 dage).
- **Årsagen:** projektet har ingen auth-mailskabeloner opsat. Der er aldrig logget en eneste auth-mail (nulstilling, bekræftelse, magisk link) i afsendelsesloggen — kun app-mails (aktivitetsnotifikationer, samtykke). Nulstillingsmails sendes derfor via standardafsenderen udenom vores egen mailinfrastruktur, uden logning og uden retry, hvilket typisk ender i spam eller slet ikke leveres.

## Hvad jeg gør

1. Sætter adgangskoden på kontoen til `test1234!` via en midlertidig admin-funktion (adgangskoder kan ikke læses, kun overskrives), og bekræfter at login virker.
2. Rydder den midlertidige funktion op bagefter.

## Anbefaling (kan tages i næste runde, ikke med her)

Sæt auth-mailskabeloner op på `notify.sportstalent.dk`, så nulstilling af adgangskode, bekræftelse og magiske links sendes gennem vores egen infrastruktur — med logning, retry og korrekt afsender. Uden det vil "glemt adgangskode" fortsætte med at fejle for andre brugere.

## Teknisk

- Midlertidig edge function med service-role, som kalder `auth.admin.updateUserById` for bruger-id `874b624c-352a-425a-b144-1dfb9e729597`.
- Ingen ændringer i skema, RLS, frontend, native, push eller betaling.
