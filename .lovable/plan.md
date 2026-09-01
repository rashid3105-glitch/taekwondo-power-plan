# Næste seks skridt — mockup først, ingen kode endnu

Rapporten forudsætter at onboarding/værge-kæden er lukket (det er den, v1.5.57–59). Tilbage står den daglige sløjfe, trænerens arbejdsflader, tre konsistenspas og stævneugen.

Herunder er wireframes for hvert punkt. Intet bygges før du godkender.

## Hvad der allerede findes (verificeret)

- `src/pages/Diary.tsx` + offline sync — dagbogen findes, men promptes ikke.
- `src/pages/CoachToday.tsx` (123 linjer) — findes som rute `/coach/today`, men er ikke landingsskærm og er ikke en triage-kø.
- `src/components/coach/CoachDiaryView.tsx` — findes, men er ikke et aftenfeed med 1-tap svar.
- `src/components/coach/SessionAttendance.tsx` — fremmøde findes allerede; skal have en hurtig én-hånds flade.
- `src/components/AppBottomNav.tsx` — rutebaseret aktiv tilstand er på plads; chat mangler som fane, Health/Video ligger stadig i baren.

## 01 — Aftenprompt + dagbog ét tap fra I dag

Push kl. 19:45 kun på atletens egne træningsdage (skemaet fra onboarding).

```text
┌─ Notifikation 19:45 ──────────────────────┐
│ Sportstalent                              │
│ Hvordan gik træningen i dag?  ▸ 10 sek    │
└───────────────────────────────────────────┘
          ↓ tap
┌─ Hurtig log ──────────────────────────────┐
│  Tirsdag · Taekwondo                      │
│                                           │
│  [ Gennemført ] [ Delvist ] [ Sprunget ]  │
│                                           │
│  Indsats     1 2 3 4 ⬤ 6 7 8 9 10         │
│                                           │
│  ┌───────────────────────────────────┐    │
│  │ Én linje (valgfri)…               │    │
│  └───────────────────────────────────┘    │
│                                           │
│            [   Gem opslag   ]             │
│         Din træner kan se dette           │
└───────────────────────────────────────────┘
```

På `I dag`-fanen øverst, kun på træningsdage indtil den er udfyldt:

```text
┌───────────────────────────────────────────┐
│ ● Log dagens træning            [ Åbn ]   │
└───────────────────────────────────────────┘
```

## 02 — Trænerens tre arbejdsflader

**A. Morgen-triage** (bliver trænerens landingsskærm):

```text
┌─ I dag · Triage ──────────────────────────┐
│  4 ting kræver dig                        │
│                                           │
│ ⬤ 2 ubesvarede beskeder            ▸      │
│ ⬤ 1 manglende samtykke (Mia, 14)   ▸      │
│ ⬤ 3 licenser udløber < 30 dage     ▸      │
│ ⬤ 5 loggede intet i sidste uge     ▸      │
│                                           │
│  ── Alt andet er i orden ──               │
└───────────────────────────────────────────┘
```

**B. Aftenfeed** — nattens dagbogsopslag på tværs af holdet:

```text
┌─ Aften · 6 nye opslag ────────────────────┐
│ ⬤ Emil H.  Gennemført · indsats 8   19:52 │
│   "Benene var tunge, men sparkene…"       │
│   [ 👍 ] [ Svar ]                          │
├───────────────────────────────────────────┤
│ ⬤ Sara K.  Delvist · indsats 4      20:10 │
│   "Ondt i knæet igen"          ⚠︎ skade    │
│   [ 👍 ] [ Svar ]                          │
└───────────────────────────────────────────┘
```

**C. Fremmøde i ét pas** — én hånd, offline, tap = til stede:

```text
┌─ Fremmøde · Tirsdag 17:00 ────────────────┐
│  ✓ Emil Hansen                            │
│  ✓ Sara Krogh                             │
│  ○ Noah Berg                     [skadet] │
│  ✓ Mia Lund                               │
│  ────────────────────────────             │
│  12 / 15 til stede        [  Gem  ]       │
└───────────────────────────────────────────┘
```

## 03 — Én navigation, inkl. chat

```text
Atlet:   I dag   Træn   Kalender   Chat②   Mig
Træner:  I dag   Hold   Stævner    Chat②   Mig
```

Health og Video flytter ind under `Mig`. Baren vises på alle indloggede skærme inkl. `/messages`. Ulæst-badge på Chat.

## 04 — Én upload-komponent, én grænsetabel

```text
┌─ Vedhæft ─────────────────────────────────┐
│  📷 Billede    op til 10 MB · komprimeres │
│  🎬 Video      op til 200 MB · kun klip   │
│  📄 Fil        op til 10 MB               │
│  Grænsen vises FØR filvælgeren åbner      │
└───────────────────────────────────────────┘
```

Én komponent bruges i chat, madfoto, drills og teknikklip. Klientside-nedskalering genbrugt fra madscanneren. Chat holder op med at tilbyde video den afviser.

## 05 — Login på samme tokens + publikumslinjer

```text
Før: mørk/guld skærm, "Face ID", danske hardkodede fejl
Efter:
┌───────────────────────────────────────────┐
│            SPORTS TALENT                  │
│  E-mail  [______________________]         │
│  Kode    [______________________]         │
│            [   Log ind   ]                │
│  ───────────── eller ─────────────        │
│      [ 🔑 Log ind uden kode ]             │
└───────────────────────────────────────────┘
```

Publikumslinje under vægt, kalorier, skader og mentale svar:
`Din træner og din tilknyttede forælder kan se dette.`
Biometri-tilbuddet flyttes fra browser-dialog til et kort man kan afvise.

## 06 — Stævneuge som tilstand

7 dage før stævnet skifter appen mode:

```text
┌─ STÆVNEUGE · 4 dage til DM ───────────────┐
│ ✓ Licens gyldig                           │
│ ✓ Vægt i dag: 62,4 kg  (grænse 63,0)      │
│ ○ Udstyr pakket                           │
│ ○ Transport bekræftet                     │
│  Planen er nedtrappet automatisk          │
└───────────────────────────────────────────┘
```

Træner får navneopråb på stævnedagen + en forenklet tagger. På vejen hjem promptes refleksionen af sig selv.

## Rækkefølge

1. **01 + 02 sammen** — de er én sløjfe: atleten sætter et spor, træneren svarer.
2. **03 + 04 + 05 som ét pas** — konsistensarbejde, mest sletning.
3. **06 når en rigtig stævnedato nærmer sig.**

## Teknisk note

- 01: ny scheduled push afledt af `weekly_schedule` (genbruger `dispatch-scheduled-pushes` + `send-push`), plus en hurtig-log-dialog oven på eksisterende dagbogs-offline-sync. Ingen nyt skema ud over evt. `session_log`-felter på `diary_entries`.
- 02: `CoachToday.tsx` udvides til triage-kø (aggregerede queries på eksisterende tabeller), nyt aftenfeed oven på `CoachDiaryView`, og en komprimeret fremmøde-flade oven på `SessionAttendance`.
- 03–05: ren frontend + i18n på alle 7 sprog.
- 06: sekvenslogik oven på eksisterende stævne-, vægt- og refleksionsmoduler.
