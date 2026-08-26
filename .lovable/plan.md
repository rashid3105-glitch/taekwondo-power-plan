# Konklusion: fundet kan ignoreres

## Hvad jeg tjekkede

Alle tre upload-steder for invitations-PDF'er bygger stien på samme måde:

- `src/components/coach/CoachBulkCreateCompetitionDialog.tsx` (linje ~135)
- `src/pages/CoachCompetitions.tsx` (linje ~240)

```text
{auth.uid()}/{Date.now()}-{saneret_filnavn}.pdf
```

Stien er altså IKKE det rå filnavn. Den er præfikset med uploaderens bruger-UUID og et millisekund-timestamp. Filnavnet er kun sidste led.

## Hvorfor der ikke er et hul

Politikken matcher `c.invitation_pdf_url LIKE '%' || storage.objects.name`, hvor `objects.name` er hele stien inkl. UUID-mappen. To brugere kan derfor aldrig kollidere: en anden brugers `invitation.pdf` har et andet UUID-præfiks og et andet timestamp. Suffix-matchet kan kun ramme rækker der peger på præcis samme fulde sti.

`%`-wildcarden findes udelukkende for at understøtte gamle rækker, hvor `invitation_pdf_url` blev gemt som en fuld public URL i stedet for en ren sti. Den kan ikke udvide adgangen ud over samme sti.

Derudover er politikken i forvejen dobbelt-afgrænset: adgang kræver at rækken ejes af brugeren eller er knyttet via `coach_athletes`.

## Foreslået handling

1. Ingen kode- eller migrationsændringer.
2. Marker fundet `competition_invitations_folder_enumeration` som ignoreret i scanneren.
3. Opdatér sikkerhedshukommelsen, så fremtidige scanninger ikke rejser det igen: noter at invitations-stier er UUID- og timestamp-præfiksede, og at suffix-LIKE alene understøtter gamle fulde-URL-værdier.

Ingen andre politikker, tabeller eller filer røres.
