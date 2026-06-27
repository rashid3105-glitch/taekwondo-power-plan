# Månedlig udviklingsrapport — implementeringsplan

Featuren frames konsekvent som "coach-sammenfatning bygget på elitesports-metodik". Ordet **AI** optræder ikke i UI, edge-output, PDF, changelog eller Help. Internt bruges samme LLM-mønster som de eksisterende `generate-*-advice`-functions.

## 1. Database (migration)

Ny tabel `public.monthly_development_reports`:
- `id`, `athlete_user_id` (fk auth.users on delete cascade), `club_id` (fk clubs), `period_year int`, `period_month int` (1–12 check)
- `summary_text text`, `metrics jsonb`, `locale text`, `generated_at timestamptz default now()`
- `UNIQUE (athlete_user_id, period_year, period_month)`
- Index på `(athlete_user_id, period_year desc, period_month desc)`

GRANT: `SELECT` til `authenticated` (RLS filtrerer); `ALL` til `service_role`. Ingen anon.

RLS:
- SELECT: `is_admin(auth.uid())` ELLER coach-link via `coach_athletes` (coach_id = auth.uid() AND athlete_id = athlete_user_id). Hverken atlet eller forælder.
- INSERT/UPDATE/DELETE: ingen policies → kun service role.

Ny tabel `public.monthly_report_jobs` (kø for batch):
- `id`, `athlete_user_id`, `period_year`, `period_month`, `status text default 'pending'` (`pending|running|done|error`), `attempts int default 0`, `last_error text`, `created_at`, `updated_at`, `UNIQUE (athlete_user_id, period_year, period_month)`.
- GRANT service_role kun. RLS enabled, ingen policies (kun service role tilgår).

Notifikationsmarkering: tilføj kolonne `profiles.coach_unread_reports_count int default 0` (bumpes når en rapport for en af coachens atleter er klar). Bruges til notifikations-prik på "Hold"-pillen. (Alternativt query — vi vælger kolonnen for billig læsning.)

## 2. Batch / cron

- `pg_cron` job 1. i hver måned kl. 03:00 UTC kører en SQL-funktion `public.enqueue_monthly_reports()` der:
  - Beregner forrige (year, month).
  - Indsætter én række pr. atlet i `monthly_report_jobs` for atleter i klubber hvor `license_active = true AND deleted_at IS NULL`, og som har MINDST én aktivitet i måneden (diary/workout/mental/test/wearable). `ON CONFLICT DO NOTHING`.
- Et andet `pg_cron` job hvert 5. minut kalder edge function `process-monthly-report-batch` via `net.http_post` med service-role nøgle. Functionen plukker op til 5 `pending` jobs, processer dem sekventielt, kalder `generate-monthly-report` pr. atlet, markerer `done` eller `error` (med inkrementeret attempts). Stopper efter 5 → returnerer for at undgå timeout. Køres indtil køen er tom.
- Idempotent: `generate-monthly-report` skipper hvis rapport allerede findes og `summary_text` er ikke-tom.
- Notifikation pr. ny rapport: bump `coach_unread_reports_count` for hver coach via `coach_athletes`, kald `send-push` og `enqueue_email` med eksisterende coach-notifikationsmønster.

Cron-opsætning køres via `supabase--insert` (indeholder service-role nøgle + URL — må ikke ligge i migration).

## 3. Edge functions

`supabase/functions/generate-monthly-report/index.ts`:
- Input `{ athlete_user_id, year, month }`.
- Auth: accepter service role JWT; ellers verificér `getUser(token)` + at kalderen er coach for atleten via `coach_athletes`.
- Henter: diary_entries, mental_assessments (+ forrige måned for delta), physical_test_results, workout_logs, wearable_daily_summary, profiles (locale, navn).
- Bygger `metrics` jsonb (tal og deltas; wearable-sektion udelades hvis ingen data).
- Kalder Lovable AI Gateway (`google/gemini-2.5-flash`) med system prompt på atletens `default_locale` (fallback `da`). Prompten instruerer: erfaren cheftræner-tone, 4–8 afsnit, 2–3 fokuspunkter, ingen meta-sprog som "baseret på data" eller modelreferencer.
- Upserter i `monthly_development_reports`. Returnerer rapport.

`supabase/functions/process-monthly-report-batch/index.ts`:
- Service-role-only. Plukker 5 pending jobs, kalder generate-functionen, opdaterer status, bumper coach unread og kalder `send-push` + `enqueue_email`.

Begge følger CLAUDE.md (getUser(token), corsHeaders, zod-validering, fejl pr. atlet isoleret).

## 4. Coach-UI

`src/components/coach/MonthlyDevelopmentReportsCard.tsx`:
- Bruges i `CoachAthleteDetail` (under Manage-tab) ELLER i `AthleteOverviewTab` — vi placerer det i `AthleteOverviewTab` (nederst, under quick-jump cards) så det er synligt i den primære coach-overblik.
- Liste: nyeste først, "Måned ÅÅÅÅ" + `generated_at` + chevron.
- Diskret knap "Generér denne måned" (kalder `generate-monthly-report` for indeværende/seneste manglende måned).
- Klik åbner `Dialog` med fuld rapport: `summary_text` (preserveret newlines) + struktureret `metrics`-grid (Dagbog, Mental, Fysiske tests, Træning, Wearable hvis present).
- "Eksportér PDF"-knap genbruger jspdf-mønsteret fra `matchReportPdf.ts`.

Notifikations-prik: i `GlobalAppMenu.tsx` / coach bottom-nav læs `profiles.coach_unread_reports_count` for coachen og vis rød prik på "Hold"-pillen. Ryddes når coachen åbner liste-kortet (RPC `mark_monthly_reports_seen`).

## 5. i18n (alle 7 sprog: en, da, sv, de, ar, no, es)

Nye nøgler tilføjes til `src/i18n/translations.ts`:
`monthlyDevReportsTitle`, `monthlyDevReportsEmpty`, `monthlyDevReportGenerate`, `monthlyDevReportExportPdf`, `metricsDiary`, `metricsMental`, `metricsPhysical`, `metricsTraining`, `metricsWearable`, `monthlyReportFocusNext`, `monthlyReportGeneratedAt`, `monthlyReportNew`.

Help.tsx og changelog (v1.2.8) — dansk: "Ny: Månedlig udviklingsrapport pr. atlet for coaches — genereres automatisk den 1. i måneden". Oversat til de øvrige 6.

## 6. Verifikation

- Linter + types efter migration.
- Manuel kald af `generate-monthly-report` for én testatlet (forrige måned) — bekræft rapportrække og at "AI" ikke optræder i output (post-process check: hvis prompten skulle returnere ordet, strippes det).
- Bekræft RLS: atlet kan ikke `SELECT`; coach kan kun se sine atleters rapporter.

## Leverancer (rækkefølge)

1. Migration (tabeller, RLS, GRANT, kolonner, RPC `mark_monthly_reports_seen`).
2. Edge functions `generate-monthly-report` + `process-monthly-report-batch` + `enqueue_monthly_reports` SQL-funktion (i migration).
3. Cron via `supabase--insert` (service-role nøgle).
4. Coach-UI komponent + dialog + PDF-eksport + notifikations-prik.
5. i18n + Help + changelog.
6. Verifikation.

Bekræfter til slut: ingen brugervendt "AI"-omtale, alle 7 sprog udfyldt.
