import type { Locale } from "@/i18n/translations";

export type CLStrings = {
  navFeatures: string;
  navForCoaches: string;
  navForAthletes: string;
  navPricing: string;
  navLogin: string;
  navGetStarted: string;

  heroBadge: string;
  heroTitle: string;
  heroPhrases: [string, string, string, string];
  heroDesc: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroFinePrint: string;
  heroPrice: string;
  heroLeadMagnet: string;
  heroLeadMagnetCta: string;

  mockSquadPulse: string;
  mockWeek: string;
  mockOnTrack: string;
  mockSessionsLogged: string;
  mockThisWeek: string;
  mockAvgReadiness: string;
  mockVsLast: string;
  mockWeeklyLoad: string;
  mockTrimpDay: string;

  trustEyebrow: string;
  trustLine: string;

  featuresTitle1: string;
  featuresTitle2: string;
  features: { title: string; desc: string }[];

  howTitle: string;
  steps: { title: string; desc: string }[];

  splitTitle: string;
  coachesLabel: string;
  coachesTitle: string;
  coachFeatures: string[];
  athletesLabel: string;
  athletesTitle: string;
  athleteFeatures: string[];

  testimonialsTitle: string;
  testimonials: { stat: string; quote: string; name: string; club: string }[];

  pricingTitle: string;
  pricingSub: string;
  mostPopular: string;
  fromLabel: string;
  perMonth: string;
  currency?: string;
  prices?: [string, string, string, string, string];
  tiers: { name: string; desc: string; features: string[]; cta: string }[];
  pricingFootnoteLead: string;
  pricingFootnoteLink: string;
  pricingFootnoteFedLead: string;
  pricingFootnoteContact: string;

  finalCtaTitle: string;
  finalCtaDesc: string;
  finalCtaButton: string;

  footerCols: { title: string; links: { label: string; href: string }[] }[];
  footerCopy: string;
  footerPrivacy: string;
  footerContact: string;

  galleryEyebrow?: string;
  galleryTitle?: string;
  gallerySub?: string;
  storyRows?: { eyebrow: string; title: string; body: string; bullets: string[] }[];

  metaTitle: string;
  metaDesc: string;
};

const en: CLStrings = {
  navFeatures: "Features",
  navForCoaches: "For Coaches",
  navForAthletes: "For Athletes",
  navPricing: "Plans",
  navLogin: "Log in",
  navGetStarted: "Get Started",

  heroBadge: "THE OPERATING SYSTEM FOR ELITE TALENT DEVELOPMENT",
  heroTitle: "Coaching Platform for Danish Sports Clubs",
  heroPhrases: [
    "No more spreadsheets.",
    "No more scattered notes.",
    "No more knowledge walking out the door.",
    "One system for the whole club.",
  ],
  heroDesc:
    "Sportstalent replaces the spreadsheets, notebooks and group chats clubs use to track training. Every athlete gets a personalised plan, readiness tracking and competition prep, automatically. Data stays in the EU. You coach. You don't administrate.",
  heroCtaPrimary: "Start Free — No Card Needed",
  heroCtaSecondary: "See How It Works",
  heroFinePrint: "14-day free trial · no commitment · cancel anytime",
  heroPrice: "14-day free trial — contact us for pricing",
  heroLeadMagnet: "Free guide: How to keep your athletes motivated all season →",
  heroLeadMagnetCta: "Download free (PDF)",

  mockSquadPulse: "Squad Pulse",
  mockWeek: "Week 14 · 18 athletes",
  mockOnTrack: "ON TRACK",
  mockSessionsLogged: "Sessions logged",
  mockThisWeek: "this week",
  mockAvgReadiness: "Avg readiness",
  mockVsLast: "+4 vs last",
  mockWeeklyLoad: "Weekly load",
  mockTrimpDay: "TRIMP/day",

  trustEyebrow: "Trusted by",
  trustLine: "Built by a coach with 40 years on the floor. Trusted by Danish clubs and federations — GDPR-compliant, data hosted in the EU.",

  featuresTitle1: "Everything your club needs to develop talent.",
  featuresTitle2: "Nothing that gets in the way.",
  features: [
    {
      title: "Coaching Assistant",
      desc: "Session recommendations, technique guidance and training advice drawn from forty years of coaching knowledge. Like having a second coach in the room.",
    },
    {
      title: "Training Plan Builder",
      desc: "Build periodized plans for any age and level in minutes. Tailored to the season, the competition calendar and individual goals.",
    },
    {
      title: "Athlete Progress Tracker",
      desc: "Every session logged. Every readiness check recorded. No more digging through notebooks to spot a pattern before it becomes an injury.",
    },
    {
      title: "Weekly Performance Reports",
      desc: "A clear, shareable summary of each athlete's week — ready for parents, assistant coaches, or federation reviews. No more writing it up by hand.",
    },
  ],

  howTitle: "How it works",
  steps: [
    { title: "Add your athletes", desc: "Set up your club roster in under 5 minutes — no spreadsheet needed" },
    { title: "Athletes log their training", desc: "Session type, effort level, how they feel — takes 60 seconds after practice" },
    { title: "You coach with clarity", desc: "Weekly summaries, load trends, and guidance surface automatically, so nothing depends on memory or on one coach staying forever" },
  ],

  splitTitle: "Built for both sides of the equation",
  coachesLabel: "For Coaches",
  coachesTitle: "Run your whole club from one screen",
  coachFeatures: [
    "Full roster view across all athletes",
    "Training load trends and recovery flags",
    "One-click weekly reports per athlete",
    "A drill and technique library with 100+ progressions — the club's knowledge, not one coach's memory",
    "Competition prep planning tools",
  ],
  athletesLabel: "For Athletes",
  athletesTitle: "Train with structure and feedback",
  athleteFeatures: [
    "Personal session diary",
    "Daily readiness check-in",
    "Progress tracked automatically over time",
    "See this week's training focus from your coach",
  ],

  testimonialsTitle: "Coaches who switched, didn't switch back",
  testimonials: [
    { stat: "20 years", quote: "Finally a platform built for how clubs actually develop athletes — not generic fitness.", name: "Coach Sami", club: "Klub i København" },
    { stat: "+3 hrs/week", quote: "My athletes log their own sessions now. I get three hours back every week.", name: "Coach Janne", club: "Klub i Malmø" },
    { stat: "Parents on-board", quote: "The weekly report alone is worth it. Parents finally understand what we're building.", name: "Coach Michael", club: "Klub i London" },
  ],

  pricingTitle: "Choose your plan",
  pricingSub: "14-day free trial on all plans · no commitment · cancel anytime",
  mostPopular: "Most popular",
  fromLabel: "",
  perMonth: "",
  currency: "",
  tiers: [
    { name: "Athlete", desc: "For individual athletes", features: ["Single athlete seat", "Core training & progress", "1 active plan", "Mental & recovery tracking"], cta: "Contact for pricing" },
    { name: "Club", desc: "For clubs and teams", features: ["Multiple athlete seats", "All modules unlocked", "Unlimited plans", "Bulk plan creation", "Squad overview"], cta: "Contact for pricing" },
    { name: "Federation", desc: "For federations and large organisations", features: ["Unlimited athletes", "All modules", "Unlimited plans", "Onboarding included", "Priority support"], cta: "Contact for pricing" },
  ],
  pricingFootnoteLead: "Questions about pricing?",
  pricingFootnoteLink: "pricing page",
  pricingFootnoteFedLead: "Federation setup?",
  pricingFootnoteContact: "Write to Farooq@Sportstalent.dk",

  finalCtaTitle: "Your next champion is already in your club.",
  finalCtaDesc: "Give every athlete the coaching they deserve — without the spreadsheets and the burnout.",
  finalCtaButton: "Start Free Today",

  footerCols: [
    { title: "Platform", links: [
      { label: "Features", href: "#features" },
      { label: "Plans", href: "#pricing" },
      { label: "Methodology", href: "/methodology" },
      { label: "Programs", href: "/programs" },
      { label: "Help Center", href: "/help" },
    ] },
    { title: "For Coaches", links: [
      { label: "Coach Dashboard", href: "/platform/coach-dashboard" },
      { label: "Plan Builder", href: "/platform/plan-builder" },
      { label: "Squad Reports", href: "/platform/squad-reports" },
      { label: "Roster Management", href: "/platform/roster" },
      { label: "Book a demo", href: "/contact" },
    ] },
    { title: "For Athletes", links: [
      { label: "Daily Diary", href: "/platform/diary" },
      { label: "Readiness Check", href: "/platform/readiness" },
      { label: "Progress Tracking", href: "/platform/progress" },
      { label: "Performance Library", href: "/platform/library" },
      { label: "Nutrition Plan", href: "/kostplan" },
    ] },
    { title: "Company", links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Sign in", href: "/auth?tab=signin" },
      { label: "Start free", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · Built for Danish clubs and federations. No more spreadsheets. Just elite development.",
  footerPrivacy: "Privacy",
  footerContact: "Contact",
  galleryEyebrow: "REAL ATHLETES · REAL MOMENTS",
  galleryTitle: "Built on the training ground, not behind a desk.",
  gallerySub: "Sportstalent is shaped by the moments coaches and athletes live every week, not by a spreadsheet.",
  storyRows: [
    { eyebrow: "ON THE SIDELINE", title: "Coach every athlete like they're your only one.", body: "Sportstalent gives you the structured plan, readiness data and reminders so every conversation is sharp — not improvised from memory.", bullets: ["Daily readiness from every athlete", "Auto-rolling weekly plans", "One tap to log the session"] },
    { eyebrow: "IN TRAINING", title: "Sport-specific planning, not generic fitness.", body: "Plans built around your sport: speed, power, technical work and recovery — calibrated to age, level and goal.", bullets: ["Periodized 4–12 week programs", "Pre-, mid- and post-competition phases", "Nutrition that fits training load and performance targets"] },
    { eyebrow: "BEFORE COMPETITION", title: "See who's ready — and who isn't.", body: "One squad view shows mood, energy, sleep and load for every athlete, so you can adjust the session before it starts, not after the result.", bullets: ["Squad pulse with traffic-light status", "Overtraining flags two weeks early", "Coach notes synced to the athlete"] },
    { eyebrow: "AFTER COMPETITION", title: "Turn every result into a lesson.", body: "Post-competition reflections, video tagging and SMART goals make sure the next training cycle starts where the last one ended.", bullets: ["4-step reflection after every event", "Video tags by technique & outcome", "3 personalized SMART goals per cycle"] },
  ],

  metaTitle: "Sportstalent — Coaching Platform for Danish Sports Clubs",
  metaDesc:
    "The coaching platform built for Danish sports clubs and federations. Run your roster, track readiness, build periodized plans, and send weekly reports — all in one place, GDPR-compliant.",
};

const da: CLStrings = {
  navFeatures: "Funktioner",
  navForCoaches: "For trænere",
  navForAthletes: "For atleter",
  navPricing: "Planer",
  navLogin: "Log ind",
  navGetStarted: "Kom i gang",

  heroBadge: "OPERATIVSYSTEMET FOR ELITE TALENTUDVIKLING",
  heroTitle: "Coaching-platform til danske sportsklubber",
  heroPhrases: [
    "Ikke flere regneark.",
    "Ikke flere spredte notater.",
    "Ikke mere viden der forsvinder ud ad døren.",
    "Ét system til hele klubben.",
  ],
  heroDesc:
    "Sportstalent erstatter de regneark, notesbøger og gruppechats, klubber bruger til at holde styr på træningen. Hver atlet får en personlig plan, parathedsmåling og konkurrenceforberedelse — automatisk. Data ligger i EU. Du træner. Du administrerer ikke.",
  heroCtaPrimary: "Start gratis — intet kreditkort",
  heroCtaSecondary: "Se hvordan det virker",
  heroFinePrint: "14 dages gratis prøve · ingen binding · opsig når som helst",
  heroPrice: "14 dages gratis prøveperiode — kontakt os for pris",
  heroLeadMagnet: "Gratis guide: Sådan holder du dine udøvere motiverede hele sæsonen →",
  heroLeadMagnetCta: "Download gratis (PDF)",

  mockSquadPulse: "Holdets puls",
  mockWeek: "Uge 14 · 18 atleter",
  mockOnTrack: "PÅ SPORET",
  mockSessionsLogged: "Loggede sessioner",
  mockThisWeek: "denne uge",
  mockAvgReadiness: "Gns. parathed",
  mockVsLast: "+4 vs sidste",
  mockWeeklyLoad: "Ugentlig belastning",
  mockTrimpDay: "TRIMP/dag",

  trustEyebrow: "Brugt af",
  trustLine: "Bygget af en træner med 40 år på gulvet. Betroet af danske klubber og forbund — GDPR-overholdende, data ligger i EU.",

  featuresTitle1: "Alt din klub har brug for til at udvikle talent.",
  featuresTitle2: "Intet der står i vejen.",
  features: [
    {
      title: "Træner-assistent",
      desc: "Anbefalinger til sessioner, teknikvejledning og træningsråd baseret på fyrre års trænererfaring. Som at have en ekstra træner i salen.",
    },
    {
      title: "Træningsplan-bygger",
      desc: "Byg periodiserede planer for enhver alder og ethvert niveau på minutter. Tilpasset sæsonen, konkurrenceprogrammet og individuelle mål.",
    },
    {
      title: "Atletfremgang",
      desc: "Hver session logget. Hvert paratheds-tjek registreret. Ikke mere gennemgang af notesbøger for at fange et mønster, før det bliver til en skade.",
    },
    {
      title: "Ugentlige rapporter",
      desc: "En tydelig, delbar opsummering af hver atlets uge — klar til forældre, assistenttrænere eller forbund. Ingen manuel rapportskrivning.",
    },
  ],

  howTitle: "Sådan virker det",
  steps: [
    { title: "Tilføj dine atleter", desc: "Opsæt klubbens roster på under 5 minutter — uden regneark" },
    { title: "Atleter logger deres træning", desc: "Sessionstype, intensitet, hvordan de føler sig — tager 60 sekunder efter træning" },
    { title: "Du træner med klarhed", desc: "Ugentlige opsummeringer, belastningstrends og vejledning kommer automatisk, så intet afhænger af hukommelse eller af, at én træner bliver for evigt" },
  ],

  splitTitle: "Bygget til begge sider af ligningen",
  coachesLabel: "For trænere",
  coachesTitle: "Driv hele klubben fra én skærm",
  coachFeatures: [
    "Fuldt rosteroverblik over alle atleter",
    "Træningsbelastning og restitutionsflag",
    "Ugentlige rapporter pr. atlet med ét klik",
    "Øvelses- og teknikbibliotek med 100+ progressioner — klubbens viden, ikke én træners hukommelse",
    "Værktøjer til konkurrenceforberedelse",
  ],
  athletesLabel: "For atleter",
  athletesTitle: "Træn med struktur og feedback",
  athleteFeatures: [
    "Personlig træningsdagbog",
    "Dagligt paratheds-tjek",
    "Fremgang registreret automatisk over tid",
    "Se ugens træningsfokus fra din træner",
  ],

  testimonialsTitle: "Trænere der skiftede, skiftede ikke tilbage",
  testimonials: [
    { stat: "20 år", quote: "Endelig en platform bygget til, hvordan klubber faktisk udvikler atleter — ikke generel fitness.", name: "Træner Sami", club: "Klub i København" },
    { stat: "+3 t/uge", quote: "Mine atleter logger selv sessionerne nu. Jeg får 3 timer tilbage om ugen.", name: "Træner Janne", club: "Klub i Malmø" },
    { stat: "Forældre med", quote: "Den ugentlige rapport alene er det værd. Forældre forstår endelig, hvad vi bygger.", name: "Træner Michael", club: "Klub i London" },
  ],

  pricingTitle: "Vælg din plan",
  pricingSub: "14 dages gratis prøve på alle planer · ingen binding · opsig når som helst",
  mostPopular: "Mest populær",
  fromLabel: "",
  perMonth: "",
  currency: "",
  tiers: [
    { name: "Atlet", desc: "Til individuelle atleter", features: ["Én atletplads", "Kerne-træning og fremgang", "1 aktiv plan", "Mental & restitution"], cta: "Kontakt for pris" },
    { name: "Klub", desc: "Til klubber og hold", features: ["Flere atletpladser", "Alle moduler åbne", "Ubegrænsede planer", "Bulk-planlægning", "Holdoverblik"], cta: "Kontakt for pris" },
    { name: "Forbund", desc: "Til forbund og store organisationer", features: ["Ubegrænset antal atleter", "Alle moduler", "Ubegrænsede planer", "Onboarding inkluderet", "Prioritet support"], cta: "Kontakt for pris" },
  ],
  pricingFootnoteLead: "Spørgsmål om priser?",
  pricingFootnoteLink: "prissiden",
  pricingFootnoteFedLead: "Forbundsopsætning?",
  pricingFootnoteContact: "Skriv til Farooq@Sportstalent.dk",

  finalCtaTitle: "Din næste mester er allerede i din klub.",
  finalCtaDesc: "Giv alle atleter den træning de fortjener — uden regneark og udbrændthed.",
  finalCtaButton: "Start gratis i dag",

  footerCols: [
    { title: "Platform", links: [
      { label: "Funktioner", href: "#features" },
      { label: "Planer", href: "#pricing" },
      { label: "Metode", href: "/methodology" },
      { label: "Programmer", href: "/programs" },
      { label: "Hjælp", href: "/help" },
    ] },
    { title: "For trænere", links: [
      { label: "Træner-dashboard", href: "/platform/coach-dashboard" },
      { label: "Planbygger", href: "/platform/plan-builder" },
      { label: "Holdrapporter", href: "/platform/squad-reports" },
      { label: "Roster", href: "/platform/roster" },
      { label: "Book demo", href: "/contact" },
    ] },
    { title: "For atleter", links: [
      { label: "Dagbog", href: "/platform/diary" },
      { label: "Parathed", href: "/platform/readiness" },
      { label: "Fremgang", href: "/platform/progress" },
      { label: "Bibliotek", href: "/platform/library" },
      { label: "Kostplan", href: "/kostplan" },
    ] },
    { title: "Firma", links: [
      { label: "Om", href: "/about" },
      { label: "Kontakt", href: "/contact" },
      { label: "Privatliv", href: "/privacy" },
      { label: "Log ind", href: "/auth?tab=signin" },
      { label: "Kom i gang gratis", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · Bygget til danske klubber og forbund. Ikke flere regneark. Bare elite talentudvikling.",
  footerPrivacy: "Privatliv",
  footerContact: "Kontakt",
  galleryEyebrow: "RIGTIGE ATLETER · RIGTIGE ØJEBLIKKE",
  galleryTitle: "Bygget på træningsbanen — ikke bag et skrivebord.",
  gallerySub: "Sportstalent er formet af de øjeblikke trænere og atleter lever hver eneste uge, ikke af et regneark.",
  storyRows: [
    { eyebrow: "PÅ SIDELINJEN", title: "Coach hver atlet som om de var din eneste.", body: "Sportstalent giver dig den strukturerede plan, parathedsdata og påmindelser, så hver samtale er skarp — ikke improviseret fra hukommelsen.", bullets: ["Daglig parathed fra hver atlet", "Automatisk rullende ugeplaner", "Ét tryk for at logge træningen"] },
    { eyebrow: "TIL TRÆNING", title: "Sportsspecifik planlægning — ikke generisk fitness.", body: "Planer bygget om din sport: fart, styrke, teknisk arbejde og restitution — kalibreret til alder, niveau og mål.", bullets: ["Periodiserede 4–12 ugers programmer", "Faser før, under og efter konkurrence", "Kost der passer til træningsbelastning og præstationsmål"] },
    { eyebrow: "FØR KONKURRENCEN", title: "Se hvem der er klar — og hvem der ikke er.", body: "Én holdvisning viser humør, energi, søvn og belastning for hver atlet, så du kan justere før sessionen starter — ikke efter resultatet.", bullets: ["Holdets puls med trafiklys-status", "Overtrænings-flag to uger tidligere", "Trænernotater synkroniseret med atleten"] },
    { eyebrow: "EFTER KONKURRENCEN", title: "Gør hvert resultat til en lektion.", body: "Refleksioner efter konkurrence, video-tagging og SMART-mål sikrer, at næste cyklus starter dér, hvor den sidste sluttede.", bullets: ["4-trins refleksion efter hver konkurrence", "Video-tags på teknik & udfald", "3 personlige SMART-mål pr. cyklus"] },
  ],

  metaTitle: "Sportstalent — Træningsplatform for danske sportsklubber",
  metaDesc:
    "Træningsplatformen bygget til danske sportsklubber og forbund. Driv dit roster, følg parathed, byg periodiserede planer og send ugentlige rapporter — alt ét sted, GDPR-overholdende.",
};

const sv: CLStrings = {
  navFeatures: "Funktioner",
  navForCoaches: "För tränare",
  navForAthletes: "För atleter",
  navPricing: "Planer",
  navLogin: "Logga in",
  navGetStarted: "Kom igång",

  heroBadge: "OPERATIVSYSTEMET FÖR ELIT-TALANGUTVECKLING",
  heroTitle: "Coachingplattform för idrottsklubbar",
  heroPhrases: [
    "Inga fler kalkylblad.",
    "Inga fler lösa anteckningar.",
    "Ingen kunskap som försvinner ut genom dörren.",
    "Ett system för hela klubben.",
  ],
  heroDesc:
    "Sportstalent ersätter kalkylblad, anteckningsböcker och gruppchattar som klubbar använder för att hålla koll på träningen. Varje atlet får en personlig plan, beredskapsmätning och tävlingsförberedelse — automatiskt. Data ligger i EU. Du tränar. Du administrerar inte.",
  heroCtaPrimary: "Börja gratis — inget kort",
  heroCtaSecondary: "Se hur det fungerar",
  heroFinePrint: "14 dagars gratis prov · ingen bindning · avsluta när som helst",
  heroPrice: "14 dagars gratis provperiod — kontakta oss för pris",
  heroLeadMagnet: "Gratis guide: Hur du håller dina utövare motiverade hela säsongen →",
  heroLeadMagnetCta: "Ladda ner gratis (PDF)",

  mockSquadPulse: "Lagets puls",
  mockWeek: "Vecka 14 · 18 atleter",
  mockOnTrack: "PÅ SPÅR",
  mockSessionsLogged: "Loggade pass",
  mockThisWeek: "denna vecka",
  mockAvgReadiness: "Snitt-beredskap",
  mockVsLast: "+4 mot förra",
  mockWeeklyLoad: "Veckobelastning",
  mockTrimpDay: "TRIMP/dag",

  trustEyebrow: "Används av",
  trustLine: "Byggd av en tränare med 40 år på golvet. Anlitas av klubbar och förbund — GDPR-kompatibel, data lagras i EU.",

  featuresTitle1: "Allt din klubb behöver för att utveckla talang.",
  featuresTitle2: "Inget som står i vägen.",
  features: [
    { title: "Tränarassistent", desc: "Passrekommendationer, teknikvägledning och träningsråd byggda på fyrtio års tränarerfarenhet. Som en extra tränare i salen." },
    { title: "Träningsplansbyggare", desc: "Bygg periodiserade planer för alla åldrar och nivåer på minuter. Anpassad efter säsong, tävlingsschema och individuella mål." },
    { title: "Atletutveckling", desc: "Varje pass loggat. Varje beredskapscheck registrerad. Slipp leta i anteckningsböcker för att upptäcka ett mönster innan det blir en skada." },
    { title: "Veckorapporter", desc: "En tydlig, delbar sammanfattning av varje atlets vecka — redo för föräldrar, assisterande tränare eller förbund. Ingen manuell rapportskrivning." },
  ],

  howTitle: "Så fungerar det",
  steps: [
    { title: "Lägg till dina atleter", desc: "Sätt upp klubbens roster på under 5 minuter — utan kalkylblad" },
    { title: "Atleter loggar sin träning", desc: "Passtyp, intensitet, hur de mår — tar 60 sekunder efter passet" },
    { title: "Du tränar med klarhet", desc: "Veckosammanfattningar, belastningstrender och vägledning dyker upp automatiskt, så inget beror på minnet eller på att en tränare stannar för evigt" },
  ],

  splitTitle: "Byggd för båda sidor av ekvationen",
  coachesLabel: "För tränare",
  coachesTitle: "Driv hela klubben från en skärm",
  coachFeatures: [
    "Full rosteröversikt över alla atleter",
    "Belastningstrender och återhämtningsflaggor",
    "Veckorapporter per atlet med ett klick",
    "Övnings- och teknikbibliotek med 100+ progressioner — klubbens kunskap, inte en enskild tränares minne",
    "Verktyg för tävlingsförberedelse",
  ],
  athletesLabel: "För atleter",
  athletesTitle: "Träna med struktur och feedback",
  athleteFeatures: [
    "Personlig träningsdagbok",
    "Daglig beredskapscheck",
    "Framsteg registrerade automatiskt över tid",
    "Se veckans träningsfokus från din tränare",
  ],

  testimonialsTitle: "Tränare som bytte, bytte inte tillbaka",
  testimonials: [
    { stat: "20 år", quote: "Äntligen en plattform byggd för hur klubbar faktiskt utvecklar atleter — inte generell fitness.", name: "Tränare Sami", club: "Klub i København" },
    { stat: "+3 h/vecka", quote: "Mina atleter loggar sina pass själva nu. Jag får tillbaka 3 timmar i veckan.", name: "Tränare Janne", club: "Klub i Malmø" },
    { stat: "Föräldrar med", quote: "Bara veckorapporten är värd det. Föräldrar förstår äntligen vad vi bygger.", name: "Tränare Michael", club: "Klub i London" },
  ],

  pricingTitle: "Välj din plan",
  pricingSub: "14 dagars gratis prov på alla planer · ingen bindning · avsluta när som helst",
  mostPopular: "Mest populär",
  fromLabel: "",
  perMonth: "",
  currency: "",
  tiers: [
    { name: "Atlet", desc: "För enskilda atleter", features: ["En atletplats", "Kärnträning och utveckling", "1 aktiv plan", "Mental & återhämtning"], cta: "Kontakta för pris" },
    { name: "Klubb", desc: "För klubbar och lag", features: ["Flera atletplatser", "Alla moduler upplåsta", "Obegränsade planer", "Bulkplanering", "Lagöversikt"], cta: "Kontakta för pris" },
    { name: "Förbund", desc: "För förbund och stora organisationer", features: ["Obegränsat antal atleter", "Alla moduler", "Obegränsade planer", "Onboarding ingår", "Prioriterad support"], cta: "Kontakta för pris" },
  ],
  pricingFootnoteLead: "Frågor om priser?",
  pricingFootnoteLink: "prissidan",
  pricingFootnoteFedLead: "Förbundsuppsättning?",
  pricingFootnoteContact: "Skriv till Farooq@Sportstalent.dk",

  finalCtaTitle: "Din nästa mästare finns redan i din klubb.",
  finalCtaDesc: "Ge varje atlet den träning de förtjänar — utan kalkylblad och utan att bränna ut dig.",
  finalCtaButton: "Börja gratis idag",

  footerCols: [
    { title: "Plattform", links: [
      { label: "Funktioner", href: "#features" },
      { label: "Planer", href: "#pricing" },
      { label: "Metod", href: "/methodology" },
      { label: "Program", href: "/programs" },
      { label: "Hjälp", href: "/help" },
    ] },
    { title: "För tränare", links: [
      { label: "Tränardashboard", href: "/platform/coach-dashboard" },
      { label: "Planbyggare", href: "/platform/plan-builder" },
      { label: "Lagrapporter", href: "/platform/squad-reports" },
      { label: "Roster", href: "/platform/roster" },
      { label: "Boka demo", href: "/contact" },
    ] },
    { title: "För atleter", links: [
      { label: "Dagbok", href: "/platform/diary" },
      { label: "Beredskap", href: "/platform/readiness" },
      { label: "Utveckling", href: "/platform/progress" },
      { label: "Bibliotek", href: "/platform/library" },
      { label: "Kostplan", href: "/kostplan" },
    ] },
    { title: "Företag", links: [
      { label: "Om oss", href: "/about" },
      { label: "Kontakt", href: "/contact" },
      { label: "Integritet", href: "/privacy" },
      { label: "Logga in", href: "/auth?tab=signin" },
      { label: "Börja gratis", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · Byggd för klubbar och förbund. Inga fler kalkylblad. Bara elitutveckling.",
  footerPrivacy: "Integritet",
  footerContact: "Kontakt",
  galleryEyebrow: "RIKTIGA ATLETER · RIKTIGA ÖGONBLICK",
  galleryTitle: "Byggt på träningsplanen, inte bakom ett skrivbord.",
  gallerySub: "Sportstalent formas av ögonblicken tränare och atleter lever varje vecka, inte av ett kalkylblad.",
  storyRows: [
    { eyebrow: "VID SIDLINJEN", title: "Coacha varje atlet som om de var din enda.", body: "Sportstalent ger dig den strukturerade planen, beredskapsdata och påminnelser så varje samtal alltid är skarpt — inte improviserat ur minnet.", bullets: ["Daglig beredskap från varje atlet", "Automatiskt rullande veckoplaner", "Ett tryck för att logga passet"] },
    { eyebrow: "PÅ TRÄNINGEN", title: "Sportspecifik planering — inte generisk träning.", body: "Planer byggda kring din sport: snabbhet, styrka, tekniskt arbete och återhämtning — kalibrerat efter ålder, nivå och mål.", bullets: ["Periodiserade 4–12-veckorsprogram", "Faser före, under och efter tävling", "Kost som passar träningsbelastning och prestationsmål"] },
    { eyebrow: "FÖRE TÄVLING", title: "Se vem som är redo — och vem som inte är det.", body: "En lagvy visar humör, energi, sömn och belastning för varje atlet, så du kan justera innan passet börjar — inte efter resultatet.", bullets: ["Lagets puls med trafikljusstatus", "Överträningsflaggor två veckor tidigare", "Tränarens anteckningar synkade till atleten"] },
    { eyebrow: "EFTER TÄVLING", title: "Gör varje resultat till en lektion.", body: "Reflektioner efter tävling, videotaggning och SMART-mål säkerställer att nästa cykel börjar där förra slutade.", bullets: ["4-stegs reflektion efter varje tävling", "Videotaggar på teknik & utfall", "3 personliga SMART-mål per cykel"] },
  ],

  metaTitle: "Sportstalent — Plattform för svenska idrottsklubbar",
  metaDesc:
    "Träningsplattformen byggd för svenska idrottsklubbar och förbund. Driv ditt roster, följ beredskap, bygg periodiserade planer och skicka veckorapporter — allt på ett ställe, GDPR-kompatibelt.",
};

const no: CLStrings = {
  navFeatures: "Funksjoner",
  navForCoaches: "For trenere",
  navForAthletes: "For utøvere",
  navPricing: "Planer",
  navLogin: "Logg inn",
  navGetStarted: "Kom i gang",

  heroBadge: "OPERATIVSYSTEMET FOR ELITETALENTUTVIKLING",
  heroTitle: "Coaching-plattform for idrettsklubber",
  heroPhrases: [
    "Ikke flere regneark.",
    "Ikke flere spredte notater.",
    "Ikke mer kunnskap som forsvinner ut døren.",
    "Ett system for hele klubben.",
  ],
  heroDesc:
    "Sportstalent erstatter regnearkene, notatbøkene og gruppechattene klubber bruker for å holde styr på treningen. Hver utøver får en personlig plan, beredskapsmåling og konkurranseforberedelse — automatisk. Data ligger i EU. Du trener. Du administrerer ikke.",
  heroCtaPrimary: "Start gratis — intet kort",
  heroCtaSecondary: "Se hvordan det fungerer",
  heroFinePrint: "14 dagers gratis prøve · ingen binding · si opp når som helst",
  heroPrice: "14 dagers gratis prøveperiode — kontakt oss for pris",
  heroLeadMagnet: "Gratis guide: Slik holder du utøverne motiverte hele sesongen →",
  heroLeadMagnetCta: "Last ned gratis (PDF)",

  mockSquadPulse: "Lagets puls",
  mockWeek: "Uke 14 · 18 utøvere",
  mockOnTrack: "PÅ SPORET",
  mockSessionsLogged: "Loggede økter",
  mockThisWeek: "denne uken",
  mockAvgReadiness: "Snitt-beredskap",
  mockVsLast: "+4 vs forrige",
  mockWeeklyLoad: "Ukentlig belastning",
  mockTrimpDay: "TRIMP/dag",

  trustEyebrow: "Brukt av",
  trustLine: "Bygget av en trener med 40 år på gulvet. Brukt av klubber og forbund — GDPR-kompatibel, data lagres i EU.",

  featuresTitle1: "Alt klubben din trenger for å utvikle talent.",
  featuresTitle2: "Ingenting som er i veien.",
  features: [
    { title: "Treningsassistent", desc: "Øktanbefalinger, teknikkveiledning og treningsråd bygget på førti års trenererfaring. Som å ha en ekstra trener i salen." },
    { title: "Treningsplan-bygger", desc: "Bygg periodiserte planer for enhver alder og ethvert nivå på minutter. Tilpasset sesongen, konkurranseplanen og individuelle mål." },
    { title: "Utøverutvikling", desc: "Hver økt logget. Hver beredskapssjekk registrert. Slipp å lete i notatbøker for å oppdage et mønster før det blir en skade." },
    { title: "Ukentlige rapporter", desc: "En tydelig, delbar oppsummering av hver utøvers uke — klar for foreldre, assistenttrenere eller forbund. Ingen manuell rapportskriving." },
  ],

  howTitle: "Slik fungerer det",
  steps: [
    { title: "Legg til utøverne dine", desc: "Sett opp klubbens roster på under 5 minutter — uten regneark" },
    { title: "Utøvere logger treningen sin", desc: "Økttype, intensitet, hvordan de føler seg — tar 60 sekunder etter trening" },
    { title: "Du trener med klarhet", desc: "Ukentlige oppsummeringer, belastningstrender og veiledning kommer automatisk, så ingenting avhenger av hukommelse eller av at én trener blir for alltid" },
  ],

  splitTitle: "Bygd for begge sider av ligningen",
  coachesLabel: "For trenere",
  coachesTitle: "Driv hele klubben fra én skjerm",
  coachFeatures: [
    "Fullt rosteroverblikk over alle utøvere",
    "Belastningstrender og restitusjonsflagg",
    "Ukentlige rapporter per utøver med ett klikk",
    "Øvelses- og teknikkbibliotek med 100+ progresjoner — klubbens kunnskap, ikke én treners hukommelse",
    "Verktøy for konkurranseforberedelse",
  ],
  athletesLabel: "For utøvere",
  athletesTitle: "Tren med struktur og tilbakemelding",
  athleteFeatures: [
    "Personlig treningsdagbok",
    "Daglig beredskapssjekk",
    "Fremgang registrert automatisk over tid",
    "Se ukens treningsfokus fra treneren din",
  ],

  testimonialsTitle: "Trenere som byttet, byttet ikke tilbake",
  testimonials: [
    { stat: "20 år", quote: "Endelig en plattform bygget for hvordan klubber faktisk utvikler utøvere — ikke generell fitness.", name: "Trener Sami", club: "Klub i København" },
    { stat: "+3 t/uke", quote: "Utøverne mine logger øktene selv nå. Jeg får tilbake 3 timer i uken.", name: "Trener Janne", club: "Klub i Malmø" },
    { stat: "Foreldre med", quote: "Den ukentlige rapporten alene er verdt det. Foreldre forstår endelig hva vi bygger.", name: "Trener Michael", club: "Klub i London" },
  ],

  pricingTitle: "Velg din plan",
  pricingSub: "14 dagers gratis prøve på alle planer · ingen binding · si opp når som helst",
  mostPopular: "Mest populær",
  fromLabel: "",
  perMonth: "",
  currency: "",
  tiers: [
    { name: "Utøver", desc: "For individuelle utøvere", features: ["Én utøverplass", "Kjernetrening og fremgang", "1 aktiv plan", "Mental & restitusjon"], cta: "Kontakt for pris" },
    { name: "Klubb", desc: "For klubber og lag", features: ["Flere utøverplasser", "Alle moduler åpne", "Ubegrensede planer", "Bulk-planlegging", "Lagoversikt"], cta: "Kontakt for pris" },
    { name: "Forbund", desc: "For forbund og store organisasjoner", features: ["Ubegrenset antall utøvere", "Alle moduler", "Ubegrensede planer", "Onboarding inkludert", "Prioritert støtte"], cta: "Kontakt for pris" },
  ],
  pricingFootnoteLead: "Spørsmål om priser?",
  pricingFootnoteLink: "prissiden",
  pricingFootnoteFedLead: "Forbundsoppsett?",
  pricingFootnoteContact: "Skriv til Farooq@Sportstalent.dk",

  finalCtaTitle: "Din neste mester er allerede i klubben din.",
  finalCtaDesc: "Gi hver utøver treningen de fortjener — uten regneark og uten å brenne ut.",
  finalCtaButton: "Start gratis i dag",

  footerCols: [
    { title: "Plattform", links: [
      { label: "Funksjoner", href: "#features" },
      { label: "Planer", href: "#pricing" },
      { label: "Metode", href: "/methodology" },
      { label: "Programmer", href: "/programs" },
      { label: "Hjelp", href: "/help" },
    ] },
    { title: "For trenere", links: [
      { label: "Trenerdashboard", href: "/platform/coach-dashboard" },
      { label: "Planbygger", href: "/platform/plan-builder" },
      { label: "Lagrapporter", href: "/platform/squad-reports" },
      { label: "Roster", href: "/platform/roster" },
      { label: "Book demo", href: "/contact" },
    ] },
    { title: "For utøvere", links: [
      { label: "Dagbok", href: "/platform/diary" },
      { label: "Beredskap", href: "/platform/readiness" },
      { label: "Fremgang", href: "/platform/progress" },
      { label: "Bibliotek", href: "/platform/library" },
      { label: "Kostplan", href: "/kostplan" },
    ] },
    { title: "Selskap", links: [
      { label: "Om oss", href: "/about" },
      { label: "Kontakt", href: "/contact" },
      { label: "Personvern", href: "/privacy" },
      { label: "Logg inn", href: "/auth?tab=signin" },
      { label: "Start gratis", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · Bygget for klubber og forbund. Ikke flere regneark. Bare elitetalentutvikling.",
  footerPrivacy: "Personvern",
  footerContact: "Kontakt",
  galleryEyebrow: "EKTE UTØVERE · EKTE ØYEBLIKK",
  galleryTitle: "Bygget på treningsfeltet, ikke bak et skrivebord.",
  gallerySub: "Sportstalent formes av øyeblikkene trenere og utøvere lever hver uke, ikke av et regneark.",
  storyRows: [
    { eyebrow: "PÅ SIDELINJEN", title: "Coach hver utøver som om de var din eneste.", body: "Sportstalent gir deg den strukturerte planen, beredskapsdataene og påminnelsene så hver samtale alltid er skarp — ikke improvisert fra hukommelsen.", bullets: ["Daglig beredskap fra hver utøver", "Automatisk rullerende ukeplaner", "Ett trykk for å logge økten"] },
    { eyebrow: "PÅ TRENING", title: "Sportsspesifikk planlegging — ikke generisk trening.", body: "Planer bygget rundt din idrett: fart, styrke, teknisk arbeid og restitusjon — kalibrert til alder, nivå og mål.", bullets: ["Periodiserte 4–12 ukers programmer", "Faser før, under og etter konkurranse", "Kost tilpasset treningsbelastning og prestasjonsmål"] },
    { eyebrow: "FØR KONKURRANSEN", title: "Se hvem som er klar — og hvem som ikke er det.", body: "Én lagvisning viser humør, energi, søvn og belastning for hver utøver, så du kan justere før økten starter — ikke etter resultatet.", bullets: ["Squad-puls med trafikklys-status", "Overtreningsflagg to uker tidligere", "Trenernotater synkronisert med utøveren"] },
    { eyebrow: "ETTER KONKURRANSEN", title: "Gjør hvert resultat til en lekse.", body: "Refleksjoner etter konkurranse, video-tagging og SMART-mål sikrer at neste syklus starter der den forrige sluttet.", bullets: ["4-stegs refleksjon etter hver konkurranse", "Video-tags på teknikk & utfall", "3 personlige SMART-mål per syklus"] },
  ],

  metaTitle: "Sportstalent — Plattform for norske idrettsklubber",
  metaDesc:
    "Treningsplattformen bygd for idrettsklubber og forbund. Driv rosteret ditt, følg beredskap, bygg periodiserte planer og send ukentlige rapporter — alt på ett sted, GDPR-kompatibelt.",
};

const de: CLStrings = {
  navFeatures: "Funktionen",
  navForCoaches: "Für Trainer",
  navForAthletes: "Für Athleten",
  navPricing: "Pläne",
  navLogin: "Anmelden",
  navGetStarted: "Loslegen",

  heroBadge: "GEBAUT FÜR TAEKWONDO-TRAINER",
  heroTitle: "Coaching-Plattform für Sportvereine",
  heroPhrases: [
    "Du hast Zeit für 3.",
    "Sportstalent ändert das.",
    "Jeder Athlet. Jede Woche.",
    "Deine beste Saison beginnt jetzt.",
  ],
  heroDesc:
    "Sportstalent gibt jedem Athleten in deinem Verein einen personalisierten Trainingsplan, Bereitschaftsverfolgung und Wettkampfvorbereitung — automatisch. Damit du trainierst. Nicht administrierst.",
  heroCtaPrimary: "Kostenlos starten — keine Kreditkarte",
  heroCtaSecondary: "So funktioniert es",
  heroFinePrint: "14 Tage kostenlos testen · keine Bindung · jederzeit kündbar",
  heroPrice: "14 Tage kostenlose Testphase — kontaktiere uns für Preise",
  heroLeadMagnet: "Gratis-Guide: So hältst du deine Athleten die ganze Saison motiviert →",
  heroLeadMagnetCta: "Kostenlos herunterladen (PDF)",

  mockSquadPulse: "Team-Puls",
  mockWeek: "Woche 14 · 18 Athleten",
  mockOnTrack: "AUF KURS",
  mockSessionsLogged: "Erfasste Einheiten",
  mockThisWeek: "diese Woche",
  mockAvgReadiness: "Ø Bereitschaft",
  mockVsLast: "+4 vs. letzte",
  mockWeeklyLoad: "Wochenbelastung",
  mockTrimpDay: "TRIMP/Tag",

  trustEyebrow: "Genutzt von",
  trustLine: "Genutzt von Vereinen mit Fokus auf Sparring und Poomsae — gebaut, damit jeder Verein profitiert.",

  featuresTitle1: "Alles, was dein Verein braucht.",
  featuresTitle2: "Nichts, was er nicht braucht.",
  features: [
    { title: "Trainer-Assistent", desc: "Erhalte Empfehlungen, Technik-Hinweise und Trainingsrat aus tiefem Sportwissen. Wie ein zweiter Trainer im Raum." },
    { title: "Trainingsplan-Builder", desc: "Periodisierte Pläne für jede Gürtelstufe in Minuten. Angepasst an Alter, Wettkampfplan und individuelle Ziele." },
    { title: "Athleten-Fortschritt", desc: "Jede Einheit erfasst. Jeder Bereitschafts-Check dokumentiert. Erkenne Muster, bevor sie zu Verletzungen werden." },
    { title: "Wöchentliche Berichte", desc: "Eine klare, teilbare Wochenübersicht pro Athlet — bereit für Eltern, Co-Trainer oder Verband." },
  ],

  howTitle: "So funktioniert's",
  steps: [
    { title: "Athleten hinzufügen", desc: "Vereinskader in unter 5 Minuten einrichten" },
    { title: "Athleten loggen ihr Training", desc: "Art, Intensität, Befinden — 60 Sekunden nach dem Training" },
    { title: "Du trainierst mit Klarheit", desc: "Wochenübersichten, Belastungstrends und Hinweise erscheinen automatisch — du fokussierst dich auf die Matte" },
  ],

  splitTitle: "Gebaut für beide Seiten der Gleichung",
  coachesLabel: "Für Trainer",
  coachesTitle: "Den ganzen Verein von einem Bildschirm leiten",
  coachFeatures: [
    "Vollständiger Kader-Überblick",
    "Belastungstrends und Erholungs-Flags",
    "Wochenberichte pro Athlet mit einem Klick",
    "Übungs- und Technikbibliothek mit 100+ sportartspezifischen Übungen und Progressionen",
    "Werkzeuge zur Wettkampfvorbereitung",
  ],
  athletesLabel: "Für Athleten",
  athletesTitle: "Mit Struktur und Feedback trainieren",
  athleteFeatures: [
    "Persönliches Trainingstagebuch",
    "Tägliche Bereitschaftsprüfung",
    "Fortschritt über die Zeit — Gürtel für Gürtel",
    "Wochen-Trainingsfokus vom Trainer sehen",
  ],

  testimonialsTitle: "Trainer, die wechselten, blieben dabei",
  testimonials: [
    { stat: "20 Jahre", quote: "Endlich eine Plattform, die versteht, wie Vereine wirklich Athleten entwickeln — nicht generisches Fitness.", name: "Trainer Sami", club: "Klub i København" },
    { stat: "+3 Std/Woche", quote: "Meine Athleten loggen ihre Einheiten selbst. Ich gewinne 3 Stunden pro Woche zurück.", name: "Trainer Janne", club: "Klub i Malmø" },
    { stat: "Eltern dabei", quote: "Allein der Wochenbericht ist es wert. Eltern verstehen endlich, was wir aufbauen.", name: "Trainer Michael", club: "Klub i London" },
  ],

  pricingTitle: "Wähle deinen Plan",
  pricingSub: "14 Tage kostenlos auf allen Plänen · keine Bindung · jederzeit kündbar",
  mostPopular: "Am beliebtesten",
  fromLabel: "",
  perMonth: "",
  currency: "",
  tiers: [
    { name: "Athlet", desc: "Für einzelne Athleten", features: ["Ein Athletenplatz", "Kerntraining & Fortschritt", "1 aktiver Plan", "Mental & Erholung"], cta: "Kontakt für Preis" },
    { name: "Verein", desc: "Für Vereine und Teams", features: ["Mehrere Athletenplätze", "Alle Module freigeschaltet", "Unbegrenzte Pläne", "Bulk-Planung", "Team-Übersicht"], cta: "Kontakt für Preis" },
    { name: "Verband", desc: "Für Verbände und große Organisationen", features: ["Unbegrenzte Athleten", "Alle Module", "Unbegrenzte Pläne", "Onboarding inklusive", "Priorisierter Support"], cta: "Kontakt für Preis" },
  ],
  pricingFootnoteLead: "Fragen zu den Preisen?",
  pricingFootnoteLink: "Preisseite",
  pricingFootnoteFedLead: "Verbands-Setup?",
  pricingFootnoteContact: "Schreib an Farooq@Sportstalent.dk",

  finalCtaTitle: "Dein nächster Champion ist bereits in deinem Verein.",
  finalCtaDesc: "Gib jedem Athleten das Training, das er verdient — ohne auszubrennen.",
  finalCtaButton: "Heute kostenlos starten",

  footerCols: [
    { title: "Plattform", links: [
      { label: "Funktionen", href: "#features" },
      { label: "Pläne", href: "#pricing" },
      { label: "Methodik", href: "/methodology" },
      { label: "Programme", href: "/programs" },
      { label: "Hilfe", href: "/help" },
    ] },
    { title: "Für Trainer", links: [
      { label: "Trainer-Dashboard", href: "/platform/coach-dashboard" },
      { label: "Plan-Builder", href: "/platform/plan-builder" },
      { label: "Team-Berichte", href: "/platform/squad-reports" },
      { label: "Kader", href: "/platform/roster" },
      { label: "Demo buchen", href: "/contact" },
    ] },
    { title: "Für Athleten", links: [
      { label: "Tagebuch", href: "/platform/diary" },
      { label: "Bereitschaft", href: "/platform/readiness" },
      { label: "Fortschritt", href: "/platform/progress" },
      { label: "Bibliothek", href: "/platform/library" },
      { label: "Ernährungsplan", href: "/kostplan" },
    ] },
    { title: "Unternehmen", links: [
      { label: "Über uns", href: "/about" },
      { label: "Kontakt", href: "/contact" },
      { label: "Datenschutz", href: "/privacy" },
      { label: "Anmelden", href: "/auth?tab=signin" },
      { label: "Kostenlos starten", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · Gemacht für dänische Vereine. Entwickelt, um Elitetalente zu fördern.",
  footerPrivacy: "Datenschutz",
  footerContact: "Kontakt",
  galleryEyebrow: "ECHTE ATHLETEN · ECHTE MOMENTE",
  galleryTitle: "Am Ring entwickelt – nicht am Schreibtisch.",
  gallerySub: "Von der Ecke bis zur Matte – Sportstalent entsteht aus den Momenten, die Trainer und Athleten jedes Wochenende erleben.",
  storyRows: [
    { eyebrow: "IN DER ECKE", title: "Trainiere jeden Athleten, als wäre er der einzige.", body: "Sportstalent liefert dir den strukturierten Plan, Bereitschaftsdaten und Erinnerungen, damit das Gespräch in der Ecke immer scharf ist — nicht improvisiert.", bullets: ["Tägliche Bereitschaft jedes Athleten", "Automatisch rollende Wochenpläne", "Ein Tipp, um die Einheit zu loggen"] },
    { eyebrow: "AUF DER MATTE", title: "Sportspezifische Wissenschaft – kein generisches Fitness.", body: "Pläne rund um deinen Sport: Schnelligkeit, Kraft, technisches Training und Erholung – kalibriert auf Alter, Niveau und Ziel.", bullets: ["Periodisierte 4–12-Wochen-Programme", "Phasen vor, während und nach dem Wettkampf", "Ernährung passend zu Trainingsbelastung und Gewichtszielen"] },
    { eyebrow: "VOR DEM KAMPF", title: "Sieh, wer bereit ist — und wer nicht.", body: "Eine Squad-Ansicht zeigt Stimmung, Energie, Schlaf und Belastung jedes Athleten, damit du vor dem Aufwärmen nachjustieren kannst — nicht nach der Niederlage.", bullets: ["Squad-Puls mit Ampelstatus", "Übertraining-Warnungen zwei Wochen früher", "Trainernotizen mit dem Athleten synchronisiert"] },
    { eyebrow: "NACH DEM KAMPF", title: "Mach jeden Kampf zur Lektion.", body: "Reflexionen nach dem Wettkampf, Video-Tagging und SMART-Ziele sorgen dafür, dass der nächste Zyklus dort beginnt, wo der letzte aufhörte.", bullets: ["4-Schritte-Reflexion nach jedem Kampf", "Video-Tags nach Technik & Ergebnis", "3 persönliche SMART-Ziele pro Zyklus"] },
  ],

  metaTitle: "Sportstalent — Plattform für dänische Sportvereine",
  metaDesc:
    "Die Trainingsplattform für dänische Sportvereine. Verwalte deinen Kader, verfolge die Bereitschaft, baue periodisierte Pläne und sende wöchentliche Berichte — alles an einem Ort.",
};

const ar: CLStrings = {
  navFeatures: "الميزات",
  navForCoaches: "للمدربين",
  navForAthletes: "للرياضيين",
  navPricing: "الخطط",
  navLogin: "تسجيل الدخول",
  navGetStarted: "ابدأ الآن",

  heroBadge: "مصمم لمدربي التايكوندو",
  heroTitle: "منصة تدريب لأندية التايكوندو",
  heroPhrases: [
    "لديك وقت لـ 3 فقط.",
    "Sportstalent يغيّر ذلك.",
    "كل رياضي. كل أسبوع.",
    "موسمك الأفضل يبدأ الآن.",
  ],
  heroDesc:
    "يمنح Sportstalent كل رياضي في ناديك خطة تدريب شخصية ومتابعة الجاهزية والتحضير للمنافسات — تلقائياً. لتركّز على التدريب. لا الإدارة.",
  heroCtaPrimary: "ابدأ مجاناً — بدون بطاقة",
  heroCtaSecondary: "شاهد كيف يعمل",
  heroFinePrint: "تجربة مجانية 14 يوماً · بدون التزام · ألغِ في أي وقت",
  heroPrice: "تجربة مجانية 14 يوماً — تواصل معنا للأسعار",
  heroLeadMagnet: "دليل مجاني: كيف تحافظ على تحفيز رياضييك طوال الموسم ←",
  heroLeadMagnetCta: "تحميل مجاناً (PDF)",

  mockSquadPulse: "نبض الفريق",
  mockWeek: "الأسبوع 14 · 18 رياضي",
  mockOnTrack: "على المسار",
  mockSessionsLogged: "الجلسات المسجلة",
  mockThisWeek: "هذا الأسبوع",
  mockAvgReadiness: "متوسط الجاهزية",
  mockVsLast: "+4 مقارنة بالسابق",
  mockWeeklyLoad: "الحمل الأسبوعي",
  mockTrimpDay: "TRIMP/يوم",

  trustEyebrow: "تستخدمه",
  trustLine: "تستخدمه أندية متخصصة في القتال والبومسي — ومصمم ليستفيد منه أي نادٍ.",

  featuresTitle1: "كل ما يحتاجه ناديك.",
  featuresTitle2: "ولا شيء لا يحتاجه.",
  features: [
    { title: "مساعد التدريب", desc: "احصل على توصيات الجلسات وإرشادات الفنية ونصائح التدريب من معرفة رياضية عميقة. كأن لديك مدرباً ثانياً في القاعة." },
    { title: "أداة بناء الخطط", desc: "ابنِ خططاً مرحلية لأي مستوى حزام في دقائق. مخصصة حسب العمر وجدول البطولات والأهداف الفردية." },
    { title: "متابعة تقدّم الرياضيين", desc: "كل جلسة مسجلة. كل فحص جاهزية موثّق. اكتشف الأنماط قبل أن تتحول إلى إصابات." },
    { title: "تقارير أسبوعية", desc: "ملخص واضح وقابل للمشاركة لأسبوع كل رياضي — جاهز للأهل أو المدربين المساعدين أو الاتحاد." },
  ],

  howTitle: "كيف يعمل",
  steps: [
    { title: "أضف رياضييك", desc: "أعد قائمة النادي في أقل من 5 دقائق" },
    { title: "يسجل الرياضيون تدريبهم", desc: "نوع الجلسة والمجهود وكيف يشعرون — 60 ثانية بعد التدريب" },
    { title: "تدرّب بوضوح", desc: "تظهر الملخصات الأسبوعية وأنماط الحمل والإرشادات تلقائياً لتركّز على البساط" },
  ],

  splitTitle: "مصمم لطرفي المعادلة",
  coachesLabel: "للمدربين",
  coachesTitle: "أدر ناديك بأكمله من شاشة واحدة",
  coachFeatures: [
    "نظرة كاملة على جميع الرياضيين",
    "اتجاهات الحمل وعلامات التعافي",
    "تقارير أسبوعية لكل رياضي بنقرة واحدة",
    "مكتبة تمارين وفنيات تتضمن أكثر من 100 تمرين وتدرّج خاص بالرياضة",
    "أدوات للتحضير للبطولات",
  ],
  athletesLabel: "للرياضيين",
  athletesTitle: "تدرب بهيكلية وملاحظات",
  athleteFeatures: [
    "يوميات تدريب شخصية",
    "فحص جاهزية يومي",
    "التقدم عبر الزمن — حزام بحزام",
    "اطّلع على تركيز التدريب الأسبوعي من مدربك",
  ],

  testimonialsTitle: "المدربون الذين انتقلوا، لم يعودوا",
  testimonials: [
    { stat: "20 سنة", quote: "أخيراً منصة مبنية لكيفية تطوير الأندية للرياضيين فعلاً — وليست لياقة عامة فحسب.", name: "المدرب سامي", club: "Klub i København" },
    { stat: "+3 ساعات/أسبوع", quote: "رياضيوني يسجلون جلساتهم بأنفسهم الآن. أوفر 3 ساعات أسبوعياً.", name: "المدرب جني", club: "Klub i Malmø" },
    { stat: "الأهل معنا", quote: "التقرير الأسبوعي وحده يستحق ذلك. أصبح الأهل يفهمون ما نبنيه.", name: "المدرب مايكل", club: "Klub i London" },
  ],

  pricingTitle: "تسعير بسيط",
  pricingSub: "تجربة مجانية 14 يوماً · بدون التزام · ألغِ في أي وقت",
  mostPopular: "الأكثر شعبية",
  fromLabel: "ابتداءً من",
  perMonth: "EUR/شهر",
  currency: "EUR",
  prices: ["4.99", "12.99", "49", "89", "129"],
  tiers: [
    { name: "رياضي", desc: "للرياضيين الأفراد", features: ["مقعد رياضي واحد", "التدريب الأساسي والتقدم", "خطة نشطة واحدة", "متابعة الذهنية والتعافي"], cta: "ابدأ" },
    { name: "Coach Solo", desc: "للمدربين المستقلين", features: ["مقعد مدرب", "كل الوحدات مفتوحة", "خطة نشطة واحدة", "مكتبة الأداء كاملة"], cta: "ابدأ" },
    { name: "Team Small", desc: "حتى 5 رياضيين", features: ["5 مقاعد", "كل الوحدات", "خطط غير محدودة", "إنشاء خطط بالجملة", "نظرة عامة على الفريق"], cta: "ابدأ التجربة المجانية" },
    { name: "Team Medium", desc: "حتى 15 رياضي", features: ["15 مقعد", "كل الوحدات", "خطط غير محدودة", "تخطيط بالجملة", "إعداد مرفق"], cta: "ابدأ التجربة المجانية" },
    { name: "Team Large", desc: "حتى 25 رياضي", features: ["25 مقعد", "كل الوحدات", "خطط غير محدودة", "إعداد", "دعم ذو أولوية"], cta: "ابدأ التجربة المجانية" },
  ],
  pricingFootnoteLead: "اطّلع على كل الخطط والخصومات السنوية على",
  pricingFootnoteLink: "صفحة الأسعار",
  pricingFootnoteFedLead: "إعداد للاتحاد؟",
  pricingFootnoteContact: "تواصل معنا",

  finalCtaTitle: "بطلك القادم موجود بالفعل في ناديك.",
  finalCtaDesc: "امنح كل رياضي التدريب الذي يستحقه — دون أن تنهك نفسك.",
  finalCtaButton: "ابدأ مجاناً اليوم",

  footerCols: [
    { title: "المنصة", links: [
      { label: "الميزات", href: "#features" },
      { label: "الخطط", href: "#pricing" },
      { label: "المنهجية", href: "/methodology" },
      { label: "البرامج", href: "/programs" },
      { label: "المساعدة", href: "/help" },
    ] },
    { title: "للمدربين", links: [
      { label: "لوحة المدرب", href: "/platform/coach-dashboard" },
      { label: "بانئ الخطط", href: "/platform/plan-builder" },
      { label: "تقارير الفريق", href: "/platform/squad-reports" },
      { label: "القائمة", href: "/platform/roster" },
      { label: "احجز عرضاً", href: "/contact" },
    ] },
    { title: "للرياضيين", links: [
      { label: "اليوميات", href: "/platform/diary" },
      { label: "فحص الجاهزية", href: "/platform/readiness" },
      { label: "تتبع التقدم", href: "/platform/progress" },
      { label: "مكتبة الأداء", href: "/platform/library" },
      { label: "خطة التغذية", href: "/kostplan" },
    ] },
    { title: "الشركة", links: [
      { label: "من نحن", href: "/about" },
      { label: "تواصل", href: "/contact" },
      { label: "الخصوصية", href: "/privacy" },
      { label: "تسجيل الدخول", href: "/auth?tab=signin" },
      { label: "ابدأ مجاناً", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · صُنع للأندية الدنماركية. مبني لتطوير المواهب النخبوية.",
  footerPrivacy: "الخصوصية",
  footerContact: "تواصل",
  galleryEyebrow: "رياضيون حقيقيون · لحظات حقيقية",
  galleryTitle: "بُني على حافة الحلبة، لا خلف المكتب.",
  gallerySub: "من الزاوية إلى البساط — يتشكل Sportstalent من اللحظات التي يعيشها المدربون والرياضيون كل عطلة أسبوع.",
  storyRows: [
    { eyebrow: "في الزاوية", title: "درّب كل رياضي وكأنه الوحيد لديك.", body: "يمنحك Sportstalent الخطة المنظمة وبيانات الجاهزية والتذكيرات حتى تكون الحوارات في الزاوية حادة دائماً — لا ارتجال.", bullets: ["جاهزية يومية من كل رياضي", "خطط أسبوعية تتدحرج تلقائياً", "ضغطة واحدة لتسجيل الجلسة"] },
    { eyebrow: "على البساط", title: "علم رياضي متخصص — لا لياقة عامة.", body: "خطط مبنية حول رياضتك: السرعة والقوة والعمل التقني والتعافي — معايرة للعمر والمستوى والهدف.", bullets: ["برامج مُجدولة 4–12 أسبوعاً", "مراحل قبل وأثناء وبعد المنافسة", "تغذية تناسب حمل التدريب وأهداف الوزن"] },
    { eyebrow: "قبل المباراة", title: "شاهد من هو جاهز — ومن ليس كذلك.", body: "عرض واحد للفريق يُظهر المزاج والطاقة والنوم والحمل لكل رياضي، فتعدّل قبل الإحماء — لا بعد الخسارة.", bullets: ["نبض الفريق بحالة إشارة المرور", "إنذار الإفراط في التدريب قبل أسبوعين", "ملاحظات المدرّب متزامنة مع الرياضي"] },
    { eyebrow: "بعد المباراة", title: "حوّل كل مباراة إلى درس.", body: "التأملات بعد المنافسة، ووسم الفيديو، وأهداف SMART تضمن أن تبدأ الدورة التالية من حيث انتهت السابقة.", bullets: ["تأمل من 4 خطوات بعد كل مباراة", "وسوم فيديو حسب التقنية والنتيجة", "3 أهداف SMART شخصية لكل دورة"] },
  ],

  metaTitle: "Sportstalent — منصة تدريب مصممة للأندية الرياضية الدنماركية",
  metaDesc:
    "منصة التدريب المصممة للأندية الرياضية الدنماركية. أدر القائمة، تابع الجاهزية، ابنِ خططاً مرحلية وأرسل تقارير أسبوعية — كل ذلك في مكان واحد.",
};

const es: CLStrings = {
  navFeatures: "Funciones",
  navForCoaches: "Para entrenadores",
  navForAthletes: "Para atletas",
  navPricing: "Planes",
  navLogin: "Iniciar sesión",
  navGetStarted: "Empezar",

  heroBadge: "El sistema operativo para el desarrollo de talento de élite",
  heroTitle: "Plataforma de coaching para clubes deportivos",
  heroPhrases: [
    "Tienes tiempo para 3.",
    "Sportstalent cambia eso.",
    "Cada atleta. Cada semana.",
    "Tu mejor temporada empieza ahora.",
  ],
  heroDesc:
    "Sportstalent da a cada atleta de tu club un plan de entrenamiento personalizado, seguimiento de preparación y preparación para competiciones — automáticamente. Para que entrenes. No administres.",
  heroCtaPrimary: "Empieza gratis — sin tarjeta",
  heroCtaSecondary: "Ver cómo funciona",
  heroFinePrint: "14 días de prueba gratuita · sin compromiso · cancela cuando quieras",
  heroPrice: "14 días de prueba gratuita — contáctanos para precios",
  heroLeadMagnet: "Guía gratuita: Cómo mantener motivados a tus atletas toda la temporada →",
  heroLeadMagnetCta: "Descargar gratis (PDF)",

  mockSquadPulse: "Pulso del equipo",
  mockWeek: "Semana 14 · 18 atletas",
  mockOnTrack: "EN CAMINO",
  mockSessionsLogged: "Sesiones registradas",
  mockThisWeek: "esta semana",
  mockAvgReadiness: "Preparación media",
  mockVsLast: "+4 vs anterior",
  mockWeeklyLoad: "Carga semanal",
  mockTrimpDay: "TRIMP/día",

  trustEyebrow: "Utilizado por",
  trustLine: "Usado por clubs especializados en combate y poomsae — y diseñado para que cualquier club pueda beneficiarse.",

  featuresTitle1: "Todo lo que tu club necesita.",
  featuresTitle2: "Nada más.",
  features: [
    { title: "Asistente de entrenamiento", desc: "Obtén recomendaciones de sesiones, orientación técnica y consejos de entrenamiento basados en un profundo conocimiento del deporte. Como tener un segundo entrenador en la sala." },
    { title: "Creador de planes de entrenamiento", desc: "Crea planes periodizados para cualquier nivel de cinturón en minutos. Adaptados a la edad, el calendario de competición y los objetivos individuales." },
    { title: "Seguimiento del progreso del atleta", desc: "Cada sesión registrada. Cada chequeo de preparación guardado. Detecta patrones antes de que se conviertan en lesiones." },
    { title: "Informes semanales de rendimiento", desc: "Un resumen claro y compartible de la semana de cada atleta — listo para padres, entrenadores asistentes o revisiones federativas." },
  ],

  howTitle: "Cómo funciona",
  steps: [
    { title: "Añade a tus atletas", desc: "Configura la plantilla de tu club en menos de 5 minutos" },
    { title: "Los atletas registran su entrenamiento", desc: "Tipo de sesión, esfuerzo, cómo se sienten — tarda 60 segundos tras el entrenamiento" },
    { title: "Entrenas con claridad", desc: "Los resúmenes semanales, las tendencias de carga y la orientación aparecen automáticamente para que puedas centrarte en el tatami" },
  ],

  splitTitle: "Hecho para ambos lados de la ecuación",
  coachesLabel: "Para entrenadores",
  coachesTitle: "Gestiona todo tu club desde una sola pantalla",
  coachFeatures: [
    "Vista completa de toda la plantilla",
    "Tendencias de carga de entrenamiento y alertas de recuperación",
    "Informes semanales por atleta con un solo clic",
    "Biblioteca de ejercicios y técnicas con más de 100 ejercicios y progresiones específicas del deporte",
    "Herramientas de planificación para la preparación de competiciones",
  ],
  athletesLabel: "Para atletas",
  athletesTitle: "Entrena con estructura y retroalimentación",
  athleteFeatures: [
    "Diario personal de sesiones",
    "Chequeo diario de preparación",
    "Progreso a lo largo del tiempo — de cinturón a cinturón",
    "Ve el foco de entrenamiento de esta semana de tu entrenador",
  ],

  testimonialsTitle: "Los entrenadores que cambiaron, no volvieron atrás",
  testimonials: [
    { stat: "20 años", quote: "Por fin una plataforma construida para cómo los clubes realmente desarrollan atletas — no fitness genérico.", name: "Coach Sami", club: "Klub i København" },
    { stat: "+3 h/semana", quote: "Mis atletas ahora registran las sesiones ellos mismos. Recupero 3 horas cada semana.", name: "Coach Janne", club: "Klub i Malmø" },
    { stat: "Padres implicados", quote: "Solo el informe semanal ya merece la pena. Los padres por fin entienden lo que estamos construyendo.", name: "Coach Michael", club: "Klub i London" },
  ],

  pricingTitle: "Elige tu plan",
  pricingSub: "14 días de prueba en todos los planes · sin compromiso · cancela cuando quieras",
  mostPopular: "Más popular",
  fromLabel: "",
  perMonth: "",
  currency: "",
  tiers: [
    { name: "Atleta", desc: "Para atletas individuales", features: ["Una plaza de atleta", "Entrenamiento y progreso básicos", "1 plan activo", "Seguimiento mental y de recuperación"], cta: "Contactar para precios" },
    { name: "Club", desc: "Para clubs y equipos", features: ["Varias plazas de atleta", "Todos los módulos desbloqueados", "Planes ilimitados", "Creación de planes en grupo", "Vista del equipo"], cta: "Contactar para precios" },
    { name: "Federación", desc: "Para federaciones y grandes organizaciones", features: ["Atletas ilimitados", "Todos los módulos", "Planes ilimitados", "Onboarding incluido", "Soporte prioritario"], cta: "Contactar para precios" },
  ],
  pricingFootnoteLead: "¿Preguntas sobre precios?",
  pricingFootnoteLink: "página de precios",
  pricingFootnoteFedLead: "¿Configuración para federación?",
  pricingFootnoteContact: "Escribe a Farooq@Sportstalent.dk",

  finalCtaTitle: "Tu próximo campeón ya está en tu club.",
  finalCtaDesc: "Dale a cada atleta el entrenamiento que merece — sin agotarte en el intento.",
  finalCtaButton: "Empieza gratis hoy",

  footerCols: [
    { title: "Plataforma", links: [
      { label: "Funciones", href: "#features" },
      { label: "Planes", href: "#pricing" },
      { label: "Metodología", href: "/methodology" },
      { label: "Programas", href: "/programs" },
      { label: "Centro de ayuda", href: "/help" },
    ] },
    { title: "Para entrenadores", links: [
      { label: "Panel del entrenador", href: "/platform/coach-dashboard" },
      { label: "Creador de planes", href: "/platform/plan-builder" },
      { label: "Informes del equipo", href: "/platform/squad-reports" },
      { label: "Gestión de plantilla", href: "/platform/roster" },
      { label: "Reserva una demo", href: "/contact" },
    ] },
    { title: "Para atletas", links: [
      { label: "Diario diario", href: "/platform/diary" },
      { label: "Chequeo de preparación", href: "/platform/readiness" },
      { label: "Seguimiento del progreso", href: "/platform/progress" },
      { label: "Biblioteca de rendimiento", href: "/platform/library" },
      { label: "Plan de nutrición", href: "/kostplan" },
    ] },
    { title: "Empresa", links: [
      { label: "Sobre nosotros", href: "/about" },
      { label: "Contacto", href: "/contact" },
      { label: "Política de privacidad", href: "/privacy" },
      { label: "Iniciar sesión", href: "/auth?tab=signin" },
      { label: "Empezar gratis", href: "/auth?tab=signup" },
    ] },
  ],
  footerCopy: "© 2025 Sportstalent.dk · Hecho para clubes daneses. Creado para desarrollar talento de élite.",
  footerPrivacy: "Privacidad",
  footerContact: "Contacto",
  galleryEyebrow: "ATLETAS REALES · MOMENTOS REALES",
  galleryTitle: "Construido junto al ring, no detrás de un escritorio.",
  gallerySub: "Desde la esquina hasta el tatami — Sportstalent toma forma a partir de los momentos que entrenadores y atletas viven cada fin de semana.",
  storyRows: [
    { eyebrow: "EN LA ESQUINA", title: "Entrena a cada atleta como si fuera el único.", body: "Sportstalent te da el plan estructurado, los datos de preparación y los recordatorios para que la conversación en la esquina sea siempre precisa — no improvisada.", bullets: ["Preparación diaria de cada atleta", "Planes semanales automáticos", "Un toque para registrar la sesión"] },
    { eyebrow: "EN EL TATAMI", title: "Ciencia específica del deporte, no fitness genérico.", body: "Planes pensados para tu deporte: velocidad, potencia, trabajo técnico y recuperación — calibrados según edad, nivel y objetivo.", bullets: ["Programas periodizados de 4 a 12 semanas", "Fases pre, intra y post competición", "Nutrición ajustada a la carga de entrenamiento y objetivos de peso"] },
    { eyebrow: "ANTES DEL COMBATE", title: "Ve quién está listo — y quién no.", body: "Una sola vista del equipo muestra el ánimo, energía, sueño y carga de cada atleta, para que ajustes la sesión antes del calentamiento, no después de la derrota.", bullets: ["Pulso del equipo con semáforo de estado", "Alertas de sobreentrenamiento con dos semanas de antelación", "Notas del entrenador sincronizadas con el atleta"] },
    { eyebrow: "DESPUÉS DEL COMBATE", title: "Convierte cada combate en una lección.", body: "Las reflexiones post-competición, el etiquetado de vídeo y los objetivos SMART aseguran que el siguiente ciclo empiece justo donde acabó el anterior.", bullets: ["Reflexión en 4 pasos tras cada combate", "Etiquetas de vídeo por técnica y resultado", "3 objetivos SMART personalizados por ciclo"] },
  ],

  metaTitle: "Sportstalent — Plataforma de entrenamiento para clubes deportivos daneses",
  metaDesc:
    "Plataforma de entrenamiento creada para clubes deportivos daneses. Gestión del equipo, preparación, planes periódicos e informes semanales — todo en un lugar.",
};

export const COACH_LANDING_STRINGS: Record<Locale, CLStrings> = { en, da, sv, no, de, ar, es };
