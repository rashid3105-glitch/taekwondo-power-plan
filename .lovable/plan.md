## Mål

Gennemgå hele hjælpecentret (`src/pages/Help.tsx`) og bringe det op til dato med systemet, som det ser ud i dag. Alle tekster leveres på **da, en, sv, de, ar, no, es**.

## Nuværende tilstand

- 23 hjælpe-emner fordelt på 5 sektioner (Training / Health / Mental / Coach / Account).
- Ca. 282 `Title` + `Steps` nøgler i `src/i18n/translations.ts` × 7 sprog.
- Changelog stopper ved 2026-07-02 (`v1.2.9`). Sidste ~4 måneders arbejde er ikke dokumenteret.

## Del 1 — Audit af eksisterende emner

For hvert af de 23 emner læses den nuværende `helpXxxSteps` tekst og sammenholdes med den faktiske UI/flow. Rettelser omfatter:

- Forældede menu- og knapnavne (fx efter at "Fremmøde-rapport" er flyttet ind i "Dagens træning", trash-ikonet er flyttet fra dashboard til atlet-detalje, samtykke-flow med genudsend osv.).
- Nye trin/valg der er kommet til (fx wearables recovery-trends, kostplan manuel indtastning, coach mental review, klub-landing, superadmin-flow).
- Fjernelse af omtale af features der ikke længere findes.
- Konsistent tone og ordvalg (dansk primær, oversat direkte).

Emner der ganske sikkert skal redigeres: `helpProfile`, `helpTrainingPlan`, `helpSeasonPlan`, `helpSeasonCalendar`, `helpWearables`, `helpCoachFeedback`, `helpMatchAnalysis`, `helpMatchReport`, `helpProgress`, `helpNutrition`, `helpRehabPlan`, `helpMentalPlan`, `helpDiary`, `helpReflection`, `helpAddStudents`, `helpStudentProgress`, `helpChat`, `helpWeeklyReport`, `helpParentPortal`, `helpRoles`, `helpRoleSwitcher`, `helpLibrary`, `helpPhysicalTesting`.

## Del 2 — Nye emner der skal tilføjes

| Nøgle | Sektion | Dækker |
|---|---|---|
| `helpConsents` | Coach | Samtykke-oversigt: status pr. atlet, send til forælder (mindreårig), send til atlet selv (voksen), genudsend, udløb af tokens. |
| `helpAttendance` | Coach | Dagens træning: markering af fremmøde, skadet-status, fremmøde-rapport-knappen (`BarChart3`), statistik-dialogen. |
| `helpDeleteAthlete` | Coach | Sletning af atlet fra atlet-detaljesiden inkl. bekræftelsesdialog og hvad der slettes/beholdes. |
| `helpCoachMentalReview` | Mental | Månedlig coach-mental vurdering, hvorfor og hvordan. |
| `helpSubscription` | Account | Abonnement, planer, valuta, ændring/opsigelse, betalings-status. |
| `helpSecurity` | Account | Adgangskode, passkey/biometri, log ud af alle enheder. |
| `helpDeleteAccount` | Account | Slet egen konto, hvad slettes, GDPR. |
| `helpNotifications` | Account | Push-notifikationer, e-mails, afmelding via `/unsubscribe`. |

Hver nøgle får `Title` + `Steps` i `translations.ts` på alle 7 sprog, indekseres i `TOPICS`, `SECTIONS` opdateres, og alle får `isNew: true` (eksisterende `isNew` flag som er >30 dage gamle fjernes samtidig så badgen ikke bliver meningsløs).

## Del 3 — Changelog

Tilføjes øverst i `CHANGELOG`-arrayet (nyeste først). Nye datoer dækker perioden 2026-07-03 → i dag med korte oneliners for:

- Fremmøde-rapport-knap flyttet ind i "Dagens træning".
- Coach-samtykke-side med send/genudsend for forældre og voksne atleter.
- Sletning af atlet nu kun fra atlet-detalje med bekræftelse.
- Papirkurv skjult i dashboard-oversigten.
- Evt. andre relevante commits fra perioden (tjekkes ved implementering).

Bumpes til passende semver (patch pr. tweak, minor for ny samtykke-flow). Hver post får `build`-tag.

## Del 4 — Tekniske detaljer

- Alle nye nøgler tilføjes i `src/i18n/translations.ts` under samme mønster som eksisterende (`helpXxxTitle`, `helpXxxSteps`, `changelogEntryNNN`, `changelog_YYYY_MM_DD`).
- Ingen ændringer til `Help.tsx`-layout eller komponenter — kun `TOPICS`, `SECTIONS.topics` og `CHANGELOG` arrays.
- Ikoner genbruges fra allerede importerede `lucide-react` symboler; enkelte nye kan tilføjes til import-listen (fx `Shield`, `Bell`, `Trash2`, `CreditCard`).
- Ingen backend-ændringer.
- Verifikation: build/typecheck, plus stikprøve-visning af Help-siden på DA og EN.

## Leverance

- Opdateret `src/pages/Help.tsx` (topics + changelog arrays).
- Opdateret `src/i18n/translations.ts` med alle nye/reviderede strings × 7 sprog.
- Kort ændringsoversigt i svaret.
