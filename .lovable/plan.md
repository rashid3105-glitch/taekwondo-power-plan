## Mål

Give coach-spørgeskema-værktøjet en synlig hjemmebase i Biblioteket, så det er nemt at finde — uden at flytte selve værktøjet væk fra `/coach/surveys`. Atletens indbakke (`/surveys`) og Hub-chippen med rød "nyt"-prik forbliver præcis som i dag.

## Ændringer

### 1) Coach-only kort i Biblioteket
`src/pages/LibraryChooser.tsx`: tilføj et 7. kort **"Spørgeskemaer"** (ikon `FileText`, t-nøgle `surveysTitle` + ny `libSurveysDesc`).
- Vises kun hvis brugeren er coach (tjek via `useRole()` eller `isCoach` ligesom Dashboard gør).
- Klik → `/library/surveys` (ny hub-side, se punkt 2).
- Ingen andre kort eller routes ændres.

### 2) Ny mellem-side `/library/surveys` (coach only)
Ny fil `src/pages/CoachSurveysHub.tsx` — samme layout/skelet som `LibraryChooser` (Watermark, header med ArrowLeft tilbage til `/library`, kort i grid). To kort:

- **"Opret & administrer"** (ikon `ClipboardList`, beskrivelse: byg spørgeskemaer, skabeloner, arkiv) → `/coach/surveys?view=manage`
- **"Resultater & svar"** (ikon `BarChart3`, beskrivelse: se besvarelser pr. spørgeskema) → `/coach/surveys?view=results`

Begge dybde-links lander på den eksisterende `CoachSurveys`-side. Hvis `?view=results` ikke matcher en eksisterende tab, åbnes default-listen — det er en blød hint, ikke et nyt tab-system. Hvis `CoachSurveys` allerede har Tabs (det gør den, ifølge filens imports), wires `view`-query'en til at sætte default-tabben; ellers ignoreres den uden fejl.

Tilføjes som ny rute i `src/App.tsx` lige ved siden af `/library/:section`:
```
<Route path="/library/surveys" element={<CoachSurveysHub />} />
```
(Skal stå **før** den dynamiske `/library/:section` for at undgå at "surveys" tolkes som section.)

### 3) Oversættelser
Tilføj følgende nye nøgler på alle 7 sprog (DA, EN, SV, DE, AR, NO, ES) i `src/i18n/translations.ts`:
- `libSurveysLabel` — kort-label i Biblioteket (DA: "Spørgeskemaer", EN: "Surveys", …)
- `libSurveysDesc` — kort-beskrivelse (DA: "Opret spørgeskemaer og se atleters svar")
- `surveysHubCreateTitle` / `surveysHubCreateDesc` — underkort 1
- `surveysHubResultsTitle` / `surveysHubResultsDesc` — underkort 2

Eksisterende `surveysTitle` genbruges som sidetitel i hub'en.

### 4) Hvad der **IKKE** røres
- `AthleteSurveys.tsx`, `/surveys`-routen — uændret.
- Hub-chippen "Spørgeskemaer" i `HubOtherModules.tsx` med rød notifikations-prik — bevares for atleter.
- `CoachSurveys.tsx` kerne-logik, builder, results-dialog, skabeloner — uændret (kun evt. en lille `useSearchParams` til at læse `?view=` og sætte default-tab).
- Ingen ændringer i RLS, DB, edge functions, navigation/bottom-nav, eller changelog.
- Den eksisterende coach-hjemmeside-genvej til `/coach/surveys` (hvis nogen) forbliver — det nye er en *ekstra* indgang.

### 5) Test
- Som atlet: Biblioteket viser stadig 6 kort, ingen "Spørgeskemaer" der. Hub-chip med prik virker som før.
- Som coach: Biblioteket viser 7 kort, sidste er "Spørgeskemaer". Klik → hub med 2 underkort → hver underkort lander korrekt på `/coach/surveys` med relevant tab forvalgt.
- RTL (Arabic): hub-layout spejlvendes korrekt (genbrug samme klasser som LibraryChooser, så det følger automatisk).

## Filer der røres
- `src/pages/LibraryChooser.tsx` (tilføj coach-kort)
- `src/pages/CoachSurveysHub.tsx` (NY)
- `src/pages/CoachSurveys.tsx` (lille `?view=` → default tab tilføjelse, ingen anden ændring)
- `src/App.tsx` (ny route)
- `src/i18n/translations.ts` (6 nye nøgler × 7 sprog)
