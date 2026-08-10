# Rapporter i biblioteket + ny licensrapport

Samler alle rapporter ét sted under Bibliotek → Rapporter (kun for trænere), og tilføjer en ny licensrapport med atletens navn, licenstype og udløbsdato. De eksisterende rapportkort på trænerforsiden bevares.

## Bibliotek → Rapporter

Nyt punkt "Rapporter" i biblioteksoversigten, vist på samme måde som "Spørgeskemaer" — kun synligt for brugere med trænerrolle.

Rapporter-siden er en oversigt med fire kort:

1. **Månedlige udviklingsrapporter** — vælg atlet fra klubben, se tidligere rapporter og generér ny (genbruger det eksisterende rapportkort + bulk-generering for hele holdet).
2. **Ugentlig holdrapport (PDF)** — samme PDF-eksport som på trænerforsiden, med ugevælger.
3. **Licensrapport (ny)** — tabel over klubbens atleter.
4. **Testark (PDF)** — genvej til testsessioner, hvor testarkene printes/eksporteres.

Trænerforsiden ændres ikke — kortene ligger begge steder.

## Licensrapport

Tabel med én række pr. atlet pr. licensfelt:

- Atletens navn
- Licenstype (feltnavnet træneren selv har defineret, f.eks. GAL-licens, MyFightBook)
- Licensnummer/værdi
- Udløbsdato
- Status: Udløbet (rød) / Udløber inden for 30 dage (gul) / Gyldig (grøn) / Ikke udfyldt (grå)

Funktioner: sortering på udløbsdato (snarest først), filter på status og licenstype, samt CSV-eksport.

## Teknisk

- Ny side `src/pages/LibraryReports.tsx` (rute `/library/reports`) + `src/components/reports/LicenseReport.tsx`.
- `LibraryChooser.tsx`: tilføj "reports"-kort bag `hasCoachRole`, samme mønster som `surveys`.
- Licensdata hentes fra `coach_license_fields` (feltdefinitioner ejet af klubbens træner) sammenholdt med `profiles.license_values` (JSON: `{ feltId: { value, expires_at } }`) for atleterne i trænerens klub, via samme klub-scoping som resten af træneroversigterne.
- Genbrug af eksisterende komponenter: `MonthlyDevelopmentReportsCard`, `BulkMonthlyReportsCard`, `WeeklySquadExport`.
- Alle nye tekster tilføjes som `t()`-nøgler i alle 7 sprog.
- Ingen databaseændringer.
- `Help.tsx` + changelog opdateres.
