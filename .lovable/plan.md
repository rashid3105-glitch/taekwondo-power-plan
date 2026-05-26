## Skabeloner til evalueringsskemaer

### Database
Ny tabel `survey_templates`:
- `id, coach_id, club_id, title, description, allow_anonymous`
- `questions jsonb` (snapshot af spørgsmål inkl. type, position, scale_max, mc_options, required)
- `is_shared_with_club boolean default true` ← delt som standard
- `archived_at timestamptz null` ← sættes ved arkivering
- `created_at, updated_at`

**GRANTs:** `authenticated` SELECT/INSERT/UPDATE/DELETE; `service_role` ALL.

**RLS:**
- Coach: fuld CRUD på egne skabeloner
- Klub-coaches: SELECT hvor `is_shared_with_club = true` AND samme `club_id` AND `archived_at IS NULL`
- Arkiverede skabeloner: kun synlige for ejer (under "Arkiv"-fane)

**Auto-sletning efter 90 dage:**
- pg_cron job (dagligt) → `DELETE FROM survey_templates WHERE archived_at IS NOT NULL AND archived_at < now() - interval '90 days'`
- Sættes op via `supabase--insert` (bruger projekt-specifik URL/key)

### API (`src/lib/surveysApi.ts`)
- `listTemplates({ includeArchived })` — egne aktive + klub-delte aktive (+ egne arkiverede hvis flag)
- `saveAsTemplate(surveyId, { shareWithClub = true })` — kopierer survey + spørgsmål
- `createTemplate(payload)` / `updateTemplate(id, payload)`
- `archiveTemplate(id)` — sætter `archived_at = now()`
- `unarchiveTemplate(id)` — sætter `archived_at = null`
- `deleteTemplate(id)` — manuel sletning
- `createSurveyFromTemplate(templateId, { target_scope, deadline, recipients })`

### UI (`src/pages/CoachSurveys.tsx`)
- Ny tab **"Skabeloner"** med to under-faner: *Aktive* og *Arkiv*
- Skabelonkort viser: titel, antal spørgsmål, badge "Delt i klub" / "Privat", ejer-navn
- Aktive skabelon-handlinger: **Brug**, **Rediger**, **Arkivér**, toggle deling
- Arkiverede skabelon-handlinger: **Gendan**, **Slet nu**, samt countdown "Slettes om X dage"
- I SurveyBuilder: knap **"Gem som skabelon"** (checkbox "Del med klub-coaches" — tjekket som default)
- I "Opret nyt skema": knap **"Start fra skabelon"** → modal med søgbar liste → prefill builder

### Oversættelser (alle 7 sprog)
~15 nye nøgler: `templates, useTemplate, saveAsTemplate, startFromTemplate, shareWithClub, sharedInClub, privateTemplate, archive, archived, unarchive, deleteNow, autoDeletesIn, daysLeft, archivedTemplates, activeTemplates`

### Scope (Fase 1)
- Ingen versionering (skabelon = snapshot)
- Ingen platform-wide bibliotek (kun egne + klub)
- Ændring af skabelon påvirker ikke allerede oprettede surveys
- Ingen email-notifikation før auto-sletning (vises i UI)
