# Selvregistrering af antidoping-kursusdato

## Hvad jeg fandt

Tommy Mortensen (UC Copenhagen, land = Danmark) har i dag ingen vej til selv at registrere datoen for gennemført antidoping-kursus:

- Feltet `antidoping_course_date` på profilen kan i dag **kun** redigeres af en coach inde på en atlets detaljeside (`CoachAthleteDetail`). Der findes ingen tilsvarende indgang på ens egen profil.
- Profilsiden viser kun datoen skrivebeskyttet ("Gennemført: …" / "Ikke registreret").
- Kortet under Bibliotek → Kosttilskudstjek lader danske brugere uploade et certifikat med testdato, men det gemmes i en separat tabel (`antidoping_certificates`) og opdaterer **ikke** profilens `antidoping_course_date` — det er den dato, compliance-alarmerne og licensrapporten bruger.
- Hans profil har rollen "athlete" (roles = [athlete]) selvom hans klubmedlemskab er coach. Han optræder derfor ikke som coach i profilen — men det ændrer ikke problemet, for heller ikke coaches kan sætte deres egen dato.

## Løsning

1. **Selvregistrering på egen profil**
   Under afsnittet "Licenser" på profilsiden (kun når land = Danmark) gøres antidoping-rækken redigerbar: en datovælger + gem-knap, så brugeren selv kan angive datoen for gennemført kursus. Gemmes via samme sikre profil-endpoint som resten af profilopdateringerne.

2. **Certifikat-upload opdaterer også profilen**
   Når en dansk bruger gemmer et certifikat i antidoping-kortet (Bibliotek → Kosttilskudstjek), sættes profilens `antidoping_course_date` automatisk til testdatoen, hvis den er nyere end den nuværende. Så bliver kort, compliance-alarm og licensrapport enige.

3. **Coach-visning uændret**
   Coachens mulighed for at sætte datoen på en atlet bevares som i dag.

4. Tekster tilføjes på alle 7 sprog, og Hjælp + changelog opdateres (v1.5.38).

## Teknisk

- `src/pages/Profile.tsx`: redigerbar antidoping-dato bag `isDanishCountry(country)`; skrivning gennem `update-my-profile` edge-funktionen (klient-skrivning til profiles er begrænset).
- `update-my-profile`: tillad feltet `antidoping_course_date` i whitelisten, hvis det ikke allerede er tilladt (verificeres før ændring).
- `src/components/AntidopingCertificate.tsx`: efter succesfuld insert kaldes samme profilopdatering med testdatoen.
- Ingen ændringer i RLS, triggere eller tabelstruktur.

## Bemærkning (separat spørgsmål)

Tommys profil har `roles = ['athlete']` og `active_role = 'athlete'`, mens hans klubmedlemskab er `coach`. Hvis han skal fremstå som coach i appen, skal profilens roller rettes — sig til, så tager jeg det som en separat opgave.
