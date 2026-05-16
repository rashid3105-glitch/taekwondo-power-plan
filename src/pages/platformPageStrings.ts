import type { Locale } from "@/i18n/translations";

export type PlatformSlug =
  | "coach-dashboard"
  | "plan-builder"
  | "squad-reports"
  | "roster"
  | "diary"
  | "readiness"
  | "progress"
  | "library";

export type PlatformContent = {
  title: string;
  intro: string;
  bullets: [string, string, string, string];
  imageAlt: string;
  metaDesc: string;
};

export type PlatformUI = {
  back: string;
  getStarted: string;
  forCoaches: string;
  forAthletes: string;
  screenshotCaption: string;
  trialNote: string;
  next: string;
  startFree: string;
};

const en: { ui: PlatformUI; content: Record<PlatformSlug, PlatformContent> } = {
  ui: {
    back: "Back",
    getStarted: "Get started",
    forCoaches: "For Coaches",
    forAthletes: "For Athletes",
    screenshotCaption: "Real screenshot from inside Sportstalent.",
    trialNote: "14-day trial · no credit card required",
    next: "Next",
    startFree: "Start free",
  },
  content: {
    "coach-dashboard": {
      title: "Coach Dashboard",
      intro:
        "One screen for your entire club. See every athlete's status — readiness, plan adherence, last activity — at a glance, ranked by who needs you most today.",
      bullets: [
        "Squad pulse: needs attention, injured, no active plan, inactive 7d+",
        "Search and filter by belt, name, or club role",
        "Quick actions: view profile, edit plan, message — without leaving the list",
        "Bulk competition assignment and weekly PDF export",
      ],
      imageAlt: "Coach dashboard with squad pulse and athlete roster",
      metaDesc:
        "See your whole taekwondo club from one screen. Squad pulse, readiness flags, plan status — all in real time.",
    },
    "plan-builder": {
      title: "Plan Builder",
      intro:
        "Build a periodized season around the competitions that matter. Sportstalent automatically structures General Prep → Specific Prep → Peak → Deload around every A-priority event.",
      bullets: [
        "Season planner with auto-periodization",
        "4–12 week training blocks tailored to belt level and age",
        "Drag-and-drop weekly editing across TKD, gym, rest days",
        "Peaks and tapers calculated from competition dates and weight goals",
      ],
      imageAlt: "Season planner with auto-periodization around competitions",
      metaDesc:
        "Build periodized taekwondo plans in minutes. Auto-tapers around competitions, drag-and-drop weekly edits.",
    },
    "squad-reports": {
      title: "Squad Reports",
      intro:
        "Know who's on the mat today before you walk in. Daily attendance, weekly load summaries, and a one-click PDF that's ready for parents, assistant coaches, or federation reviews.",
      bullets: [
        "Today's training: planned session per athlete, mark present/absent",
        "Weekly PDF export for the whole squad",
        "Auto-flag overload, undertrain, and missed readiness check-ins",
        "Athlete-by-athlete summaries with notes you can share",
      ],
      imageAlt: "Today's training attendance view for a coach's squad",
      metaDesc:
        "Daily attendance, weekly squad PDFs, load flags — share with parents, federations, or your assistant coaches.",
    },
    roster: {
      title: "Roster Management",
      intro:
        "Add athletes in seconds, group them by club, and keep belts, weight categories, and contact details in one place. Invite via link or create accounts directly.",
      bullets: [
        "Invite athletes by link or email — no friction",
        "Belt, weight class, and birth date tracked per athlete",
        "Assistant coach roles with managed vs view-only athletes",
        "Pending requests reviewed in one click",
      ],
      imageAlt: "Roster list with belts, clubs, and quick actions",
      metaDesc:
        "Roster management for taekwondo clubs: invite, group by club, manage belts and weight classes.",
    },
    diary: {
      title: "Daily Diary",
      intro:
        "A 60-second log after every session. Athletes write what worked, what didn't, and how it felt — coach can read and respond directly inside the app.",
      bullets: [
        "Filter by training, mental, general, or hashtag",
        "Coach comments appear inline (read-only for the athlete)",
        "Works offline — entries sync when you're back online",
        "Searchable history across months and seasons",
      ],
      imageAlt: "Athlete diary with category filters and tag chips",
      metaDesc:
        "Athlete training diary with offline support, coach comments, and tag-based filtering.",
    },
    readiness: {
      title: "Readiness Check",
      intro:
        "A daily pulse on how the athlete is recovering. Sleep, resting HR, HRV, and steps — entered manually or pulled automatically from Apple Health / Health Connect.",
      bullets: [
        "Auto-syncs from iPhone HealthBridge or Android Health Connect",
        "7-day rolling baselines flag low recovery before injury",
        "Coach sees a recovery sparkline directly in the squad view",
        "Manual entry for athletes without a wearable",
      ],
      imageAlt: "Daily readiness check with sleep, HR, HRV inputs",
      metaDesc:
        "Daily readiness check with sleep, HRV, RHR — auto-synced from Apple Health and Health Connect.",
    },
    progress: {
      title: "Progress Tracking",
      intro:
        "Belt to belt, season to season. Visualise training volume, recovery trends, mental scores, and competition results in one continuous view.",
      bullets: [
        "Today's hub: next event, next session, recovery, readiness",
        "Personalised quote and pinned modules in one place",
        "Form curve, weekly load, and physical test history",
        "Post-competition reflections with SMART goal tracking",
      ],
      imageAlt: "Athlete dashboard with today's training, recovery, and next event",
      metaDesc:
        "Track progress over time: load, recovery, mental scores, competition reflections — for taekwondo athletes.",
    },
    library: {
      title: "Performance Library",
      intro:
        "100+ taekwondo-specific exercises, mental training drills, recipes, physical tests, and HIIT sessions — built by coaches, organised so athletes actually use them.",
      bullets: [
        "TKD exercises with cues and short demo videos",
        "Mental training: focus, visualisation, mental toughness drills",
        "Athlete-friendly recipes and physical test protocols",
        "Live HIIT sessions you can run in the gym",
      ],
      imageAlt: "Performance library: exercises, mental training, nutrition, tests, HIIT",
      metaDesc:
        "Taekwondo performance library: exercises, mental training, nutrition, physical tests, HIIT.",
    },
  },
};

const da: typeof en = {
  ui: {
    back: "Tilbage",
    getStarted: "Kom i gang",
    forCoaches: "Til trænere",
    forAthletes: "Til atleter",
    screenshotCaption: "Rigtigt skærmbillede fra Sportstalent.",
    trialNote: "14-dages prøveperiode · intet kreditkort krævet",
    next: "Næste",
    startFree: "Start gratis",
  },
  content: {
    "coach-dashboard": {
      title: "Træner-dashboard",
      intro:
        "Én skærm til hele din klub. Se hver atlets status — parathed, planoverholdelse, sidste aktivitet — på et øjeblik, sorteret efter hvem der har mest brug for dig i dag.",
      bullets: [
        "Holdpuls: kræver opmærksomhed, skadet, ingen aktiv plan, inaktiv 7+ dage",
        "Søg og filtrér på bælte, navn eller klubrolle",
        "Hurtige handlinger: vis profil, redigér plan, send besked — uden at forlade listen",
        "Tildel stævner i bulk og ugentlig PDF-eksport",
      ],
      imageAlt: "Træner-dashboard med holdpuls og atletliste",
      metaDesc:
        "Se hele din taekwondo-klub fra én skærm. Holdpuls, parathedsflag og planstatus i realtid.",
    },
    "plan-builder": {
      title: "Træningsplan",
      intro:
        "Byg en periodiseret sæson omkring de stævner, der betæller. Sportstalent strukturerer automatisk Generel Forberedelse → Specifik Forberedelse → Peak → Deload omkring hvert A-prioritets-stævne.",
      bullets: [
        "Sæsonplanlægger med automatisk periodisering",
        "4–12 ugers træningsblokke tilpasset bælteniveau og alder",
        "Drag-and-drop ugeredigering på tværs af TKD, gym og hviledage",
        "Peaks og taper beregnet ud fra stævnedatoer og vægtmål",
      ],
      imageAlt: "Sæsonplanlægger med automatisk periodisering omkring stævner",
      metaDesc:
        "Byg periodiserede taekwondo-planer på minutter. Auto-taper omkring stævner og drag-and-drop ugeredigering.",
    },
    "squad-reports": {
      title: "Holdrapporter",
      intro:
        "Vid hvem der står på måtten i dag, før du går ind. Daglig fremmøde, ugentlige belastningsoversigter og en PDF med ét klik klar til forældre, assistenttrænere eller forbund.",
      bullets: [
        "Dagens træning: planlagt session pr. atlet, markér tilstede/fraværende",
        "Ugentlig PDF-eksport for hele holdet",
        "Auto-flag for overbelastning, undertræning og manglende parathedscheck",
        "Atlet-for-atlet oversigter med noter, du kan dele",
      ],
      imageAlt: "Dagens fremmøde for trænerens hold",
      metaDesc:
        "Daglig fremmøde, ugentlige hold-PDF'er, belastningsflag — del med forældre, forbund eller assistenttrænere.",
    },
    roster: {
      title: "Atletliste",
      intro:
        "Tilføj atleter på sekunder, gruppér dem efter klub, og hold styr på bælter, vægtklasser og kontaktinfo ét sted. Invitér via link eller opret konti direkte.",
      bullets: [
        "Invitér atleter via link eller e-mail — uden friktion",
        "Bælte, vægtklasse og fødselsdato pr. atlet",
        "Assistenttræner-roller med fuld eller læseadgang",
        "Afventende anmodninger gennemgås med ét klik",
      ],
      imageAlt: "Atletliste med bælter, klubber og hurtige handlinger",
      metaDesc:
        "Atletadministration for taekwondo-klubber: invitér, gruppér efter klub, styr bælter og vægtklasser.",
    },
    diary: {
      title: "Dagbog",
      intro:
        "60 sekunders log efter hver session. Atleter skriver hvad der virkede, hvad der ikke gjorde, og hvordan det føltes — træneren kan læse og svare direkte i appen.",
      bullets: [
        "Filtrér efter træning, mental, generelt eller hashtag",
        "Trænerkommentarer vises inline (skrivebeskyttet for atleten)",
        "Virker offline — opslag synkroniseres når du er online igen",
        "Søgbar historik på tværs af måneder og sæsoner",
      ],
      imageAlt: "Atletdagbog med kategorifiltre og tag-chips",
      metaDesc:
        "Atlet-træningsdagbog med offline-understøttelse, trænerkommentarer og tag-baseret filtrering.",
    },
    readiness: {
      title: "Parathed",
      intro:
        "Daglig puls på hvordan atleten restituerer. Søvn, hvilepuls, HRV og skridt — manuelt indtastet eller automatisk hentet fra Apple Health / Health Connect.",
      bullets: [
        "Auto-synk fra iPhone HealthBridge eller Android Health Connect",
        "7-dages rullende baseline flagger lav restitution før skader",
        "Træneren ser en restitutions-sparkline direkte i holdvisningen",
        "Manuel indtastning for atleter uden wearable",
      ],
      imageAlt: "Dagligt parathedscheck med søvn, puls og HRV",
      metaDesc:
        "Dagligt parathedscheck med søvn, HRV og hvilepuls — auto-synk fra Apple Health og Health Connect.",
    },
    progress: {
      title: "Fremgang",
      intro:
        "Bælte for bælte, sæson for sæson. Visualisér træningsvolumen, restitutionstrends, mentale scores og stævneresultater i én sammenhængende visning.",
      bullets: [
        "Dagens hub: næste stævne, næste session, restitution, parathed",
        "Personligt citat og fastgjorte moduler ét sted",
        "Formkurve, ugentlig belastning og fysisk testhistorik",
        "Refleksion efter stævne med SMART-målopfølgning",
      ],
      imageAlt: "Atlet-dashboard med dagens træning, restitution og næste stævne",
      metaDesc:
        "Følg fremgang over tid: belastning, restitution, mentale scores og stævnerefleksioner — for taekwondo-atleter.",
    },
    library: {
      title: "Bibliotek",
      intro:
        "100+ taekwondo-specifikke øvelser, mentale træningsdrills, opskrifter, fysiske tests og HIIT-sessioner — bygget af trænere og organiseret så atleter rent faktisk bruger det.",
      bullets: [
        "TKD-øvelser med cues og korte demo-videoer",
        "Mental træning: fokus, visualisering, mental styrke",
        "Atlet-venlige opskrifter og fysiske testprotokoller",
        "Live HIIT-sessioner du kan køre i gymmet",
      ],
      imageAlt: "Performance-bibliotek: øvelser, mental træning, kost, tests, HIIT",
      metaDesc:
        "Taekwondo performance-bibliotek: øvelser, mental træning, kost, fysiske tests, HIIT.",
    },
  },
};

const sv: typeof en = {
  ui: {
    back: "Tillbaka",
    getStarted: "Kom igång",
    forCoaches: "För tränare",
    forAthletes: "För atleter",
    screenshotCaption: "Riktig skärmbild från Sportstalent.",
    trialNote: "14-dagars provperiod · inget kreditkort krävs",
    next: "Nästa",
    startFree: "Börja gratis",
  },
  content: {
    "coach-dashboard": {
      title: "Tränar-dashboard",
      intro:
        "En skärm för hela din klubb. Se varje atlets status — beredskap, planföljsamhet, senaste aktivitet — i ett ögonkast, sorterat efter vem som behöver dig mest idag.",
      bullets: [
        "Lagpuls: behöver uppmärksamhet, skadad, ingen aktiv plan, inaktiv 7+ dagar",
        "Sök och filtrera på bälte, namn eller klubbroll",
        "Snabbåtgärder: visa profil, redigera plan, meddelande — utan att lämna listan",
        "Tilldela tävlingar i bulk och veckovis PDF-export",
      ],
      imageAlt: "Tränar-dashboard med lagpuls och atletlista",
      metaDesc:
        "Se hela din taekwondo-klubb från en skärm. Lagpuls, beredskapsflaggor och planstatus i realtid.",
    },
    "plan-builder": {
      title: "Planbyggare",
      intro:
        "Bygg en periodiserad säsong runt tävlingarna som räknas. Sportstalent strukturerar automatiskt Allmän Förberedelse → Specifik Förberedelse → Peak → Deload runt varje A-prioritetstävling.",
      bullets: [
        "Säsongsplanerare med automatisk periodisering",
        "4–12 veckors träningsblock anpassade till bältesnivå och ålder",
        "Drag-and-drop veckoredigering över TKD, gym och vilodagar",
        "Peaks och taper beräknade från tävlingsdatum och viktmål",
      ],
      imageAlt: "Säsongsplanerare med automatisk periodisering runt tävlingar",
      metaDesc:
        "Bygg periodiserade taekwondo-planer på minuter. Auto-taper runt tävlingar, drag-and-drop veckoredigering.",
    },
    "squad-reports": {
      title: "Lagrapporter",
      intro:
        "Vet vem som står på mattan idag innan du går in. Daglig närvaro, veckovisa belastningssammanställningar och en PDF med ett klick redo för föräldrar, hjälptränare eller förbund.",
      bullets: [
        "Dagens träning: planerad session per atlet, markera närvarande/frånvarande",
        "Veckovis PDF-export för hela laget",
        "Auto-flagga överbelastning, underträning och missade beredskapscheck",
        "Atlet-för-atlet sammanfattningar med noter du kan dela",
      ],
      imageAlt: "Dagens närvaro för tränarens lag",
      metaDesc:
        "Daglig närvaro, veckovisa lag-PDF:er, belastningsflaggor — dela med föräldrar, förbund eller hjälptränare.",
    },
    roster: {
      title: "Atletlista",
      intro:
        "Lägg till atleter på sekunder, gruppera dem efter klubb, och håll bälten, viktklasser och kontaktinfo på ett ställe. Bjud in via länk eller skapa konton direkt.",
      bullets: [
        "Bjud in atleter via länk eller e-post — utan friktion",
        "Bälte, viktklass och födelsedatum per atlet",
        "Hjälptränar-roller med full eller läsbehörighet",
        "Väntande förfrågningar granskas med ett klick",
      ],
      imageAlt: "Atletlista med bälten, klubbar och snabbåtgärder",
      metaDesc:
        "Atlethantering för taekwondo-klubbar: bjud in, gruppera efter klubb, hantera bälten och viktklasser.",
    },
    diary: {
      title: "Dagbok",
      intro:
        "En 60-sekunders logg efter varje pass. Atleter skriver vad som fungerade, vad som inte gjorde det och hur det kändes — tränaren kan läsa och svara direkt i appen.",
      bullets: [
        "Filtrera efter träning, mental, allmänt eller hashtag",
        "Tränarkommentarer visas inline (skrivskyddat för atleten)",
        "Fungerar offline — inlägg synkar när du är online igen",
        "Sökbar historik över månader och säsonger",
      ],
      imageAlt: "Atletdagbok med kategorifilter och taggchips",
      metaDesc:
        "Atlet-träningsdagbok med offlinestöd, tränarkommentarer och tag-baserad filtrering.",
    },
    readiness: {
      title: "Beredskap",
      intro:
        "En daglig puls på hur atleten återhämtar sig. Sömn, vilopuls, HRV och steg — manuellt eller auto-hämtat från Apple Health / Health Connect.",
      bullets: [
        "Auto-synk från iPhone HealthBridge eller Android Health Connect",
        "7-dagars rullande baslinje flaggar låg återhämtning före skada",
        "Tränaren ser en återhämtnings-sparkline direkt i lagvyn",
        "Manuell inmatning för atleter utan wearable",
      ],
      imageAlt: "Daglig beredskapscheck med sömn, puls och HRV",
      metaDesc:
        "Daglig beredskapscheck med sömn, HRV och vilopuls — auto-synk från Apple Health och Health Connect.",
    },
    progress: {
      title: "Framsteg",
      intro:
        "Bälte för bälte, säsong för säsong. Visualisera träningsvolym, återhämtningstrender, mentala poäng och tävlingsresultat i en sammanhängande vy.",
      bullets: [
        "Dagens hub: nästa tävling, nästa pass, återhämtning, beredskap",
        "Personligt citat och fästa moduler på ett ställe",
        "Formkurva, veckovis belastning och fysisk testhistorik",
        "Eftertävlingsreflektioner med SMART-målspårning",
      ],
      imageAlt: "Atlet-dashboard med dagens träning, återhämtning och nästa tävling",
      metaDesc:
        "Följ framsteg över tid: belastning, återhämtning, mentala poäng, tävlingsreflektioner — för taekwondo-atleter.",
    },
    library: {
      title: "Bibliotek",
      intro:
        "100+ taekwondo-specifika övningar, mentala träningsdrills, recept, fysiska tester och HIIT-pass — byggda av tränare och organiserade så att atleter faktiskt använder dem.",
      bullets: [
        "TKD-övningar med cues och korta demovideor",
        "Mental träning: fokus, visualisering, mental styrka",
        "Atlet-vänliga recept och fysiska testprotokoll",
        "Live HIIT-pass du kan köra i gymmet",
      ],
      imageAlt: "Performance-bibliotek: övningar, mental träning, kost, tester, HIIT",
      metaDesc:
        "Taekwondo performance-bibliotek: övningar, mental träning, kost, fysiska tester, HIIT.",
    },
  },
};

const de: typeof en = {
  ui: {
    back: "Zurück",
    getStarted: "Loslegen",
    forCoaches: "Für Trainer",
    forAthletes: "Für Athleten",
    screenshotCaption: "Echter Screenshot aus Sportstalent.",
    trialNote: "14-Tage-Testphase · keine Kreditkarte erforderlich",
    next: "Weiter",
    startFree: "Kostenlos starten",
  },
  content: {
    "coach-dashboard": {
      title: "Trainer-Dashboard",
      intro:
        "Ein Bildschirm für deinen ganzen Verein. Sieh den Status jedes Athleten — Bereitschaft, Plantreue, letzte Aktivität — auf einen Blick, sortiert nach wem du heute am meisten gebraucht wirst.",
      bullets: [
        "Team-Puls: braucht Aufmerksamkeit, verletzt, kein aktiver Plan, 7+ Tage inaktiv",
        "Suche und filtere nach Gurt, Name oder Vereinsrolle",
        "Schnellaktionen: Profil, Plan bearbeiten, Nachricht — ohne die Liste zu verlassen",
        "Bulk-Wettkampfzuweisung und wöchentlicher PDF-Export",
      ],
      imageAlt: "Trainer-Dashboard mit Team-Puls und Athletenliste",
      metaDesc:
        "Sieh deinen ganzen Taekwondo-Verein auf einem Bildschirm. Team-Puls, Bereitschaftsflags, Planstatus — in Echtzeit.",
    },
    "plan-builder": {
      title: "Planer",
      intro:
        "Baue eine periodisierte Saison rund um die Wettkämpfe, die zählen. Sportstalent strukturiert automatisch Allgemein → Spezifisch → Peak → Deload um jeden A-Wettkampf.",
      bullets: [
        "Saisonplaner mit automatischer Periodisierung",
        "4–12 Wochen Trainingsblöcke nach Gurt und Alter",
        "Drag-and-Drop Wochenbearbeitung über TKD, Gym und Ruhetage",
        "Peaks und Taper aus Wettkampfdaten und Gewichtszielen berechnet",
      ],
      imageAlt: "Saisonplaner mit automatischer Periodisierung um Wettkämpfe",
      metaDesc:
        "Periodisierte Taekwondo-Pläne in Minuten. Auto-Taper um Wettkämpfe, Drag-and-Drop Wochenbearbeitung.",
    },
    "squad-reports": {
      title: "Team-Berichte",
      intro:
        "Wisse vor dem Training, wer heute auf der Matte steht. Tägliche Anwesenheit, wöchentliche Belastungsübersichten und eine PDF mit einem Klick — bereit für Eltern, Co-Trainer oder Verbände.",
      bullets: [
        "Heutiges Training: geplante Einheit pro Athlet, anwesend/abwesend markieren",
        "Wöchentlicher PDF-Export für das gesamte Team",
        "Auto-Flag bei Überlastung, Untertraining und fehlenden Bereitschaftschecks",
        "Athleten-Zusammenfassungen mit teilbaren Notizen",
      ],
      imageAlt: "Heutige Anwesenheitsansicht für das Trainerteam",
      metaDesc:
        "Tägliche Anwesenheit, wöchentliche Team-PDFs, Belastungsflags — teilen mit Eltern, Verbänden oder Co-Trainern.",
    },
    roster: {
      title: "Kaderverwaltung",
      intro:
        "Athleten in Sekunden hinzufügen, nach Verein gruppieren und Gurte, Gewichtsklassen und Kontaktdaten an einem Ort halten. Per Link einladen oder direkt anlegen.",
      bullets: [
        "Athleten per Link oder E-Mail einladen — reibungslos",
        "Gurt, Gewichtsklasse und Geburtsdatum pro Athlet",
        "Co-Trainer-Rollen mit Voll- oder Lesezugriff",
        "Anfragen mit einem Klick prüfen",
      ],
      imageAlt: "Kaderliste mit Gurten, Vereinen und Schnellaktionen",
      metaDesc:
        "Kaderverwaltung für Taekwondo-Vereine: einladen, nach Verein gruppieren, Gurte und Gewichtsklassen verwalten.",
    },
    diary: {
      title: "Tagebuch",
      intro:
        "Ein 60-Sekunden-Log nach jeder Einheit. Athleten schreiben was funktioniert hat, was nicht und wie es sich anfühlte — der Trainer kann direkt in der App lesen und antworten.",
      bullets: [
        "Filter nach Training, Mental, Allgemein oder Hashtag",
        "Trainerkommentare erscheinen inline (für den Athleten schreibgeschützt)",
        "Funktioniert offline — Einträge synchronisieren bei Verbindung",
        "Durchsuchbare Historie über Monate und Saisons",
      ],
      imageAlt: "Athleten-Tagebuch mit Kategoriefiltern und Tag-Chips",
      metaDesc:
        "Athleten-Trainingstagebuch mit Offline-Support, Trainerkommentaren und Tag-Filtern.",
    },
    readiness: {
      title: "Bereitschaft",
      intro:
        "Täglicher Puls zur Erholung des Athleten. Schlaf, Ruhepuls, HRV und Schritte — manuell oder automatisch aus Apple Health / Health Connect.",
      bullets: [
        "Auto-Sync von iPhone HealthBridge oder Android Health Connect",
        "7-Tage-Baseline flaggt geringe Erholung vor Verletzungen",
        "Trainer sieht Erholungs-Sparkline direkt in der Teamansicht",
        "Manuelle Eingabe für Athleten ohne Wearable",
      ],
      imageAlt: "Täglicher Bereitschaftscheck mit Schlaf, Puls und HRV",
      metaDesc:
        "Täglicher Bereitschaftscheck mit Schlaf, HRV und Ruhepuls — Auto-Sync mit Apple Health und Health Connect.",
    },
    progress: {
      title: "Fortschritt",
      intro:
        "Gurt für Gurt, Saison für Saison. Visualisiere Trainingsvolumen, Erholungstrends, mentale Werte und Wettkampfergebnisse in einer durchgehenden Ansicht.",
      bullets: [
        "Heute-Hub: nächster Wettkampf, nächste Einheit, Erholung, Bereitschaft",
        "Persönliches Zitat und angeheftete Module an einem Ort",
        "Form-Kurve, Wochenbelastung und Testhistorie",
        "Wettkampf-Reflexionen mit SMART-Zielen",
      ],
      imageAlt: "Athleten-Dashboard mit heutigem Training, Erholung und nächstem Wettkampf",
      metaDesc:
        "Fortschritt über Zeit verfolgen: Belastung, Erholung, mentale Werte, Wettkampfreflexionen — für Taekwondo-Athleten.",
    },
    library: {
      title: "Bibliothek",
      intro:
        "100+ Taekwondo-spezifische Übungen, mentale Drills, Rezepte, Fitnesstests und HIIT-Einheiten — von Trainern gebaut, so organisiert dass Athleten sie wirklich nutzen.",
      bullets: [
        "TKD-Übungen mit Cues und kurzen Demo-Videos",
        "Mentaltraining: Fokus, Visualisierung, mentale Stärke",
        "Athletenfreundliche Rezepte und Testprotokolle",
        "Live HIIT-Einheiten für das Gym",
      ],
      imageAlt: "Performance-Bibliothek: Übungen, Mentaltraining, Ernährung, Tests, HIIT",
      metaDesc:
        "Taekwondo-Performance-Bibliothek: Übungen, Mentaltraining, Ernährung, Tests, HIIT.",
    },
  },
};

const ar: typeof en = {
  ui: {
    back: "رجوع",
    getStarted: "ابدأ الآن",
    forCoaches: "للمدربين",
    forAthletes: "للرياضيين",
    screenshotCaption: "لقطة شاشة حقيقية من داخل Sportstalent.",
    trialNote: "تجربة 14 يومًا · بدون بطاقة ائتمان",
    next: "التالي",
    startFree: "ابدأ مجانًا",
  },
  content: {
    "coach-dashboard": {
      title: "لوحة المدرب",
      intro:
        "شاشة واحدة لناديك بأكمله. شاهد حالة كل رياضي — الجاهزية والالتزام بالخطة وآخر نشاط — في لمحة، مرتبة حسب من يحتاجك أكثر اليوم.",
      bullets: [
        "نبض الفريق: يحتاج اهتمامًا، مصاب، بدون خطة نشطة، غير نشط 7+ أيام",
        "البحث والتصفية حسب الحزام أو الاسم أو الدور",
        "إجراءات سريعة: عرض الملف، تعديل الخطة، رسالة — دون مغادرة القائمة",
        "تعيين البطولات بالجملة وتصدير PDF أسبوعي",
      ],
      imageAlt: "لوحة المدرب مع نبض الفريق وقائمة الرياضيين",
      metaDesc:
        "شاهد ناديك للتايكوندو بأكمله من شاشة واحدة. نبض الفريق وعلامات الجاهزية وحالة الخطة في الوقت الفعلي.",
    },
    "plan-builder": {
      title: "منشئ الخطة",
      intro:
        "ابنِ موسمًا مقسّمًا حول البطولات المهمة. ينظم Sportstalent تلقائيًا الإعداد العام → الإعداد الخاص → الذروة → التخفيف حول كل بطولة من الفئة A.",
      bullets: [
        "مخطط الموسم مع تقسيم تلقائي",
        "كتل تدريب 4–12 أسبوعًا مخصصة حسب الحزام والعمر",
        "تحرير أسبوعي بالسحب والإفلات عبر تايكوندو، صالة، راحة",
        "ذروات وتخفيف محسوبة من تواريخ البطولات وأهداف الوزن",
      ],
      imageAlt: "مخطط الموسم مع التقسيم التلقائي حول البطولات",
      metaDesc:
        "ابنِ خطط تايكوندو مقسّمة في دقائق. تخفيف تلقائي حول البطولات وتحرير بالسحب والإفلات.",
    },
    "squad-reports": {
      title: "تقارير الفريق",
      intro:
        "اعرف من على البساط اليوم قبل أن تدخل. الحضور اليومي وملخصات الحمل الأسبوعية وPDF بنقرة واحدة جاهز للأهالي والمدربين المساعدين والاتحادات.",
      bullets: [
        "تدريب اليوم: جلسة مخططة لكل رياضي، حدد حاضر/غائب",
        "تصدير PDF أسبوعي لكامل الفريق",
        "تنبيه تلقائي للحمل الزائد ونقص التدريب وفقدان فحوصات الجاهزية",
        "ملخصات لكل رياضي مع ملاحظات قابلة للمشاركة",
      ],
      imageAlt: "عرض حضور تدريب اليوم لفريق المدرب",
      metaDesc:
        "حضور يومي وPDF أسبوعي للفريق وعلامات حمل — شاركها مع الأهالي والاتحادات والمدربين المساعدين.",
    },
    roster: {
      title: "إدارة القائمة",
      intro:
        "أضف رياضيين في ثوانٍ، وجمّعهم حسب النادي، واحتفظ بالأحزمة وفئات الوزن وبيانات الاتصال في مكان واحد. ادعُ عبر رابط أو أنشئ حسابات مباشرة.",
      bullets: [
        "ادعُ الرياضيين برابط أو بريد — دون احتكاك",
        "الحزام وفئة الوزن وتاريخ الميلاد لكل رياضي",
        "أدوار المدرب المساعد بصلاحيات كاملة أو قراءة فقط",
        "مراجعة الطلبات المعلقة بنقرة واحدة",
      ],
      imageAlt: "قائمة الرياضيين مع الأحزمة والأندية والإجراءات السريعة",
      metaDesc:
        "إدارة قائمة لأندية التايكوندو: دعوة، تجميع حسب النادي، إدارة الأحزمة وفئات الوزن.",
    },
    diary: {
      title: "اليوميات",
      intro:
        "سجل من 60 ثانية بعد كل جلسة. يكتب الرياضيون ما نجح وما لم ينجح وكيف شعروا — يستطيع المدرب القراءة والرد مباشرة داخل التطبيق.",
      bullets: [
        "التصفية حسب التدريب أو الذهني أو العام أو الوسم",
        "تظهر تعليقات المدرب داخل السطر (للقراءة فقط للرياضي)",
        "يعمل دون اتصال — تتم مزامنة الإدخالات عند العودة",
        "سجل قابل للبحث عبر الأشهر والمواسم",
      ],
      imageAlt: "يوميات الرياضي مع تصفية الفئات ووسوم",
      metaDesc:
        "يوميات تدريب الرياضي مع دعم وضع عدم الاتصال وتعليقات المدرب وتصفية بالوسوم.",
    },
    readiness: {
      title: "الجاهزية",
      intro:
        "نبض يومي لكيفية تعافي الرياضي. النوم ومعدل ضربات القلب وHRV والخطوات — يدويًا أو تلقائيًا من Apple Health / Health Connect.",
      bullets: [
        "مزامنة تلقائية من iPhone HealthBridge أو Android Health Connect",
        "خط أساس متحرك لـ 7 أيام يضع علامة على التعافي المنخفض قبل الإصابة",
        "يرى المدرب خطًا بيانيًا للتعافي مباشرة في عرض الفريق",
        "إدخال يدوي للرياضيين بدون جهاز قابل للارتداء",
      ],
      imageAlt: "فحص الجاهزية اليومي مع النوم والنبض وHRV",
      metaDesc:
        "فحص جاهزية يومي مع النوم وHRV ومعدل ضربات القلب — مزامنة تلقائية مع Apple Health وHealth Connect.",
    },
    progress: {
      title: "التقدم",
      intro:
        "حزامًا حزامًا، موسمًا موسمًا. تصور حجم التدريب واتجاهات التعافي والنتائج الذهنية ونتائج البطولات في عرض واحد متواصل.",
      bullets: [
        "محور اليوم: الحدث القادم، الجلسة القادمة، التعافي، الجاهزية",
        "اقتباس شخصي ووحدات مثبتة في مكان واحد",
        "منحنى الفورم والحمل الأسبوعي وتاريخ الاختبارات البدنية",
        "تأملات بعد البطولة مع تتبع أهداف SMART",
      ],
      imageAlt: "لوحة الرياضي مع تدريب اليوم والتعافي والحدث القادم",
      metaDesc:
        "تابع التقدم عبر الزمن: الحمل والتعافي والنتائج الذهنية وتأملات البطولات — لرياضيي التايكوندو.",
    },
    library: {
      title: "المكتبة",
      intro:
        "100+ تمرين متخصص للتايكوندو وتدريبات ذهنية ووصفات واختبارات بدنية وجلسات HIIT — صنعها مدربون ومنظمة ليستخدمها الرياضيون فعلًا.",
      bullets: [
        "تمارين تايكوندو مع إرشادات وفيديوهات قصيرة",
        "تدريب ذهني: تركيز، تصور، صلابة ذهنية",
        "وصفات صديقة للرياضيين وبروتوكولات اختبار بدني",
        "جلسات HIIT حية لتشغيلها في الصالة",
      ],
      imageAlt: "مكتبة الأداء: تمارين، تدريب ذهني، تغذية، اختبارات، HIIT",
      metaDesc:
        "مكتبة أداء التايكوندو: تمارين، تدريب ذهني، تغذية، اختبارات بدنية، HIIT.",
    },
  },
};

const no: typeof en = {
  ui: {
    back: "Tilbake",
    getStarted: "Kom i gang",
    forCoaches: "For trenere",
    forAthletes: "For utøvere",
    screenshotCaption: "Ekte skjermbilde fra Sportstalent.",
    trialNote: "14-dagers prøveperiode · ingen kredittkort kreves",
    next: "Neste",
    startFree: "Start gratis",
  },
  content: {
    "coach-dashboard": {
      title: "Trener-dashboard",
      intro:
        "Én skjerm for hele klubben. Se hver utøvers status — beredskap, planoppfølging, siste aktivitet — på et øyeblikk, sortert etter hvem som trenger deg mest i dag.",
      bullets: [
        "Lagpuls: trenger oppmerksomhet, skadet, ingen aktiv plan, inaktiv 7+ dager",
        "Søk og filtrer på belte, navn eller klubbrolle",
        "Hurtighandlinger: vis profil, rediger plan, melding — uten å forlate listen",
        "Bulk-konkurransetildeling og ukentlig PDF-eksport",
      ],
      imageAlt: "Trener-dashboard med lagpuls og utøverliste",
      metaDesc:
        "Se hele taekwondo-klubben fra én skjerm. Lagpuls, beredskapsflagg og planstatus i sanntid.",
    },
    "plan-builder": {
      title: "Planbygger",
      intro:
        "Bygg en periodisert sesong rundt konkurransene som teller. Sportstalent strukturerer automatisk Generell → Spesifikk → Peak → Deload rundt hver A-konkurranse.",
      bullets: [
        "Sesongplanlegger med automatisk periodisering",
        "4–12 ukers treningsblokker tilpasset belte og alder",
        "Drag-and-drop ukeredigering på tvers av TKD, gym og hviledager",
        "Peaks og taper beregnet fra konkurransedatoer og vektmål",
      ],
      imageAlt: "Sesongplanlegger med automatisk periodisering rundt konkurranser",
      metaDesc:
        "Bygg periodiserte taekwondo-planer på minutter. Auto-taper rundt konkurranser, drag-and-drop ukeredigering.",
    },
    "squad-reports": {
      title: "Lagrapporter",
      intro:
        "Vit hvem som er på matta i dag før du går inn. Daglig oppmøte, ukentlige belastningsoversikter og en PDF med ett klikk klar for foreldre, hjelpetrenere eller forbund.",
      bullets: [
        "Dagens trening: planlagt økt per utøver, marker tilstede/fraværende",
        "Ukentlig PDF-eksport for hele laget",
        "Auto-flagg overbelastning, undertrening og manglende beredskapssjekker",
        "Utøver-for-utøver oppsummeringer med delbare notater",
      ],
      imageAlt: "Dagens oppmøte for trenerens lag",
      metaDesc:
        "Daglig oppmøte, ukentlige lag-PDF-er, belastningsflagg — del med foreldre, forbund eller hjelpetrenere.",
    },
    roster: {
      title: "Utøverliste",
      intro:
        "Legg til utøvere på sekunder, grupper dem etter klubb, og hold belter, vektklasser og kontaktinfo på ett sted. Inviter via lenke eller opprett kontoer direkte.",
      bullets: [
        "Inviter utøvere via lenke eller e-post — uten friksjon",
        "Belte, vektklasse og fødselsdato per utøver",
        "Hjelpetrener-roller med full eller lesetilgang",
        "Ventende forespørsler vurderes med ett klikk",
      ],
      imageAlt: "Utøverliste med belter, klubber og hurtighandlinger",
      metaDesc:
        "Utøverhåndtering for taekwondo-klubber: inviter, grupper etter klubb, håndter belter og vektklasser.",
    },
    diary: {
      title: "Dagbok",
      intro:
        "En 60-sekunders logg etter hver økt. Utøvere skriver hva som virket, hva som ikke gjorde det og hvordan det føltes — treneren kan lese og svare direkte i appen.",
      bullets: [
        "Filtrer etter trening, mental, generelt eller hashtag",
        "Trenerkommentarer vises inline (skrivebeskyttet for utøveren)",
        "Virker offline — innlegg synkroniseres når du er online igjen",
        "Søkbar historikk på tvers av måneder og sesonger",
      ],
      imageAlt: "Utøverdagbok med kategorifiltre og tag-chips",
      metaDesc:
        "Utøvertreningsdagbok med offline-støtte, trenerkommentarer og tag-basert filtrering.",
    },
    readiness: {
      title: "Beredskap",
      intro:
        "Daglig puls på hvordan utøveren restituerer. Søvn, hvilepuls, HRV og skritt — manuelt eller auto-hentet fra Apple Health / Health Connect.",
      bullets: [
        "Auto-synk fra iPhone HealthBridge eller Android Health Connect",
        "7-dagers rullende baseline flagger lav restitusjon før skade",
        "Treneren ser en restitusjons-sparkline direkte i lagvisningen",
        "Manuell registrering for utøvere uten wearable",
      ],
      imageAlt: "Daglig beredskapssjekk med søvn, puls og HRV",
      metaDesc:
        "Daglig beredskapssjekk med søvn, HRV og hvilepuls — auto-synk fra Apple Health og Health Connect.",
    },
    progress: {
      title: "Fremgang",
      intro:
        "Belte for belte, sesong for sesong. Visualiser treningsvolum, restitusjonstrender, mentale skårer og konkurranseresultater i én sammenhengende visning.",
      bullets: [
        "Dagens hub: neste konkurranse, neste økt, restitusjon, beredskap",
        "Personlig sitat og festede moduler på ett sted",
        "Formkurve, ukentlig belastning og fysisk testhistorikk",
        "Etterkonkurranse-refleksjoner med SMART-målsporing",
      ],
      imageAlt: "Utøver-dashboard med dagens trening, restitusjon og neste konkurranse",
      metaDesc:
        "Følg fremgang over tid: belastning, restitusjon, mentale skårer, konkurranserefleksjoner — for taekwondo-utøvere.",
    },
    library: {
      title: "Bibliotek",
      intro:
        "100+ taekwondo-spesifikke øvelser, mentale treningsdrills, oppskrifter, fysiske tester og HIIT-økter — bygget av trenere og organisert så utøvere faktisk bruker dem.",
      bullets: [
        "TKD-øvelser med cues og korte demovideoer",
        "Mental trening: fokus, visualisering, mental styrke",
        "Utøvervennlige oppskrifter og fysiske testprotokoller",
        "Live HIIT-økter du kan kjøre på gymmet",
      ],
      imageAlt: "Performance-bibliotek: øvelser, mental trening, kost, tester, HIIT",
      metaDesc:
        "Taekwondo performance-bibliotek: øvelser, mental trening, kost, fysiske tester, HIIT.",
    },
  },
};

export const platformStrings: Record<Locale, typeof en> = {
  en,
  da,
  sv,
  de,
  ar,
  no,
  es: en,
};
