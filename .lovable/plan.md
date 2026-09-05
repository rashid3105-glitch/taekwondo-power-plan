# Ensartet landefelt på profiler

## Rettelse til min forrige besked
De 6 profiler med "DK" bliver **ikke** behandlet forkert. Opslaget af samtykkealder oversætter allerede "DK", "Denmark" og "Danmark" til det samme land, så de får korrekt 13 år. Problemet er alene, at feltet ser rodet ud og kan give forskellige visninger i lister og filtre.

## Nuværende billede (65 atleter)
- Både fødselsdato og land: 22
- Kun fødselsdato: 5
- Kun land: 33
- Ingen af delene: 5

Lande: Denmark 35, ikke sat 10, Sweden 10, DK 6, Norway 4.

## Hvad der laves
1. **Oprydning nu**: de 6 profiler med "DK" sættes til "Denmark", så feltet står ens overalt. Ingen anden data røres.
2. **Ensartet fremover**: når et land gemmes på en profil, oversættes forkortelser og lokale stavemåder automatisk til det fulde navn, der bruges i landelisten. Så kan der ikke igen opstå to varianter af samme land.
3. **De 10 uden land** forbliver tomme — de har ingen klub, så landet kan ikke afledes. De fanges allerede af den eksisterende opfordring om at udfylde profilen.

## Teknisk
- Dataopdatering (run_sql): `update profiles set country = 'Denmark' where country = 'DK'` afgrænset til atletprofiler.
- Migration: en ny hjælpefunktion `canonical_country_name(text)` (fuldt navn ud fra samme tabel som `normalize_country`) plus en `BEFORE INSERT OR UPDATE`-trigger på `profiles.country`, der skriver det kanoniske navn. `normalize_country` og `consent_age_for_*` røres ikke — de virker allerede korrekt.
- Ingen ændringer i frontend, ingen nye tekster.

## Kontrol
- Kør landefordelingen igen: forventet Denmark 41, Sweden 10, Norway 4, ikke sat 10.
- Gem et land som "dk" på en testprofil og bekræft, at der står "Denmark".
- Bekræft at samtykkealderen for en dansk atlet stadig er 13.
