# Automatisk oprydning, så slettefristerne faktisk overholdes

Formålet: de frister, der skrives i fortegnelsen, håndhæves af systemet selv i stedet for af en manuel rutine. Én natlig kørsel gennemgår alle kategorier og skriver resultatet i driftsloggen, så det kan dokumenteres over for en tilsynsmyndighed.

## Fristerne der håndhæves

| Kategori | Frist | Hvad der sker | Varsel |
|---|---|---|---|
| Inaktiv atletkonto | 12 mdr. uden login | Hele kontoen slettes | Ja — mail 30 dage før |
| Atlet der forlader klubben | 90 dage efter medlemskab er afsluttet | Helbredsdata slettes; kontoen og medlemshistorikken består | Nej |
| Klub der har opsagt licensen | 90 dage efter ophørsdato | Klubbens atletdata slettes | Ja — mail til klubadmin ved dag 0 og dag 60 |
| Chatbeskeder markeret slettet | 30 dage | Fjernes endeligt fra databasen | Nej — brugeren har selv slettet dem |
| Chattråde uden aktivitet | 12 mdr. | Tråd og beskeder fjernes | Nej |
| Videooptagelser | 24 mdr. fra upload | Videofil, tags, noter og tegninger fjernes | Ja — mail til ejeren 30 dage før |
| Log- og driftsdata | 90 dage | Mail-log, AI-log, jobkørsler | Nej |
| Samtykkedokumentation | 5 år efter tilbagetrækning eller sletning | Fjernes | Nej |

Varsel gives kun der, hvor et menneske realistisk kan nå at reagere og ønsker det: sletning af en hel konto, af en klubs data og af video. De øvrige kategorier er enten brugerens egen sletning, der blot gøres endelig, eller driftsdata.

Bogføringsmateriale (5 år) ligger hos Stripe og i bogføringen, ikke i appens database — ingen jobkørsel.

## Klubophør må ikke bygge på licensflaget

19 klubber står i dag som "licens ikke aktiv" — det dækker prøveklubber og klubber, der aldrig kom i gang. Ryddes der op på det flag, forsvinder rigtige data.

Der tilføjes derfor et selvstændigt felt for ophørsdato, som kun sættes bevidst (af dig i admin eller ved en reel opsigelse). Kun klubber med en sat ophørsdato ryddes op, og først 90 dage efter.

## Sikkerhedsforanstaltninger

- **Tørkørsel som standard.** Hver kategori starter i observationstilstand: den tæller og logger, hvad den ville slette, men sletter intet. Du gennemgår en uges logfiler og slår kategorierne til én ad gangen.
- **Loft pr. kørsel.** Maksimalt 200 konti og 500 rækker pr. kategori pr. nat, så en fejl ikke kan tømme databasen på én gang.
- **Login nulstiller fristen.** Modtager en atlet varslet og logger ind, forsvinder kontoen ikke.
- **Adminside.** Viser seneste kørsler, hvad der blev slettet eller ville blive slettet pr. kategori, og en kontakt pr. kategori til at slå tørkørsel fra.

## Teknisk

Sletningen kan ikke ligge i ren SQL: konti findes også i login-systemet, videoer ligger som filer, og varsler skal i mailkøen. Derfor:

- `pg_cron` kalder dagligt kl. 03:15 UTC en ny serverfunktion `retention-cleanup` (service role) via `pg_net`. Ét job, ikke otte.
- Ny tabel `retention_policies`: kategori, frist i dage, aktiv, tørkørsel, loft. Fristerne kan justeres uden ny kode. Kun platformadmin kan læse og ændre den.
- `retention-cleanup` genbruger `supabase/functions/_shared/deletion-lists.ts` og samme fremgangsmåde som `delete-my-account` — anonymisér fælles data, slet egne data, fjern filer, slet login-brugeren. Ingen ny sletteliste, så de to kan ikke komme ud af trit.
- Resultatet skrives til den eksisterende `scheduled_job_runs` (én række pr. kørsel, antal pr. kategori i `meta`).
- Enkeltkørsel sikres med en lease-række, så to kørsler ikke overlapper; kørslen stopper, når loftet er nået, og tager resten næste nat.
- Varsler sendes via den eksisterende `enqueue_email`-funktion — aldrig direkte til Resend. En ny skabelon til varsel om sletning i `_shared/transactional-email-templates/`, på alle syv sprog.
- Ny kolonne `clubs.license_ended_at` og et felt til at sætte den i admin-klubvisningen.
- Ny adminside `src/pages/admin/AdminRetention.tsx` (kun platformadmin), tekster på alle syv sprog, changelog i `src/pages/Help.tsx`.
- Privatlivspolitikkens opbevaringsafsnit opdateres med de faktiske frister, på alle syv sprog.

## Rækkefølge

1. Tabel, kolonne, serverfunktion og cron-job — alle kategorier i tørkørsel.
2. Adminside, varselsmail og privatlivspolitik.
3. Du gennemgår en uges tørkørsel; derefter slår vi sletningen til kategori for kategori.

Intet deployes, og intet slettes, før du har set tørkørslens tal.
