# Underleverandører: liste til download + afsnit i privatlivspolitikken

## Hvad du får

1. **Et regneark til download** (Excel) med alle underleverandører og de oplysninger, en databehandleraftale/fortegnelse kræver.
2. **Et nyt afsnit i privatlivspolitikken** på siden Privatliv, hvor de samme leverandører står i en overskuelig tabel — på alle syv sprog.

## Kolonner i regnearket

- Leverandør (juridisk navn)
- Rolle/formål i appen
- Kategorier af data der behandles
- Behandlingssted (EU/USA)
- Overførselsgrundlag (EU-standardkontrakter mv.)
- Underleverandør til (Lovable / direkte aftale)
- Website / privatlivspolitik

## Leverandører på listen

| Leverandør | Formål |
|---|---|
| Lovable | Hosting af app og systemmails |
| Supabase (Lovable Cloud) | Database, login, filer, serverfunktioner |
| Google (Gemini via Lovable AI Gateway) | Genererede planer, analyser, rådgivning |
| Stripe | Betaling og abonnement |
| Google Firebase Cloud Messaging | Push-beskeder |
| Apple (App Store / TestFlight) | Distribution af iOS-app |
| Google Play | Distribution af Android-app |
| Apple Health / Health Connect | Sundhedsdata — behandles lokalt på telefonen, ingen overførsel |

Sundhedsintegrationerne markeres tydeligt som "ingen dataoverførsel — lokal på enheden", så listen ikke giver indtryk af flere modtagere end der reelt er.

## Teknisk

- Regnearket bygges som `.xlsx` og lægges i dine dokumenter, klar til download. Ingen ændring i appens kode.
- Privatlivspolitikken: nyt afsnit i `src/pages/PrivacyPolicy.tsx` med en tabel, der læser fra en ny liste i `src/data/subprocessors.ts` (ét sted at vedligeholde).
- Nye oversættelsesnøgler i `src/i18n/translations.ts` for overskrift, indledning og kolonnenavne på alle syv sprog. Selve leverandørnavne og URL'er oversættes ikke; formål og datakategorier oversættes.
- Changelog-punkt i `src/pages/Help.tsx`.
- Ingen databaseændringer, ingen ændring af samtykkeflow, Stripe eller edge-funktioner.

## Bemærkning

Overførselsgrundlag og behandlingssted udfyldes ud fra leverandørernes offentlige oplysninger. Du bør bekræfte dem mod dine egne databehandleraftaler, før listen bruges i en officiel fortegnelse.
