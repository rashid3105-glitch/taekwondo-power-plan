# Næste skridt: Fase 2 — Sport-drevet gradsystem

## Status efter fase 1 (bygget)

- `clubs.sport` kolon findes, default `'taekwondo'`, alle eksisterende klubber backfilled
- `src/config/sportProfiles.ts` — klient-side taksonomi for 4 sportsgrene (taekwondo, karate, kickboxing, fitness)
- `src/hooks/useSportProfile.ts` — hook der resolver sportsprofil fra klub
- `/admin/sport-preview` — admin-side hvor sport pr. klub vælges og profilen vises live
- Intet i selve appen læser fra sport-profilen endnu — alt kører uændret på taekwondo

## Hvad fase 2 gør

Første bruger-synlige ændring: når en atlet tilhører en karate-/kickboxing-/fitness-klub, viser appen sportens grad-label og gradstige i stedet for hardkodet "Bælte" + TKD-bælter. For taekwondo-klubber ændres intet.

```text
TKD-klub:                         Karate-klub:
  Grad: Rød bælte                   Grad: 3. kyu (brun)
  ( dropdown med TKD bælter )       ( dropdown med karate-grader )
```

## Tilgang: dual-read (ingen big-bang)

`belt_level` kolonnen i `profiles` bevares uændret — den er stadig en text-kolonne der gemmer atletens aktuelle grad. Det der ændres er udelukkende hvordan UI'en **viser** label og dropdown-valg:

1. UI-komponenter der viser/redigerer grad henter `gradeLabel` og `grades[]` fra `useSportProfile()` i stedet for at hardkode "Bælte" og en TKD-bælte-liste
2. Eksisterende data (alle atleter har TKD-bæltenavne som "Rød bælte") forbliver gyldige for TKD-klubber
3. For nye ikke-TKD-klubber vises sportens egen gradstige som dropdown

## Berørte filer (~25 UI + ~12 edge functions)

**UI (hvor `belt_level` vises eller redigeres):**
- `ProfileSetup.tsx`, `ProfileEdit.tsx`, `Onboarding.tsx` — grad-dropdown ved onboarding/profil
- `Dashboard.tsx`, `Profile.tsx` — visning af grad på profil/dashboard
- `CoachAthleteDetail.tsx`, `CoachAthleteOverview.tsx`, `CoachDashboard.tsx`, `SquadOverview.tsx` — coach-visning
- `ParentDashboard.tsx` — forældre-visning
- `PublicAthlete.tsx`, `AdminApproval.tsx` — offentlig/admin-visning
- `CreateAthleteDialog.tsx` — coach opretter atlet
- `MentalAssessment.tsx`, `CoachMentalAssessment.tsx`, `CoachMentalReview.tsx` — mental-kontekst
- `NutritionPlan.tsx`, `PostCompetitionReflection.tsx`, `MatchReportButton.tsx`, `VideoTagger.tsx`, `WeeklySquadExport.tsx`, `GlobalAppMenu.tsx`, `Library.tsx`

**Edge functions (hvor `belt_level` sendes i AI-prompt):**
- `generate-plan`, `generate-nutrition-plan`, `generate-rehab-plan`, `generate-mental-advice`, `generate-match-report`, `generate-competition-plan`, `generate-competition-reflection`, `generate-weekly-athlete-summary`, `generate-coach-mental-advice`, `parent-guide-chat`, `create-athlete`, `update-my-profile`
- Disse kan beholde "Belt"/"belt_level" i prompt-teksten (AI forstår det) — de skal bare ikke antage at værdien altid er et TKD-bælte

## Konkret arbejde

1. **Udvid `useSportProfile`** så den leverer `gradeLabel` + `grades[]` klar til UI-brug (allerede i config, hook skal bare returnere dem bekvemt)
2. **Lav en `GradePicker`-komponent** der tager sport-profil og renderer en dropdown med sportens gradstige
3. **Skift grad-visninger** i de vigtigste bruger-flader (onboarding, profil, dashboard, coach-oversigt) til at bruge sport-drevet label
4. **Edge functions**: send sport + gradeLabel med i payload, så prompten kan sige "Niveau: Øvet" for kickboxing i stedet for "Belt: Øvet"
5. **Bibliotek-indhold** (`Library.tsx`): skjul poomsae-teknikker for ikke-TKD sportsgrene, vis sportens egne færdigheder
6. **Test**: bekræft at TKD-klubber er 100% uændrede

## Hvad der IKKE gøres i fase 2

- Teknik/færdigheds-systemet (fase 3) — `club_techniques`, match-tags forbliver TKD
- Indhold/generatorer sport-bevidste (fase 4) — øvelses-/drill-bibliotek forbliver TKD
- Terminologi/i18n-omdøbning (fase 5) — `tkd_sessions_per_week` omdøbes først senere
- Flytning af taksonomi fra klient-side til database — kan gøres senere når der er flere sportsgrene

## Forventet omfang

Mellem indsats — ~3-4 arbejdsrunder. Fokus er på de vigtigste bruger-flader (onboarding, profil, dashboard, coach-oversigt) først, derefter edge functions og resten.
