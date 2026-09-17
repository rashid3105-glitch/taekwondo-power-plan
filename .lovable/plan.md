# Automatisk oprydning, så slettefristerne faktisk overholdes

Formålet er, at de frister der skrives i fortegnelsen bliver håndhævet af systemet selv — ikke af en manuel rutine. Alt kører i databasen én gang i døgnet.

## Sådan kommer det til at virke

En natlig oprydning kl. 03:15 gennemgår otte frister. Hver kørsel skriver en linje i driftsloggen (hvor mange rækker blev berørt pr. kategori), så du kan dokumentere over for en tilsynsmyndighed, at fristerne overholdes.

Ingen sletning sker uden varsel, hvor et menneske kan nå at reagere.

## Fristerne der håndhæves

| Kategori | Frist | Hvordan |
|---|---|---|
| Inaktiv atletkonto | 12 mdr. uden login | Mail-varsel efter 11 mdr., sletning efter 12 |
| Atlet der forlader klubben | 90 dage | Helbredsdata slettes, medlemskab beholdes som historik |
| Klub der opsiger licensen | 30 dages eksport + 90 dage | Kræver ny dato for ophør (se nedenfor) |
| Chatbeskeder (soft delete) | 30 dage | Endelig fjernelse fra databasen |
| Chattråde | 12 mdr. uden aktivitet | Tråd og beskeder fjernes |
| Videooptagelser | 24 mdr. fra upload | Både databaserække, tags, noter og selve videofilen |
| Log- og driftsdata | 90 dage | Mail-log, AI-log, jobkørsler |
| Samtykkedokumentation | 5 år efter tilbagetrækning/sletning | Beholdes bevidst længere — dokumentationspligt |

Bogføringsmateriale (5 år) ligger hos Stripe og bogføringen, ikke i appens database — ingen jobkørsel.

## Vigtigt: klubophør må ikke bygge på licensflaget

19 klubber står i dag som "licens ikke aktiv" — det dækker prøveklubber og klubber, der aldrig er kommet i gang. Sletter oprydningen på det flag, forsvinder rigtige data.

Derfor tilføjes et selvstændigt felt for ophørsdato, som kun sættes bevidst (af dig i admin, eller når et abonnement reelt opsiges). Kun klubber med en sat ophørsdato ryddes op, og først 90 dage efter.

## Sikkerhedsforanstaltninger

- **Tørkørsel som standard.** Oprydningen starter i observationstilstand: den tæller og logger, hvad den ville slette, men sletter intet. Du gennemgår en uges logfiler og slår den derefter til.
- **Dagligt loft.** Maksimalt 500 rækker pr. kategori pr. kørsel, så en fejl ikke kan tømme databasen på én nat.
- **Varsel før kontosletning.** Atleten får en mail 30 dage før, med besked om at et login nulstiller fristen.
- **Adminside.** Ny side under admin, der viser de seneste kørsler, hvad der blev slettet, og en knap til at slå tørkørsel fra/til.

## Teknisk

- Ny tabel `retention_policies` (kategori, frist i dage, aktiv, tørkørsel) — fristerne kan justeres uden ny kode.
- Databasefunktion `run_retention_cleanup()` (security definer): læser politikkerne, kører hver kategori med `LIMIT`, skriver resultat til den eksisterende `scheduled_job_runs`.
- Enkeltkørsel sikres med en låsning (`pg_advisory_lock`), så to kørsler ikke overlapper.
- `pg_cron`-job dagligt kl. 03:15 UTC — én samlet kørsel, ikke otte separate jobs.
- Ny kolonne `clubs.license_ended_at` + felt i admin-klubvisningen.
- Videofiler fjernes fra storage via en edge-funktion, der kaldes fra oprydningen; databaserækker fjernes først når filen er væk.
- Varslingsmails sendes gennem det eksisterende `enqueue_email`/`email_queue` — ikke direkte til Resend.
- Ny adminside `src/pages/admin/AdminRetention.tsx`, tekster på alle syv sprog, changelog i Help.tsx.
- Privatlivspolitikkens opbevaringsafsnit opdateres med de faktiske frister på alle syv sprog.

## Rækkefølge

1. Tabel, kolonne, funktion og cron-job — i tørkørsel.
2. Adminside og privatlivspolitik.
3. Du gennemgår en uges tørkørsel, og vi slår sletningen til kategori for kategori.
