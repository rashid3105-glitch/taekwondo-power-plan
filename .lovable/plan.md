## Mål

Man kan vælge ét aktivt løbeprogram fra biblioteket, registrere sine løb (fra dagbogen eller direkte fra Fremgang), og følge sin progression i en graf: **planlagt km pr. uge vs. faktisk løbet km pr. uge**.

## 1. Aktivt løbeprogram (database)

Ny tabel `running_program_enrollments`:
- `user_id`, `program_id` (fx `run-10k` eller `custom-7km-8w`)
- `goal_km`, `weeks`, `per_week`, `level`
- `plan` (JSON – hele ugeplanen, så custom-programmer også kan gemmes og grafens "planlagt" er stabil)
- `start_date` (default i dag), `is_active`
- Adgangsregler: hver bruger kan kun se og redigere sine egne tilmeldinger; trænere kan læse for deres egne atleter (samme mønster som resten af appen).
- Kun ét aktivt program ad gangen — nyt valg deaktiverer det gamle.

## 2. Biblioteket — "Start dette program"

I `RunningLibrary.tsx` får hvert program (og det custom-genererede) en **Start program**-knap.
- Vælger man et nyt, spørges der om bekræftelse hvis der allerede er et aktivt.
- Det aktive program markeres med et badge ("Aktivt – uge 3 af 10") og kan stoppes igen.

## 3. Registrering af løb

Løb ender altid samme sted: `diary_entries` med type "løb" (distance, tid, pace, kalorier) — præcis som i dag.
- **Dagbogen**: uændret.
- **Fremgang**: ny "Registrér løb"-knap i løbekortet, som åbner en lille dialog (dato, distance, tid, evt. kalorier) og gemmer samme sted. Pace beregnes automatisk ud fra distance/tid.

## 4. Progressionsgraf på Fremgang

`RunningStatsCard` udbygges til et løbepanel:

**Hvis der er et aktivt program:**
- Header: programnavn, "Uge X af Y", fremdriftsbjælke.
- **Kombineret graf pr. uge**: søjler = faktisk løbet km, linje = programmets planlagte km. Uger uden data vises tomme, så man tydeligt ser efterslæb/overskud.
- Nøgletal: km denne uge vs. planlagt, samlet gennemførsel i %, længste tur, bedste pace.
- Under grafen: ugens planlagte sessioner (Let / Tempo / Lang tur) med afkrydsning af hvor mange løbeture der er registreret i indeværende uge.

**Uden aktivt program:**
- Samme graf, men kun faktisk km pr. uge (sidste 12 uger) + link til biblioteket: "Vælg et løbeprogram".
- Metrik-skifter: Distance / Pace / Kalorier (samme mønster som trænerens løbepanel).

## 5. Træner

Trænerens `AthleteRunningProgress` får samme "planlagt vs. faktisk"-visning når atleten har et aktivt program, så træneren kan se om atleten følger sit løbeprogram.

## 6. Oversættelser og changelog

Alle nye tekster tilføjes i alle 7 sprog i `src/i18n/translations.ts`, og der registreres en ny changelog-post i `Help.tsx`.

## Teknisk

- Ny migration med tabel, grants, RLS og `updated_at`-trigger.
- Ugeberegning: uge-index = antal hele uger siden `start_date`; ugestart mandag, konsistent med resten af appen.
- Planlagt km pr. uge tages fra `plan[i].totalKm` i den gemte JSON.
- Graf via recharts `ComposedChart` (Bar + Line), som allerede bruges i projektet.
- Ingen ændringer i native, push, betaling, HealthKit eller Health Connect.
