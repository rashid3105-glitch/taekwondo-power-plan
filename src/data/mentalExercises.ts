import type { Locale } from "@/i18n/translations";

export type MentalCategory = "focus" | "visualization" | "breathing" | "confidence" | "recovery" | "toughness";

export type MentalDifficulty = "beginner" | "intermediate" | "advanced";

export interface MentalExercise {
  id: string;
  name: string;
  category: MentalCategory;
  duration: string;
  difficulty: MentalDifficulty;
  description: string;
  steps: string[];
  whyItMatters: string;
}

export const MENTAL_CATEGORY_LABELS: Record<Locale, Record<MentalCategory, string>> = {
  en: {
    focus: "Focus",
    visualization: "Visualization",
    breathing: "Breathing",
    confidence: "Confidence",
    recovery: "Recovery",
    toughness: "Toughness",
  },
  da: {
    focus: "Fokus",
    visualization: "Visualisering",
    breathing: "Vejrtrækning",
    confidence: "Selvtillid",
    recovery: "Restitution",
    toughness: "Mental styrke",
  },
  sv: {
    focus: "Fokus",
    visualization: "Visualisering",
    breathing: "Andning",
    confidence: "Självförtroende",
    recovery: "Återhämtning",
    toughness: "Mental styrka",
  },
  de: {
    focus: "Fokus",
    visualization: "Visualisierung",
    breathing: "Atmung",
    confidence: "Selbstvertrauen",
    recovery: "Erholung",
    toughness: "Mentale Stärke",
  },
  ar: {
    focus: "تركيز",
    visualization: "تصوّر ذهني",
    breathing: "تنفّس",
    confidence: "ثقة بالنفس",
    recovery: "استشفاء",
    toughness: "صلابة ذهنية",
  },
  no: {
    focus: "Fokus",
    visualization: "Visualisering",
    breathing: "Pusting",
    confidence: "Selvtillit",
    recovery: "Restitusjon",
    toughness: "Mental styrke",
  },
};

export const MENTAL_CATEGORY_ICONS: Record<MentalCategory, string> = {
  focus: "🎯",
  visualization: "👁️",
  breathing: "🌬️",
  confidence: "💪",
  recovery: "🧘",
  toughness: "🔥",
};

export const MENTAL_DIFFICULTY_LABELS: Record<Locale, Record<MentalDifficulty, string>> = {
  en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
  da: { beginner: "Begynder", intermediate: "Mellem", advanced: "Avanceret" },
  sv: { beginner: "Nybörjare", intermediate: "Medel", advanced: "Avancerad" },
  de: { beginner: "Anfänger", intermediate: "Fortgeschritten", advanced: "Profi" },
  ar: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
  no: { beginner: "Nybegynner", intermediate: "Middels", advanced: "Avansert" },
};

interface MentalExerciseData {
  id: string;
  category: MentalCategory;
  difficulty: MentalDifficulty;
  en: { name: string; duration: string; description: string; steps: string[]; whyItMatters: string };
  da: { name: string; duration: string; description: string; steps: string[]; whyItMatters: string };
}

const mentalExercisesData: MentalExerciseData[] = [
  {
    id: "m1", category: "visualization", difficulty: "intermediate",
    en: {
      name: "Competition Visualization", duration: "10-15 min",
      description: "Mentally rehearse an entire competition match from warm-up to victory. See, hear, and feel every detail of your performance.",
      steps: ["Find a quiet place and close your eyes.", "Visualize yourself arriving at the venue — feel the energy of the crowd.", "See yourself warming up confidently, body loose and ready.", "Imagine your first match: hear the referee, feel the mat under your feet.", "Execute your best techniques with perfect timing and power.", "Visualize overcoming a tough moment — staying calm and adapting.", "See yourself winning the final point and celebrating."],
      whyItMatters: "Mental rehearsal activates the same neural pathways as physical practice, building confidence and muscle memory without physical fatigue.",
    },
    da: {
      name: "Konkurrencevisualisering", duration: "10-15 min",
      description: "Gennemgå mentalt en hel konkurrencekamp fra opvarmning til sejr. Se, hør og mærk hver detalje af din præstation.",
      steps: ["Find et roligt sted og luk øjnene.", "Visualiser dig selv ankomme til stævnet — mærk energien fra tilskuerne.", "Se dig selv varme op selvsikkert, kroppen afslappet og klar.", "Forestil dig din første kamp: hør dommeren, mærk måtten under fødderne.", "Udfør dine bedste teknikker med perfekt timing og kraft.", "Visualiser at overvinde et svært øjeblik — bevar roen og tilpas dig.", "Se dig selv vinde det afgørende point og fejre."],
      whyItMatters: "Mental gennemgang aktiverer de samme neurale baner som fysisk træning og opbygger selvtillid og muskelhukommelse uden fysisk udmattelse.",
    },
  },
  {
    id: "m2", category: "breathing", difficulty: "beginner",
    en: {
      name: "Box Breathing", duration: "5 min",
      description: "A simple 4-4-4-4 breathing pattern used by elite athletes and military to calm the nervous system and sharpen focus.",
      steps: ["Sit or stand in a comfortable position.", "Inhale slowly through your nose for 4 seconds.", "Hold your breath for 4 seconds.", "Exhale slowly through your mouth for 4 seconds.", "Hold empty for 4 seconds.", "Repeat for 5 minutes or 10 cycles."],
      whyItMatters: "Controls pre-fight adrenaline, lowers heart rate, and allows you to enter competition with a calm, focused mind.",
    },
    da: {
      name: "Boks-vejrtrækning", duration: "5 min",
      description: "Et simpelt 4-4-4-4 vejrtrækningsmønster brugt af eliteatleter og militæret til at berolige nervesystemet og skærpe fokus.",
      steps: ["Sid eller stå i en behagelig position.", "Indånd langsomt gennem næsen i 4 sekunder.", "Hold vejret i 4 sekunder.", "Ånd langsomt ud gennem munden i 4 sekunder.", "Hold tomt i 4 sekunder.", "Gentag i 5 minutter eller 10 cyklusser."],
      whyItMatters: "Kontrollerer adrenalin før kamp, sænker hjerterytmen og lader dig gå ind i konkurrence med et roligt, fokuseret sind.",
    },
  },
  {
    id: "m3", category: "confidence", difficulty: "beginner",
    en: {
      name: "Positive Self-Talk Reprogramming", duration: "10 min",
      description: "Identify and replace negative inner dialogue with powerful, competition-ready affirmations.",
      steps: ["Write down 3 negative thoughts you often have during training or competition.", "For each, write a positive replacement (e.g., 'I always lose to taller opponents' → 'I use my speed and angles against taller fighters').", "Read your positive statements out loud 3 times with conviction.", "Visualize a moment where the positive statement is true.", "Practice daily, especially before training sessions."],
      whyItMatters: "Your inner voice directly impacts performance. Athletes who train positive self-talk show measurably better results under pressure.",
    },
    da: {
      name: "Positiv selvtale-omprogrammering", duration: "10 min",
      description: "Identificér og erstat negativ indre dialog med kraftfulde, konkurrenceklare bekræftelser.",
      steps: ["Skriv 3 negative tanker du ofte har under træning eller konkurrence.", "For hver, skriv en positiv erstatning (f.eks. 'Jeg taber altid til højere modstandere' → 'Jeg bruger min hastighed og vinkler mod højere kæmpere').", "Læs dine positive udsagn højt 3 gange med overbevisning.", "Visualiser et øjeblik hvor det positive udsagn er sandt.", "Øv dagligt, især før træningspas."],
      whyItMatters: "Din indre stemme påvirker din præstation direkte. Atleter der træner positiv selvtale viser målbart bedre resultater under pres.",
    },
  },
  {
    id: "m4", category: "focus", difficulty: "beginner",
    en: {
      name: "Focus Trigger Routine", duration: "3-5 min",
      description: "Create a personal pre-performance ritual that instantly shifts you into a focused, competition-ready state.",
      steps: ["Choose a physical trigger (e.g., clapping hands, adjusting your belt, a specific stance).", "Pair it with a power word or phrase (e.g., 'sharp', 'now', 'let's go').", "Take 3 deep breaths while performing your trigger.", "Visualize your best performance moment for 10 seconds.", "Open your eyes and begin — fully locked in.", "Use this exact routine before every sparring round or poomsae."],
      whyItMatters: "A consistent trigger routine trains your brain to enter a flow state on command, reducing warm-up time for peak mental performance.",
    },
    da: {
      name: "Fokus-trigger rutine", duration: "3-5 min",
      description: "Skab en personlig præstationsritual der øjeblikkeligt skifter dig til en fokuseret, konkurrenceklar tilstand.",
      steps: ["Vælg en fysisk trigger (f.eks. klap i hænderne, juster dit bælte, en bestemt stilling).", "Par den med et kraftord eller en sætning (f.eks. 'skarp', 'nu', 'kom så').", "Tag 3 dybe vejrtrækninger mens du udfører din trigger.", "Visualiser dit bedste præstationsøjeblik i 10 sekunder.", "Åbn øjnene og begynd — fuldt fokuseret.", "Brug denne præcise rutine før hver sparringsrunde eller poomsae."],
      whyItMatters: "En konsistent trigger-rutine træner din hjerne til at gå i flow-tilstand på kommando og reducerer opvarmningstiden til toppræstation.",
    },
  },
  {
    id: "m5", category: "recovery", difficulty: "beginner",
    en: {
      name: "Progressive Muscle Relaxation", duration: "15 min",
      description: "Systematically tense and release muscle groups to release physical tension and calm the mind after intense training.",
      steps: ["Lie down in a comfortable position. Close your eyes.", "Start with your feet — tense for 5 seconds, then release.", "Move to calves, quads, glutes — tense and release each.", "Continue upward: core, chest, hands, arms, shoulders.", "Finish with face muscles — scrunch and release.", "Spend 2 minutes in total relaxation, breathing naturally."],
      whyItMatters: "Reduces cortisol levels, accelerates recovery, and teaches body awareness — critical for recognizing and releasing competition tension.",
    },
    da: {
      name: "Progressiv muskelafspænding", duration: "15 min",
      description: "Spænd og slap systematisk af i muskelgrupper for at frigive fysisk spænding og berolige sindet efter intens træning.",
      steps: ["Læg dig i en behagelig position. Luk øjnene.", "Start med fødderne — spænd i 5 sekunder, slap derefter af.", "Gå til lægge, lår, baller — spænd og slap af i hver.", "Fortsæt opad: core, bryst, hænder, arme, skuldre.", "Slut med ansigtsmuskler — pres sammen og slap af.", "Brug 2 minutter i total afslapning med naturlig vejrtrækning."],
      whyItMatters: "Reducerer kortisolniveauer, accelererer restitution og lærer kropsbevidsthed — afgørende for at genkende og frigive konkurrencespænding.",
    },
  },
  {
    id: "m6", category: "toughness", difficulty: "advanced",
    en: {
      name: "Adversity Rehearsal", duration: "10 min",
      description: "Mentally prepare for worst-case scenarios so you can stay composed when things go wrong in competition.",
      steps: ["Think of 3 things that could go wrong (bad call, losing first round, injury scare).", "For each scenario, visualize it happening in vivid detail.", "Now visualize your ideal response — staying calm, adapting, fighting back.", "Feel the emotions but practice controlling them.", "End by visualizing yourself overcoming and winning despite adversity."],
      whyItMatters: "Champions don't avoid adversity — they prepare for it. Mental rehearsal of setbacks builds resilience and prevents panic during competition.",
    },
    da: {
      name: "Modgangsøvelse", duration: "10 min",
      description: "Forbered dig mentalt på worst-case scenarier så du kan bevare roen når tingene går galt i konkurrence.",
      steps: ["Tænk på 3 ting der kan gå galt (forkert dommerkald, tab af første runde, skadefrygt).", "For hvert scenarie, visualiser det ske i levende detaljer.", "Visualiser nu din ideelle reaktion — bevar roen, tilpas dig, kæmp tilbage.", "Mærk følelserne men øv dig i at kontrollere dem.", "Slut med at visualisere dig selv overvinde og vinde trods modgang."],
      whyItMatters: "Mestre undgår ikke modgang — de forbereder sig på den. Mental gennemgang af tilbageslag opbygger modstandsdygtighed og forhindrer panik under konkurrence.",
    },
  },
  {
    id: "m7", category: "focus", difficulty: "intermediate",
    en: {
      name: "Mindful Sparring Replay", duration: "10 min",
      description: "After sparring, mentally replay the session to identify patterns, improve decision-making, and reinforce good moments.",
      steps: ["Within 30 minutes of sparring, find a quiet spot.", "Replay the session in your mind from start to finish.", "Note 3 moments where you made good decisions.", "Note 2 moments where you could have chosen differently.", "Visualize those 2 moments again — this time with the better choice.", "End by mentally 'saving' the improved version."],
      whyItMatters: "Deliberate mental review doubles the learning value of each sparring session and accelerates tactical development.",
    },
    da: {
      name: "Opmærksom sparrings-genafspilning", duration: "10 min",
      description: "Efter sparring, genafspil sessionen mentalt for at identificere mønstre, forbedre beslutningstagning og forstærke gode øjeblikke.",
      steps: ["Inden for 30 minutter efter sparring, find et roligt sted.", "Genafspil sessionen i dit sind fra start til slut.", "Notér 3 øjeblikke hvor du tog gode beslutninger.", "Notér 2 øjeblikke hvor du kunne have valgt anderledes.", "Visualiser de 2 øjeblikke igen — denne gang med det bedre valg.", "Slut med mentalt at 'gemme' den forbedrede version."],
      whyItMatters: "Bevidst mental gennemgang fordobler læringsværdien af hvert sparringspas og accelererer taktisk udvikling.",
    },
  },
  {
    id: "m8", category: "confidence", difficulty: "beginner",
    en: {
      name: "Power Pose & Confidence Priming", duration: "5 min",
      description: "Use body language to chemically boost confidence before competition through expansive postures.",
      steps: ["Stand tall with feet wider than shoulder-width.", "Place hands on hips or raise arms overhead in a V-shape.", "Hold the pose for 2 minutes, breathing deeply.", "While holding, recall your greatest training moment.", "Say your power affirmation out loud.", "Walk into the arena carrying this energy."],
      whyItMatters: "Research shows expansive postures increase testosterone and decrease cortisol, creating a neurochemical state optimal for competition.",
    },
    da: {
      name: "Power-pose og selvtillids-priming", duration: "5 min",
      description: "Brug kropssprog til kemisk at booste selvtillid før konkurrence gennem ekspansive kropsholdninger.",
      steps: ["Stå rank med fødderne bredere end skulderbredde.", "Placér hænderne på hofterne eller løft armene over hovedet i en V-form.", "Hold posen i 2 minutter med dyb vejrtrækning.", "Mens du holder, genkald dit største træningsøjeblik.", "Sig din kraft-bekræftelse højt.", "Gå ind i arenaen med denne energi."],
      whyItMatters: "Forskning viser at ekspansive kropsholdninger øger testosteron og sænker kortisol, hvilket skaber en neurokemisk tilstand optimal til konkurrence.",
    },
  },
  {
    id: "m9", category: "breathing", difficulty: "intermediate",
    en: {
      name: "Tactical Breathing (Combat Breathing)", duration: "3 min",
      description: "A rapid-reset breathing technique designed for use between rounds or during breaks in competition.",
      steps: ["Inhale sharply through the nose for 3 seconds.", "Hold for 2 seconds.", "Exhale forcefully through the mouth for 4 seconds.", "Immediately inhale again — repeat 5 times.", "On the final exhale, reset your stance and re-engage your focus trigger."],
      whyItMatters: "Designed for high-stress moments, this technique rapidly lowers heart rate and restores clarity between competition rounds.",
    },
    da: {
      name: "Taktisk vejrtrækning (kampvejrtrækning)", duration: "3 min",
      description: "En hurtig reset-vejrtrækningsteknik designet til brug mellem runder eller i pauser under konkurrence.",
      steps: ["Indånd skarpt gennem næsen i 3 sekunder.", "Hold i 2 sekunder.", "Ånd kraftigt ud gennem munden i 4 sekunder.", "Indånd straks igen — gentag 5 gange.", "Ved det sidste udånd, nulstil din stilling og genaktivér din fokus-trigger."],
      whyItMatters: "Designet til højstressøjeblikke, denne teknik sænker hurtigt hjerterytmen og genskaber klarhed mellem konkurrencerunder.",
    },
  },
  {
    id: "m10", category: "confidence", difficulty: "intermediate",
    en: {
      name: "Goal Layering", duration: "15 min",
      description: "Set three levels of goals for every competition — outcome, performance, and process — to maintain motivation regardless of results.",
      steps: ["Write your outcome goal (e.g., 'Win gold').", "Write 2-3 performance goals (e.g., 'Land 5 head kicks', 'Keep guard up entire match').", "Write 3-4 process goals (e.g., 'Use focus trigger before each round', 'Control breathing').", "Rank them: process goals matter most, outcome goals least.", "Review before competition. Evaluate performance goals after — regardless of outcome."],
      whyItMatters: "Process-focused athletes handle pressure better because success isn't tied to a single result. This builds long-term confidence.",
    },
    da: {
      name: "Mållagdeling", duration: "15 min",
      description: "Sæt tre niveauer af mål til hver konkurrence — resultat, præstation og proces — for at bevare motivationen uanset resultat.",
      steps: ["Skriv dit resultatmål (f.eks. 'Vind guld').", "Skriv 2-3 præstationsmål (f.eks. 'Land 5 hovedspark', 'Hold garden oppe hele kampen').", "Skriv 3-4 procesmål (f.eks. 'Brug fokus-trigger før hver runde', 'Kontrollér vejrtrækning').", "Rangér dem: procesmål er vigtigst, resultatmål mindst.", "Gennemgå før konkurrence. Evaluer præstationsmål efter — uanset resultat."],
      whyItMatters: "Procesfokuserede atleter håndterer pres bedre fordi succes ikke er bundet til ét enkelt resultat. Dette opbygger langsigtet selvtillid.",
    },
  },
  {
    id: "m11", category: "focus", difficulty: "intermediate",
    en: {
      name: "Peripheral Vision Training", duration: "5-10 min",
      description: "Train soft focus and expanded awareness to read opponents better and react faster during sparring.",
      steps: ["Stand facing a wall or open space.", "Fix your gaze on a central point — do not move your eyes.", "Without moving your eyes, notice objects in your peripheral vision.", "Gradually try to expand awareness to the edges of your visual field.", "Practice while a training partner moves around you.", "Apply in sparring: focus on opponent's chest, read limbs peripherally."],
      whyItMatters: "Elite fighters use soft focus rather than tracking specific body parts, allowing faster reaction times and better pattern recognition.",
    },
    da: {
      name: "Perifert synstræning", duration: "5-10 min",
      description: "Træn blødt fokus og udvidet bevidsthed til bedre at aflæse modstandere og reagere hurtigere under sparring.",
      steps: ["Stå vendt mod en væg eller et åbent rum.", "Fasthold dit blik på et centralt punkt — bevæg ikke øjnene.", "Uden at bevæge øjnene, bemærk objekter i dit perifere syn.", "Forsøg gradvist at udvide bevidstheden til kanterne af dit synsfelt.", "Øv mens en træningspartner bevæger sig rundt om dig.", "Anvend i sparring: fokusér på modstanderens bryst, aflæs lemmer perifert."],
      whyItMatters: "Elitekæmpere bruger blødt fokus i stedet for at følge specifikke kropsdele, hvilket giver hurtigere reaktionstider og bedre mønstergenkendelse.",
    },
  },
  {
    id: "m12", category: "toughness", difficulty: "advanced",
    en: {
      name: "Emotional Reset Protocol", duration: "2-3 min",
      description: "A rapid technique to recover mentally after receiving a hard hit, bad call, or losing a round.",
      steps: ["Acknowledge the emotion: 'I'm frustrated — that's normal.'", "Physical reset: shake out your hands, roll your shoulders.", "Take 3 tactical breaths (inhale 3, hold 2, exhale 4).", "Say your reset word (e.g., 'Next', 'Fresh', 'Go').", "Re-engage with your focus trigger routine.", "Attack the next exchange with full commitment."],
      whyItMatters: "The ability to reset emotionally within seconds separates elite competitors from good ones. Dwelling on mistakes compounds them.",
    },
    da: {
      name: "Emotionel reset-protokol", duration: "2-3 min",
      description: "En hurtig teknik til mentalt at komme sig efter et hårdt slag, forkert dommerkald eller tabt runde.",
      steps: ["Anerkend følelsen: 'Jeg er frustreret — det er normalt.'", "Fysisk reset: ryst hænderne, rul skuldrene.", "Tag 3 taktiske vejrtrækninger (indånd 3, hold 2, udånd 4).", "Sig dit reset-ord (f.eks. 'Næste', 'Frisk', 'Kom').", "Genaktivér din fokus-trigger rutine.", "Angrib næste udveksling med fuld dedikation."],
      whyItMatters: "Evnen til at resette følelsesmæssigt inden for sekunder adskiller elitekonkurrenter fra gode. At dvæle ved fejl forstærker dem.",
    },
  },
  {
    id: "m13", category: "recovery", difficulty: "beginner",
    en: {
      name: "Sleep Visualization", duration: "10 min",
      description: "A pre-sleep mental practice that combines recovery and performance visualization to optimize rest and training transfer.",
      steps: ["Lie in bed ready to sleep.", "Take 10 slow, deep breaths to relax.", "Replay your best moment from today's training.", "Visualize your body recovering: muscles repairing, energy rebuilding.", "Set a simple intention for tomorrow's session.", "Let go of all thoughts and drift into sleep."],
      whyItMatters: "The brain consolidates motor skills during sleep. Pre-sleep visualization enhances this process and improves next-day performance.",
    },
    da: {
      name: "Søvnvisualisering", duration: "10 min",
      description: "En mental øvelse før søvn der kombinerer restitution og præstationsvisualisering for at optimere hvile og træningsoverførsel.",
      steps: ["Læg dig i sengen klar til at sove.", "Tag 10 langsomme, dybe vejrtrækninger for at slappe af.", "Genafspil dit bedste øjeblik fra dagens træning.", "Visualiser din krop komme sig: muskler reparerer, energi genopbygges.", "Sæt en simpel intention for morgendagens session.", "Slip alle tanker og glid ind i søvn."],
      whyItMatters: "Hjernen konsoliderer motoriske færdigheder under søvn. Visualisering før søvn forbedrer denne proces og forbedrer næste dags præstation.",
    },
  },
  {
    id: "m14", category: "toughness", difficulty: "advanced",
    en: {
      name: "Pressure Inoculation Training", duration: "During training",
      description: "Deliberately create competition-level stress in training to build tolerance and maintain technique under pressure.",
      steps: ["Ask your coach to simulate competition conditions (crowd noise, time pressure).", "Spar with a scoreboard and referee calls.", "Add consequences: losing a round means extra conditioning.", "Practice your mental routines (focus trigger, breathing) during these sessions.", "After each session, rate your mental composure 1-10.", "Track improvement over weeks."],
      whyItMatters: "You can't develop competition toughness in comfortable training. Controlled stress exposure builds genuine mental resilience.",
    },
    da: {
      name: "Pres-inokulations-træning", duration: "Under træning",
      description: "Skab bevidst konkurrenceniveau-stress i træning for at opbygge tolerance og fastholde teknik under pres.",
      steps: ["Bed din træner simulere konkurrenceforhold (publikumsstøj, tidspres).", "Spar med pointtavle og dommerkald.", "Tilføj konsekvenser: tab af en runde betyder ekstra kondition.", "Øv dine mentale rutiner (fokus-trigger, vejrtrækning) under disse sessioner.", "Efter hvert session, bedøm din mentale fatning 1-10.", "Følg forbedring over uger."],
      whyItMatters: "Man kan ikke udvikle konkurrencementalitet i behagelig træning. Kontrolleret stresseksponering opbygger ægte mental modstandsdygtighed.",
    },
  },
  {
    id: "m15", category: "recovery", difficulty: "beginner",
    en: {
      name: "Gratitude & Perspective Check", duration: "5 min",
      description: "A mental exercise to prevent burnout and maintain long-term motivation by reconnecting with your love for the sport.",
      steps: ["Write down 3 things you're grateful for about your training today.", "Write 1 thing you're proud of from the past week.", "Recall why you started Taekwondo — reconnect with that feeling.", "Think of one person who supports your journey — feel appreciation.", "Set one small, joyful goal for your next session (not performance — just fun)."],
      whyItMatters: "Sustained high performance requires intrinsic motivation. Gratitude practice prevents the burnout that derails many talented athletes.",
    },
    da: {
      name: "Taknemmelighed & perspektivtjek", duration: "5 min",
      description: "En mental øvelse der forebygger udbrændthed og fastholder langsigtet motivation ved at genforbinde med din kærlighed til sporten.",
      steps: ["Skriv 3 ting du er taknemmelig for ved din træning i dag.", "Skriv 1 ting du er stolt af fra den forgangne uge.", "Genkald hvorfor du startede taekwondo — genforbind med den følelse.", "Tænk på én person der støtter din rejse — mærk taknemmelighed.", "Sæt ét lille, glædeligt mål for din næste session (ikke præstation — bare sjov)."],
      whyItMatters: "Vedvarende høj præstation kræver indre motivation. Taknemmeligheds-praksis forebygger den udbrændthed der afsporer mange talentfulde atleter.",
    },
  },
  {
    id: "m16", category: "breathing", difficulty: "beginner",
    en: {
      name: "Centering Technique", duration: "2 min",
      description: "A rapid pre-performance technique that combines breathing, body awareness, and focus into a single powerful routine.",
      steps: ["Stand in a natural stance, feet shoulder-width apart.", "Inhale deeply — feel your center of gravity drop to your core.", "As you exhale, release all tension from your shoulders and jaw.", "Focus your attention on a single point ahead of you.", "Say your power cue word internally.", "You're centered — begin."],
      whyItMatters: "Centering is the fastest way to transition from anxious energy to controlled intensity — the ideal competition state.",
    },
    da: {
      name: "Centreringsteknik", duration: "2 min",
      description: "En hurtig præ-præstationsteknik der kombinerer vejrtrækning, kropsbevidsthed og fokus i én kraftfuld rutine.",
      steps: ["Stå i en naturlig stilling, fødder i skulderbredde.", "Indånd dybt — mærk dit tyngdepunkt sænke sig til din core.", "Mens du ånder ud, slip al spænding fra skuldre og kæbe.", "Fokusér din opmærksomhed på ét punkt foran dig.", "Sig dit kraft-stikord indvendigt.", "Du er centreret — begynd."],
      whyItMatters: "Centrering er den hurtigste måde at skifte fra ængstelig energi til kontrolleret intensitet — den ideelle konkurrencetilstand.",
    },
  },
];

export function getMentalExercises(locale: Locale = "en"): MentalExercise[] {
  const effectiveLocale = (locale === "da" ? "da" : "en") as "en" | "da";
  return mentalExercisesData.map((ex) => ({
    id: ex.id,
    category: ex.category,
    difficulty: ex.difficulty,
    name: ex[effectiveLocale].name,
    duration: ex[effectiveLocale].duration,
    description: ex[effectiveLocale].description,
    steps: ex[effectiveLocale].steps,
    whyItMatters: ex[effectiveLocale].whyItMatters,
  }));
}
