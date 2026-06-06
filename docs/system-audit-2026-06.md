# Systemgennemgang — sportstalent.dk (juni 2026)

## Samlet vurdering
Fundamentet er sundt. Datahygiejne fremragende, sikkerhedsbaseline solid, multi-klub-isolation virker på kernedata. Ét væsentligt arkitektonisk hul (ufuldstændig læseisolation på en gruppe tabeller) + nogle proces-punkter. Intet akut brudt.

## Grønt (verificeret sundt)
- RLS-baseline: alle public-tabeller har RLS + mindst én politik. Ingen huller.
- Dataintegritet: nul forældreløse rækker, ingen dublet-medlemskaber, ingen coach-rolle uden medlemskab.
- Klub-stempling: 100% komplet — nul null-club_id på alle 13 klub-bevidste datatabeller.
- Funktions-sikkerhed: alle SECURITY DEFINER-funktioner har fast search_path.

## HØJ — Ufuldstændig multi-klub læseisolation
Fase 4 dækkede de store tabeller (dagbog, health, planer, rehab, wearable-summary, noter, refleksioner). ~13 tabeller bruger stadig users_share_club uden rækkeniveau-klub-filtrering: competitions, mental_assessments, physical_test_results, readiness_checkins, weight_logs, season_plans, form_curve_weekly, wearable_connections, diary_comments, match_tags, match_videos, coach_license_fields, parent_athletes.
Konsekvens: for en multi-klub-atlet er ikke-stemplet data synlig for coaches i alle atletens klubber (samme klasse fejl som dagbogslækken). Undergrupper: HAR club_id (let fix): match_videos. MANGLER club_id (kolonne+backfill+politik): resten.
Aktuel reel eksponering lav (få multi-klub-brugere), men vokser. Luk før multi-klub markedsføres bredt.

## MEDIUM — Skrive-isolation ikke implementeret
ALL/INSERT-politikker bruger stadig users_share_club: session_attendance, athlete_module_overrides, athlete_week_technique_focus, coach_messages, coach_reflection_comments, diary_comments, workout_log_feedback, competition_reflection_requests. En coach kan stadig skrive på tværs af klubber.

## MEDIUM — Preview/produktion-kløften
Backend (DB, RLS, edge functions) deles; frontend kræver Publish. Vane: publicér efter hver frontend-ændring der skal til brugere.

## MEDIUM — DB-ændringer ikke registreret som Lovable-migreringer
Fase 1/2/4 + nye kolonner/politikker kørt via direkte SQL, ikke versionsstyrede migreringer. Drift-risiko. Bør registreres.

## LØST (juni 2026)
Offline-first fragilitet på tre lag rettet: AI-plan afkoblet fra data-gemning; entitlement-gate fjernet på refleksions-plan (gratis for alle atleter); IndexedDB-forbindelse hærdet med onclose/onversionchange-nulstilling + retry (også dagbog + mental).

## Anbefalede næste skridt (prioriteret)
1. Luk læse-isolationen på de ~13 tabeller (HØJ) — samme mønster som Fase 4.
2. Skrive-isolation på ALL/INSERT-politikkerne.
3. Registrér migreringerne i Lovable.
4. Verificér CoachAthleteOverview.tsx + AdminModuleAccess.tsx for hardkodet club_id.
