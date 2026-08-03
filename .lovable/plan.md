# Vægtmodul — professionel vægtplanlægger

Et samlet vægtmodul, der **erstatter den nuværende kostplanlægger** under Kost/Ernæring. Det dækker både daglig vægtstyring (Lifesum-stil: mål, kurve, kaloriebudget) og stævne-vægtudtag med sikkerhedsgrænser. Coach kan se og redigere atletens mål.

## Erstatning af kostplanlæggeren

- Genvejskortet "Kostplanlægger & madregistrering" på Kost-forsiden udskiftes med "Vægt & kalorier", som åbner det nye modul.
- Madregistrering (madscanner, måltidslog, dagens kalorier) flyttes med ind i det nye modul som fanen "I dag", så intet funktionalitet går tabt — den ligger nu under vægtbudgettet i stedet for som selvstændig planlægger.
- Den AI-genererede kostplan (`generate-nutrition-plan`) bevares som en fane/sektion inde i modulet, men er ikke længere hovedindgangen.
- "Alle opskrifter" står uændret som eget genvejskort.

## Sådan opleves det

Vægtmodulet åbner på status og indeholder:


1. **Toppen — status**
   - Stor aktuel vægt, ændring siden start, afstand til mål.
   - Ring/bar med fremdrift i procent mod målvægt.
   - Hurtig vejning: ét felt + knap, samt "vejet i dag"-markering og streak (antal dage i træk/uge med vejning).

2. **Målkort**
   - Sæt startvægt, målvægt og måldato. Vælg hastighed (rolig 0,25 / moderat 0,5 / hurtig 0,7 kg pr. uge) eller lad appen udregne hastigheden ud fra måldato.
   - Retning udledes automatisk: vægttab, vedligehold eller vægtøgning.
   - Systemet viser dagligt kalorieover-/underskud der matcher hastigheden (7.700 kcal ≈ 1 kg) og et estimeret dagligt kaloriemål baseret på profilens data.
   - Sikkerhedsspærring: For unge atleter (under 18) og ved hastigheder over 0,7 kg/uge vises en tydelig advarsel, og planlagt tempo begrænses med en anbefaling om at vælge en højere vægtklasse i stedet.

3. **Kurve**
   - Graf med daglige vejninger, 7-dages glidende gennemsnit (den linje man skal se på — som Lifesum), målvægtslinje og en prognoselinje frem til måldato.
   - Skift mellem 30 dage / 90 dage / alt.
   - Under grafen: "Med nuværende tempo når du målet den …" / "Du er X dage foran/bagud".

4. **Stævne-vægtudtag**
   - Hvis der er et kommende stævne med vægtklasse: kort med nedtælling, kg til vægtklasse, og om det er inden for sikker rate.
   - Trafiklys: grøn (inden for 0,7 kg/uge), gul (stramt), rød (over 5 % af kropsvægten på under 14 dage).
   - Knap til den eksisterende peaking-/vægtplan-generering, med de eksisterende advarsler og PDF/print bevaret.

5. **Milepæle**
   - Automatiske milepæle for hver hele/halve kg mod målet, med en lille markering i grafen.

6. **Coach**
   - Coach ser vægtmodulet på atletens profil (Administrer → atlet) med samme kurve og status.
   - Coach kan sætte/ændre målvægt, måldato og hastighed for atleter de administrerer; ændringer markeres som sat af coach.
   - Atleten kan se hvem der har sat målet.

Alt tekst gennem `t()` på alle 7 sprog. Ingen røde prikker i bundnavigationen berøres.

## Teknisk

**Database**
- Ny tabel `weight_goals`: `user_id`, `club_id`, `start_weight_kg`, `start_date`, `target_weight_kg`, `target_date`, `rate_kg_per_week`, `direction` (loss/maintain/gain), `set_by` (uuid), `is_active`, timestamps. GRANTs til `authenticated` + `service_role`; RLS: atlet fuld adgang til egne rækker, coach læse/skrive for administrerede atleter (samme mønster som `training_plans`/`rehab_plans`), forældre og admin læseadgang.
- `weight_logs` genbruges uændret som datakilde (upsert pr. `user_id,log_date`).

**Frontend**
- `src/lib/weightPlanner.ts`: ren logik — glidende gennemsnit, lineær prognose, ETA, kalorieunder-/overskud, sikkerhedsvurdering (rate, 5 %-regel, <18 år), milepæle. Enhedstestbar, ingen UI.
- `src/components/weight/WeightModule.tsx`: hovedvisning, tager `userId` + `readOnly`/`canEditGoal`.
- Underkomponenter: `WeightStatusCard`, `WeightGoalDialog`, `WeightTrendChart` (recharts, allerede i projektet), `CompetitionWeightCard`.
- Wiring: ny `nutritionView === "weight"` i `src/pages/Dashboard.tsx` med genvejskort; samt et sammenklappeligt panel i `src/components/CoachAthleteDetail.tsx` via eksisterende `CollapsiblePanel`.
- Stævnekortet genbruger `generate-competition-plan` og `CompetitionPlanDialog` uden ændringer i edge-funktionen.

**Øvrigt**
- Nye i18n-nøgler i `src/i18n/translations.ts` for alle 7 sprog.
- `src/pages/Help.tsx`: ny guide-sektion "Vægt" + changelog v1.5.14.
- Ingen nye npm-pakker.
