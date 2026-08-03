# Kostplanlægger: guidet opsætning

Første gang en atlet åbner vægt-/kostmodulet, møder de et trin-for-trin flow i stedet for én stor dialog. Overblikssiden røres ikke i denne runde.

## Flowet

Fuldskærms-wizard i Noir & Gold-stil med tynd fremdriftsbjælke i toppen, ét spørgsmål ad gangen, store trykbare kort og "du kan altid ændre det senere" som hjælpetekst.

1. **Fokus** — Tabe sig / Opbygge muskler / Holde vægten
2. **Køn** — forudfyldt fra profilen
3. **Alder** — forudfyldt fra profilen
4. **Nuværende vægt** — forudfyldt fra seneste vejning eller profil
5. **Målvægt** — springes over ved "Holde vægten"
6. **Tempo** — 0,25 / 0,5 / 0,7 kg pr. uge med sikkerhedslinje, eller måldato
7. **Aktivitetsniveau** — Stillesiddende → Ekstra aktiv (justerer kaloriebehovet)
8. **Hvad er vigtigt for dig** — flervalg (fx præstation, restitution, vægtklasse, energi, spise uden strenge kure)
9. **Hvad er udfordrende** — flervalg (fx portionsstørrelser, rutiner, fristelser, inspiration)
10. **Opretter din plan** — kort animation med 4 delmål, der tikker til 100 %, hvorefter målet gemmes og overblikket vises

Alle trin viser profilens kendte værdi udfyldt, så atleten kun skal bekræfte. Tilbage-knap på hvert trin.

## Efter opsætning

- Wizarden vises kun første gang. Er der allerede et aktivt mål, går man direkte til overblikket.
- Redigering sker fortsat i den nuværende kompakte måldialog.
- Et lille "Kør opsætning igen"-punkt i måldialogen, hvis man vil starte forfra.
- Coach kan køre wizarden for en atlet fra atletpanelet på samme måde.

## Teknisk

- Ny mappe `src/components/weight/onboarding/` med `WeightOnboarding.tsx` (state, trin-router, gemning) og små trin-komponenter (`StepChoice`, `StepNumber`, `StepMulti`, `StepBuilding`).
- Fokus → `direction` i det eksisterende `weight_goals`-skema; tempo/måldato/vægte bruger de felter, der allerede findes.
- Migration: tilføj `activity_level`, `motivations text[]`, `challenges text[]` og `onboarded_at` til `weight_goals` (RLS-politikker og grants findes allerede på tabellen).
- Aktivitetsniveau bruges som ny faktor i `estimateMaintenanceCalories()` i `src/lib/weightPlanner.ts`, med nuværende sessions-baserede beregning som fallback.
- Alder/køn/vægt læses fra `profiles` + seneste `weight_logs`; wizarden skriver ikke tilbage til profilen.
- `WeightModule.tsx` afgør efter indlæsning, om wizarden skal vises (intet aktivt mål) eller overblikket.
- Alle tekster som nye nøgler i `src/i18n/translations.ts` for alle 7 sprog.
- Help.tsx opdateres med kort guide + changelog v1.5.15.

## Ikke med i denne runde

Redesign af selve overblikket (statuskort, graf, milepæle) — tages næste gang.
