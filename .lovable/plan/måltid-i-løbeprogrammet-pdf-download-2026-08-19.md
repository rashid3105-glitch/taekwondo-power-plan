# Måltid i løbeprogrammet + PDF-download

To tilføjelser til Løb-biblioteket: en måltid på det selvbyggede program (som styrer tempo-zoner og fremdrift), og PDF-download af hele programmet.

## 1. Måltid i "Byg dit eget program"

- Nyt felt ved siden af distance/uger: **Måltid** (tt:mm:ss, valgfrit).
- Ud fra måltid og distance beregnes **måltempo** (min/km), som vises tydeligt på programkortet: "Mål: 10 km på 50:00 — 5:00 min/km".
- Sessionerne får konkrete tempo-zoner afledt af måltempoet:
  - Let/restitution: måltempo + ca. 60–90 sek/km
  - Tempo: måltempo + ca. 10 sek/km
  - Intervaller: måltempo − ca. 15–20 sek/km
  - Langtur: måltempo + ca. 45–60 sek/km
- Uden måltid opfører programmet sig præcis som i dag (kun distance).
- De faste programmer (5k, 10k, HM, maraton) ændres ikke.

## 2. Fremdrift mod måltiden

- Løbe-statistikkortet viser, når der er et aktivt program med måltid:
  - Måltempo vs. dit gennemsnitstempo de seneste 4 uger.
  - Estimeret sluttid ud fra dit nuværende tempo, med farvet indikator (på vej / bagud).
  - Bedste tempo på en tur i programperioden.
- Beregnes ud fra allerede loggede løbeture (`diary_entries` med løbedata) — ingen ny logning kræves.

## 3. PDF-download af programmet

- Knap "Download som PDF" på hvert program (både faste og eget).
- PDF'en indeholder:
  - Forside/overskrift med programnavn, mål-distance, evt. måltid og måltempo, antal uger, niveau og startdato.
  - Alle uger som tabel: uge nr., ugens total-km, hver session med dag, fokus og beskrivelse (inkl. tempo-zoner hvis måltid er sat).
  - Tomme felter til håndskrevne noter (faktisk distance/tid) pr. session.
  - Aktiv uge markeret hvis man er tilmeldt programmet.
- Genereres lokalt med jsPDF på brugerens sprog.

## Teknisk

- `src/data/runningPrograms.ts`: `RunProgram` udvides med `goalSeconds?: number`; `buildCustomProgram(goalKm, weeks, currentLongestKm, goalSeconds?)` tilføjer tempo-tekst til `RunSession.detail` via en ny `paceZones()`-hjælper.
- `src/lib/runningProgram.ts`: gemmer/læser `goal_seconds` på enrollment; nye hjælpere `estimateFinishTime()` og `recentAvgPace()` oven på eksisterende `fetchRunLogs`/`formatPace`.
- Migration: `ALTER TABLE public.running_program_enrollments ADD COLUMN goal_seconds integer` (nullable, ingen RLS-ændringer).
- `src/components/RunningLibrary.tsx`: nyt måltid-input (mm:ss / t:mm:ss parsing), visning af måltempo, PDF-knap pr. program.
- Ny fil `src/lib/runningProgramPdf.ts` efter samme mønster som `src/lib/testSheetPdf.ts` (jsPDF, oversættelser pr. locale i filen).
- `src/components/RunningStatsCard.tsx`: fremdriftssektion mod måltiden.
- Alle nye tekster tilføjes i `src/i18n/translations.ts` for alle 7 sprog.
- Changelog og Help.tsx opdateres.
