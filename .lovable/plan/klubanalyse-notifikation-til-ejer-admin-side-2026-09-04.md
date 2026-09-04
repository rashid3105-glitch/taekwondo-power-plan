# Klubanalyse: notifikation til ejer + admin-side

## Del 0 — verifikation (svaret først)

Forklaringen holder. Af 355 `pending`-rækker i `email_send_log` er **0 uparrede**: hver pending-række har en efterfølgende `sent`/`failed`/`dlq`/`bounced`/`suppressed`-række på samme modtager + samme skabelon inden for 10 minutter.

- Statusfordeling: sent 360, pending 355, failed 5, dlq 2, bounced 2, suppressed 1
- Nyeste pending-række: 31. august 2026 — altså ingen aktuel ophobning
- Fordeling: maj 16, juni 49, juli 173, august 117 — følger almindelig aktivitet

Ingen hændelse. Vi fortsætter til del 1 og 2.

## Del 1 — notifikation ved ny klubanalyse

Ny skabelon `club-assessment-notification.tsx` bygget efter nøjagtig samme mønster som `coach-invite-admin-notification.tsx`: `to: Deno.env.get('ADMIN_NOTIFICATION_EMAIL') || 'rashid3105@gmail.com'`, registreres i `registry.ts`.

Indhold, i denne rækkefølge:
- Emnelinje: fx `Klubanalyse: niveau 2 — svagest: Måling & data (2/9) — Bulsajo Kamp` (test-besvarelser får `[TEST]` foran)
- Klubnavn (eller "ikke oplyst"), email, sport, rolle
- Niveau + svageste dimension med navn og score
- Alle fem scores med dimensionsnavne
- Direkte link til `/admin/klubanalyser?id=<uuid>`

Udløses i `supabase/functions/submit-club-assessment/index.ts` efter at rækken er gemt, i sin egen `try/catch` uafhængigt af rapportmailen — se punkt 3 nedenfor.

Testmarkering: efter dit svar sender vi **altid** notifikation, men besvarelser fra `@sportstalent.dk` markeres som test — i emnelinjen og på admin-siden.

## Del 2 — admin-side `/admin/klubanalyser`

Ny side `src/pages/AdminKlubanalyser.tsx`, rute i `src/App.tsx`, menupunkt i `src/components/GlobalAppMenu.tsx` ved siden af Clubs/Stats. Læser `public.club_assessments` direkte med den eksisterende RLS ("Admins can view assessments" → `is_admin(auth.uid())`) — ingen ny politik, ingen edge function.

Liste (nyeste først, ingen paginering): dato, klubnavn, email, sport, rolle, niveau, svageste dimension, `subject_variant`, `report_sent_at`. Test-rækker får et tydeligt "TEST"-mærke.

Detalje (panel ved klik): alle fem dimensioner med navn og score, rå svar pr. spørgsmål fra `answers` sammenholdt med spørgsmålsteksterne, samt om og hvornår rapportmailen blev leveret.

A/B-panel: antal sendt pr. `subject_variant` (A/B/C). Åbnings- og klikdata **findes ikke** — hverken `club_assessments` eller `email_send_log` har åbnings-/klikkolonner, og mailtjenesten registrerer ikke leveret/åbnet. Panelet skriver derfor eksplicit på siden, at A/B-testen i dag kun kan aflæses på antal sendte, ikke på effekt.

## Teknisk

- Tabeller: `public.club_assessments` (læses), `public.email_send_log` (kun brugt til del 0-verifikation)
- Filer: ny skabelon + `registry.ts`, `submit-club-assessment/index.ts`, ny admin-side, `App.tsx`, `GlobalAppMenu.tsx`, `translations.ts`
- Deploy: `submit-club-assessment` og `preview-transactional-email`

**Punkt 3 — kan del 1 påvirke respondentens rapportmail?** Nej. Rapportmailen affyres allerede i sin egen `try/catch` og kan ikke fejle indsendelsen. Admin-notifikationen lægges *efter* den, i en separat `try/catch`, hvor enhver fejl kun logges. Rækken er gemt før begge kald, så selv total mailnedbrud koster ingen data.

**Punkt 4 — åbnings-/klikdata:** findes ikke, se ovenfor.

**Punkt 6 — oversættelse:** admin-fladen bruger `useLanguage()`/`t()` som resten af appen (fx `adminStats`, `adminClubs` i menuen), men mange interne admin-tekster i fx `AdminStats.tsx` er hardcodet engelsk/dansk. Jeg følger samme mønster: menupunkt og sidetitel via `t()` med nøgler i alle 7 sprog, tabelindhold på dansk som resten af klubanalysen (`src/data/clubAssessment.ts` er kun dansk). Mailen til dig skrives på dansk. Ingen ny i18n-mekanisme.

## Antagelser

- Du vil have notifikation på alle besvarelser, også dine egne test — de markeres blot
- "Test" = afsender-email på `@sportstalent.dk`
- Dimensionsnavne hentes fra den fælles kilde `supabase/functions/_shared/club-assessment-content.ts`, så mail og admin-side er identiske med resultatsiden
- Admin-siden er kun for platformadmin (`is_admin`), ikke klubadmins
- Ingen sletning/redigering fra admin-siden i denne omgang — kun læsning
