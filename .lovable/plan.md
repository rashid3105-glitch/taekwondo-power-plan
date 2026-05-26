# Evalueringsmodul (Coach surveys)

Et simpelt værktøj hvor coach laver et evalueringsskema med overskrift og spørgsmål, sender til hele klubben eller udvalgte atleter, og ser samlede svar. Atleter kan se deres egen historik og — hvis coach tillader det — vælge at svare anonymt.

## Brugerflow

**Coach**
1. Ny menu i `/coach` → "Evalueringer"
2. Opret skema: titel, beskrivelse, "Tillad anonyme svar" (toggle), målgruppe (hele klubben / vælg atleter), deadline (valgfri)
3. Tilføj spørgsmål (drag-to-reorder, kan slettes):
   - Fritekst
   - Skala (1-5 eller 1-10)
   - Multiple choice (coach skriver valgmuligheder)
   - Ja/Nej
   - Required-toggle pr. spørgsmål
4. Udgiv → atleter får notifikation + event reminder
5. Resultatside pr. skema:
   - Liste over modtagere med status (besvaret / ikke besvaret / anonym)
   - Anonyme svar grupperes uden navn
   - Aggregerede tal for skala/MC/ja-nej (gennemsnit, fordeling)
   - Fritekst-svar listet (med navn eller "Anonym")
   - Eksport til PDF (samme mønster som andre exports)

**Atlet**
1. Ny indgang i hub "Evalueringer" + badge ved nye/ubesvarede
2. Liste: ubesvarede øverst, besvarede nedenunder med dato
3. Besvar: ét spørgsmål ad gangen eller scroll-form (mobile-first). Hvis coach har tilladt anonymitet → toggle "Send anonymt" øverst
4. Historik: kan altid gense egne svar (også anonyme — vi gemmer link i atletens egen historik, men ikke i coachens visning)

## Tekniske detaljer

### Database (4 tabeller)

```
surveys
  id, coach_id, club_id, title, description,
  allow_anonymous bool, target_scope ('club'|'selected'),
  deadline, published_at, created_at, updated_at

survey_questions
  id, survey_id, position, type ('text'|'scale'|'mc'|'yesno'),
  question_text, required, scale_max int, mc_options jsonb

survey_recipients  -- når target_scope='selected'
  id, survey_id, athlete_id

survey_responses
  id, survey_id, athlete_id (nullable hvis anonym),
  is_anonymous bool, submitted_at,
  anonymous_token uuid  -- så atleten selv kan finde egen historik

survey_answers
  id, response_id, question_id,
  answer_text, answer_number, answer_choice, answer_bool
```

For anonyme svar: `athlete_id` sættes til NULL inden gem; vi gemmer i stedet en encrypted lookup i `survey_anonymous_history` (athlete_id, response_id) så atleten kan se egen historik uden at coach kan join'e.

### RLS

- `surveys`: coach SELECT/INSERT/UPDATE/DELETE egne; atleter SELECT hvis i målgruppe (club-match eller i `survey_recipients`)
- `survey_questions`: følger surveys
- `survey_responses` + `survey_answers`:
  - Atlet INSERT egne (auth.uid() = athlete_id eller is_anonymous=true)
  - Atlet SELECT egne via `survey_anonymous_history` join
  - Coach SELECT alle for egne surveys (uden join til anonymous_history)
- `survey_anonymous_history`: kun atleten selv (auth.uid() = athlete_id), coach har INGEN adgang

### UI komponenter (nye)
- `src/pages/CoachSurveys.tsx` — liste + opret/rediger
- `src/components/coach/SurveyBuilder.tsx` — bygger med drag-reorder
- `src/components/coach/SurveyResults.tsx` — aggregering + PDF eksport
- `src/pages/AthleteSurveys.tsx` (eller hub-tab) — liste
- `src/components/SurveyForm.tsx` — besvarelse med anonymity toggle

### Translations
Alle nye keys i alle 7 sprog (da, en, sv, de, ar, no, es) i `src/i18n/translations.ts`.

### Notifikationer
- Ved publish: `send-push` til målgruppe + event_reminder række
- Coach notifikation når atlet besvarer (valgfrit, default off)

### Integration
- Tilføj "surveys" som module i `useAthleteModuleAccess` så det kan slås til/fra pr. klub
- Help.tsx + changelog opdateres
- Bottom nav: tilføj badge på coach "Hold" hvis ubesvarede resultater; atlet badge på hub

## Ud af scope (fase 1)
- Genbrug af skema-skabeloner på tværs af coaches
- Tidsserier / sammenligning mellem evalueringer
- Betinget logik (vis spørgsmål X kun hvis svar Y)
- Eksport til CSV/Excel (kun PDF i fase 1)