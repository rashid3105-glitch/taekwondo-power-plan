# Færdiggør AssistantDisclosure-dækning (EU AI Act art. 50)

Første halvdel er allerede på plads (kostplan, forældreguide, assistent-chat, dashboard-planer, coach-visning af atlet). Denne plan afslutter resten.

## Hvad der tilføjes

Noten placeres altid dér hvor det genererede indhold vises — ikke bag en udfoldning og ikke kun før generering.

| Skærm | Fil | Variant |
|---|---|---|
| Onboarding, hvor første plan sættes i gang | `src/pages/Onboarding.tsx` | short |
| Mental vurdering, atlet (genererede råd) | `src/components/MentalAssessment.tsx` | full |
| Mental vurdering, træner | `src/components/CoachMentalAssessment.tsx` | full |
| Kamprapport | `src/components/match/MatchReportButton.tsx` | full |
| Sundhedsrapport (i selve visningen) | `src/pages/Health.tsx` | full |
| Månedlige udviklingsrapporter | `src/components/coach/MonthlyDevelopmentReportsCard.tsx` | short |
| Bulk-månedsrapporter | `src/components/coach/BulkMonthlyReportsCard.tsx` | short |
| Ugentlig trup-eksport | `src/components/coach/WeeklySquadExport.tsx` | short |
| Konkurrenceplan | `src/pages/Competitions.tsx` | full |
| Konkurrenceplan, coach-fane | `src/components/coach/AthleteOverviewTab.tsx` | short |
| Konkurrencerefleksion | `src/components/PostCompetitionReflection.tsx` | short |

Til sidst opdateres changelog i `src/pages/Help.tsx`.

## Et forbehold der kræver din beslutning

Den engelske hardkodede tekst i `src/pages/Health.tsx` (omkring linje 336) ligger ikke i brugerfladen — den skrives ind i den genererede PDF via jsPDF. En React-komponent kan ikke indsættes i en PDF, og der må ikke oprettes nye oversættelsesnøgler.

Planen håndterer det sådan: `AssistantDisclosure` tilføjes i selve sundhedsrapport-visningen på skærmen, så brugeren ser den oversatte note før download. PDF-teksten lades urørt i denne omgang. Hvis PDF-teksten også skal oversættes, kræver det enten en ny nøgle eller genbrug af en eksisterende — sig til, så laver jeg det som et separat skridt.

## Tekniske noter

- Ingen nye komponenter og ingen nye oversættelsesnøgler; kun import og placering af den eksisterende `AssistantDisclosure`.
- Ingen ændringer i forretningslogik, edge-funktioner eller databaseskema.
- Ordene "AI" og "kunstig intelligens" optræder ikke i nogen synlig tekst; de eksisterende "automatiseret"-oversættelser bruges uændret.
- SeasonCalendar er regelbaseret og får bevidst ingen note.
- Til sidst køres en typecheck, og der laves en samlet liste over ændrede filer og valgt variant pr. sted.
