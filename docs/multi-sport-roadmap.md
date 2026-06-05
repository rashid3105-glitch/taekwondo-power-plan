# Multi-sport faseplan (oplæg)

> Status: PARKERET — gennemgås november 2026. Ingen kode røres før da.
> Mål: gøre Sportstalent.dk sport-agnostisk, så platformen kan rumme andre sportsgrene end taekwondo — ikke kun adskilt via dropdown, men reelt separat per sport.

## Anbefalet model
Model 2 — "sport som tenant-dimension". Genbruger den eksisterende multi-klub-arkitektur (club_memberships + RLS-isolation). En klub tilhører en sport; sportsspecifik terminologi og indhold drives af sporten. Én kodebase, én database, men separat oplevelse per sport. Reserver Model 3 (separat instans/white-label med eget domæne) til hvis en sport senere kræver egen branding eller dyb tilpasning.

## Taekwondo-kobling fundet i systemet (det der skal abstraheres)
- profiles: belt_level, discipline, tkd_sessions_per_week, tkd_start_date
- Teknik-systemet: club_techniques, club_week_technique_focus, athlete_week_technique_focus (technique_ids) — "ugens teknik-fokus"
- Match-analyse: match_videos (discipline, poomsae_type), match_tags (technique)
- I koden (ikke skema): taekwondo-HIIT, øvelses-/drill-bibliotek, AI-træningsplan-generator (generate-plan edge function)
- Allerede sport-agnostisk: antidoping-/kosttilskuds-tjek, dagbog, health, stævner, surveys, planer, ernæring (tjek kun terminologi)

## Faseplan
- Fase 0 — Taksonomi-design (intet kode): definér "sportsprofil" pr. sport (gradsystem, færdigheds-/teknik-taksonomi, konkurrenceformat, terminologi). Beslut hvilke sportsgrene først.
- Fase 1 — Indfør `sport` som førsteklasses attribut på clubs (+ evt. profiles). Backfill alt eksisterende = 'taekwondo'. Ikke-brydende (samme mønster som club_id-migreringen).
- Fase 2 — Abstrahér gradsystemet: belt_level → generisk grad/rang drevet af sportens konfiguration. UI viser sport-passende label.
- Fase 3 — Abstrahér teknik/færdigheder: generalisér club_techniques + de to technique-focus-tabeller + match_tags.technique + poomsae_type til en sport-scoped færdigheds-taksonomi. Hver sport seeder sit eget sæt.
- Fase 4 — Gør indhold og generatorer sport-bevidste: øvelses-/drill-/HIIT-bibliotek og generate-plan-prompten modtager sport + taksonomi. Mental/ernæring: tjek kun terminologi.
- Fase 5 — Terminologi & i18n: omdøb tkd_sessions_per_week → sessions_per_week, tkd_start_date → sport_start_date; erstat hardkodede termer med sport-drevne labels.
- Fase 6 — Onboarding & routing per sport: tilmelding vælger sport (eller arver fra klub); sporten styrer moduler/indhold/termer. Her leveres den "separate" oplevelse per sport på én kodebase.
- Fase 7 (senere, valgfrit) — hård adskillelse/white-label: forke til separat instans med eget domæne oven på den rene sport-abstraktion, hvis en sport kræver det.

## Vigtigste risiko
belt_level og teknik-systemet refereres mange steder i UI'et. Abstraktionen er hovedparten af arbejdet og skal køres med backfill + dual-read (som multi-klub-migreringen), ikke big-bang.

## Forudsætning før kode
Fase 0 (taksonomi-design) skal være besluttet først — ellers bygger man en abstraktion på et uklart grundlag.
