# Aldersgrænse for samtykke: status og det, der mangler

## Hvad jeg kontrollerede (bekræftet i dag)

**Fødselsdatoer — de tre mekanismer findes:**

- Ikke-blokerende opfordring til atleten (`BirthDateGate`), kan snoozes, kommer igen næste session.
- Træneren kan sætte datoen (`SetBirthDateDialog`) plus et kort på trænerforsiden med de atleter, der mangler (`MissingBirthDatesCard`).
- Nye atleter kan ikke oprettes uden gyldig fødselsdato (`create-athlete` afviser med `BIRTH_DATE_REQUIRED`).
- Eksisterende atleter er ikke låst ude: ukendt fødselsdato går til voksen-flowet, ikke til værge-væggen.
- Tal lige nu: 72 atleter, 42 uden fødselsdato.

**Landeafhængig grænse — kun halvt på plads:**

- Databasen har det hele: tabel med 28 landegrænser, `consent_age_for_athlete()` (klubland > bopælsland > platformstandard, kilde "strictest") og en rapportfunktion.
- Men intet i appen bruger det. Både samtykkeporten, trænernes samtykkeoversigt og oprettelsen af nye atleter regner stadig med fast 18 år (`DEFAULT_CONSENT_AGE`). Så konklusionen i teksten holder: der indhentes værgesamtykke for flere end nødvendigt.

## Forslag: tag den landeafhængige grænse i brug

1. **Én kilde til grænsen.** Ny letvægts-RPC/forespørgsel, der for en given atlet returnerer den gældende alder fra `consent_age_for_athlete()`, med 18 som fallback hvis kaldet fejler (fail-safe, aldrig lavere end fallback ved fejl).
2. **Samtykkeporten** (`ConsentGate`) henter atletens gældende grænse og bruger den i stedet for 18. Uændret opførsel ved ukendt fødselsdato.
3. **Trænernes samtykkeoversigt** (`CoachConsents`) bruger samme grænse pr. atlet, så listen "kræver værge" bliver retvisende.
4. **Oprettelse af ny atlet** (`create-athlete`): afgørelsen "minor" træffes ud fra klubbens land via samme databasefunktion i stedet for fast 18.
5. **Ingen automatisk nedgradering af eksisterende samtykker.** Allerede indhentede værgesamtykker bevares; ingen status ændres af denne ændring.
6. **Admin-overblik:** lille kort på statistiksiden, der viser gældende grænse pr. klub og hvor mange atleter der reelt kræver værgesamtykke.

## Juridisk beslutning, der skal træffes først

`consent_age_source` står på "strictest" (den strengeste af klubland/bopælsland). Danmark ligger på 13 i tabellen, men jeres nuværende praksis er 18. Punkt 1-4 ændrer reelt praksis, så I bør bekræfte: skal grænsen følge landet (DK = 13/15), eller skal platformen bevidst ligge højere end loven kræver? Grænsen skal følge landet

## Teknisk

Rørt: `src/lib/age.ts` (async grænseopslag ved siden af den eksisterende synkrone), `src/components/ConsentGate.tsx`, `src/pages/CoachConsents.tsx`, `supabase/functions/create-athlete/index.ts`, ny migration med en `SECURITY DEFINER`-wrapper der kan kaldes af `authenticated`. Ingen ændringer i `Consent.tsx`, e-mailskabeloner eller `send-consent-reminders`.