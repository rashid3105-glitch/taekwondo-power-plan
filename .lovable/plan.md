# Sport-agnostisk platform — estimat og mockup

Målet: når en klub oprettes, vælger træneren en sportsgren, og appen tilpasser terminologi, gradsystem, teknik-/færdighedsbibliotek, tests og planer til den sport. Der findes allerede et oplæg i `docs/multi-sport-roadmap.md` (Model 2: sport som tenant-dimension på klub-niveau) — denne plan er den konkrete udmøntning af det.

## Hvad der i dag er bundet til taekwondo

Verificeret ved søgning i koden:

- `profiles`: `belt_level`, `discipline`, `tkd_sessions_per_week`, `tkd_start_date` — `belt_level` bruges i ca. 15 UI-filer og 10+ edge functions, `discipline` i ca. 30 filer.
- Teknik-system: `club_techniques`, `club_week_technique_focus`, `athlete_week_technique_focus`, `src/lib/tkdTechniques.ts`.
- Match-analyse: `match_videos.discipline`/`poomsae_type`, `match_tags.technique`, `VideoTagger`.
- Indhold i kode: øvelses-/drill-/HIIT-bibliotek, mentale spørgsmål, motivationscitater, `seasonPlan`/`seasonCalendar`-labels.
- Edge functions med taekwondo i prompten: generate-plan, generate-nutrition-plan, generate-rehab-plan, generate-mental-advice, generate-match-report, generate-competition-plan/-reflection, weekly summary.
- Allerede sport-neutralt: dagbog, health/wearables, stævner, surveys, ernæring/vægt, antidoping, chat, moduladgang.

## Rough mockup

Trin i klubopsætning (admin/coach):

```text
┌─────────────────────────────────────────────┐
│  Opret klub                                 │
│                                             │
│  Klubnavn   [ Herlev Elite            ]     │
│  Land       [ Danmark            v    ]     │
│                                             │
│  Vælg sportsgren                            │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ TKD  ✓ │ │ Karate │ │ Judo   │           │
│  └────────┘ └────────┘ └────────┘           │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Brydning│ │ Svømn. │ │ Andet  │          │
│  └────────┘ └────────┘ └────────┘           │
│                                             │
│  Sportsprofil for Taekwondo:                │
│   Gradsystem  : Bælter (10. kup – 4. dan)   │
│   Færdigheder : 42 teknikker (kick/hånd..)  │
│   Konkurrence : Kamp + Poomsae              │
│   Tests       : 8 fysiske standardtests     │
│   [ Tilpas senere ]                         │
│                                             │
│                [ Opret klub ]               │
└─────────────────────────────────────────────┘
```

Effekt i appen efter valg (samme skærme, sport-drevne labels):

```text
ATLETPROFIL (taekwondo)        ATLETPROFIL (svømning)
 Grad:   Rød bælte              Niveau:  Nationalt B
 Fokus:  Dollyo chagi           Fokus:   Vendinger
 Stævne: Kamp -68 kg            Stævne:  200 m fri

BIBLIOTEK                      BIBLIOTEK
 Teknikker (TKD-sæt)            Færdigheder (svøm-sæt)
 Fysisk træning (fælles)        Fysisk træning (fælles)
```

Admin får en "Sportsprofiler"-side hvor hver sport har: navn, gradstige, færdighedstaksonomi, konkurrenceformater, testbatteri og termnøgler.

## Estimat

| Fase | Indhold | Størrelse |
|---|---|---|
| 0 | Taksonomi-design: definér sportsprofil-format og de første 3–4 sportsgrene (indhold, ikke kode) | 1 runde, mest din beslutning |
| 1 | `sport`-felt på klubber + sportsprofil-tabeller, backfill alt til taekwondo, sportsvalg i klubopsætning | Lille-mellem |
| 2 | Gradsystem abstraheret (`belt_level` → sport-drevet grad, dual-read) | Mellem |
| 3 | Teknik/færdigheder gjort sport-scoped + seed pr. sport, match-tags | Stor |
| 4 | Indhold og generatorer sport-bevidste (øvelser, drills, HIIT, edge function-prompts) | Stor |
| 5 | Terminologi/i18n: sport-drevne labels i alle 7 sprog, omdøbte felter | Mellem |
| 6 | Onboarding/routing pr. sport + admin sportsprofil-side | Mellem |

Samlet: en større flerrunde-indsats — realistisk 12–20 arbejdsrunder afhængigt af hvor mange sportsgrene der seedes. Fase 1+2 alene giver allerede "vælg sport ved klubopsætning" og korrekt gradterminologi og kan leveres først som synligt delresultat.

## Teknisk tilgang

- `public.sports` (slug, navn-nøgler, gradstige jsonb, konkurrenceformater, testbatteri-nøgler) og `public.sport_skills` (sport-scoped færdigheder). `clubs.sport_id` med default = taekwondo; RLS: læsning for alle authenticated, skrivning kun platform-admin.
- `useSportProfile()`-hook (afledt af aktiv klub) leverer labels + taksonomi; UI læser labels derfra i stedet for hardkodede TKD-termer.
- Migreringsmønster som multi-klub: backfill → dual-read → skift læsning → ryd op. Ingen big-bang på `belt_level`.
- Generatorer får sport + taksonomi med i payload; prompt-teksterne bliver sport-parametriske.
- Offentlige SEO-sider og eksisterende taekwondo-indhold bevares uændret.

## Åbne spørgsmål

- Hvilke 3–4 sportsgrene skal seedes først?
- Skal en klub kunne have flere sportsgrene, eller én pr. klub (denne plan antager én pr. klub)?
