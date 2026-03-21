export type ExerciseCategory = "power" | "speed" | "strength" | "mobility" | "plyometric";

export type MuscleGroup = 
  | "glutes" | "quads" | "hamstrings" | "calves" 
  | "core" | "hip-flexors" | "shoulders" | "back" | "chest";

export interface ExerciseAlternative {
  name: string;
  reason: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets: number;
  reps: string;
  tempo?: string;
  rest: string;
  notes: string;
  videoId: string;
  whyItMatters: string;
  alternatives?: ExerciseAlternative[];
}

export interface TrainingDay {
  id: string;
  dayOfWeek: string;
  label: string;
  type: "tkd" | "gym" | "recovery";
  focus?: string;
  exercises: Exercise[];
}

export const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  power: "bg-gradient-power",
  speed: "text-speed",
  strength: "text-primary",
  mobility: "text-accent",
  plyometric: "bg-gradient-explosive",
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  power: "Power",
  speed: "Speed / RFD",
  strength: "Strength",
  mobility: "Mobility",
  plyometric: "Plyometric",
};

interface ExerciseLocalized {
  notes: string;
  whyItMatters: string;
  alternatives?: { name: string; reason: string }[];
}

interface ExerciseBase {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  sets: number;
  reps: string;
  tempo?: string;
  rest: string;
  videoId: string;
  en: ExerciseLocalized;
  da: ExerciseLocalized;
  sv: ExerciseLocalized;
}

const exercisesData: Record<string, ExerciseBase> = {
  trapBarDeadlift: {
    id: "trap-bar-deadlift",
    name: "Trap Bar Deadlift",
    category: "power",
    muscleGroups: ["glutes", "quads", "hamstrings", "back"],
    sets: 4,
    reps: "3-5",
    tempo: "X (explosive concentric)",
    rest: "3 min",
    videoId: "WzvsIU9FW60",
    en: {
      notes: "Focus on maximal force into the ground. Stand tall explosively. No grinding reps — stop the set if bar speed drops.",
      whyItMatters: "Builds total-body force production without the spinal loading of back squats. The upright torso mimics kicking posture.",
      alternatives: [
        { name: "Barbell Deadlift", reason: "Same movement pattern if no trap bar is available" },
        { name: "Goblet Squat", reason: "Lighter alternative that still trains hip extension with upright torso" },
        { name: "Pistol Squat Negatives", reason: "No equipment needed — trains single-leg hip extension with bodyweight" },
      ],
    },
    da: {
      notes: "Fokusér på maksimal kraft ned i gulvet. Rejs dig eksplosivt. Ingen slidende gentagelser — stop sættet hvis stangfarten falder.",
      whyItMatters: "Opbygger helkropskraftproduktion uden den rygsøjlebelastning som back squats giver. Den oprejste overkrop efterligner sparkeposition.",
      alternatives: [
        { name: "Barbell Deadlift", reason: "Samme bevægelsesmønster hvis der ikke er en trap bar tilgængelig" },
        { name: "Goblet Squat", reason: "Lettere alternativ der stadig træner hofteekstension med oprejst overkrop" },
        { name: "Pistol Squat Negatives", reason: "Intet udstyr nødvendigt — træner ét-bens hofteekstension med kropsvægt" },
      ],
    },
    sv: {
      notes: "Fokusera på maximal kraft ner i golvet. Res dig explosivt. Inga malande reps — avbryt setet om stånghastigheten sjunker.",
      whyItMatters: "Bygger helkropps-kraftproduktion utan den ryggbelastning som knäböj ger. Den upprätta bålen efterliknar sparkpositionen.",
      alternatives: [
        { name: "Barbell Deadlift", reason: "Samma rörelsemönster om det inte finns en trap bar tillgänglig" },
        { name: "Goblet Squat", reason: "Lättare alternativ som fortfarande tränar höftextension med upprätt bål" },
        { name: "Pistol Squat Negatives", reason: "Ingen utrustning behövs — tränar enbens höftextension med kroppsvikt" },
      ],
    },
  },
  boxJumps: {
    id: "box-jumps",
    name: "Box Jumps (Step Down)",
    category: "plyometric",
    muscleGroups: ["glutes", "quads", "calves"],
    sets: 4,
    reps: "3-4",
    rest: "2 min",
    videoId: "52r_Ul5k03g",
    en: {
      notes: "Maximum height intent. Step down (don't jump down) to protect joints. Full hip extension at the top.",
      whyItMatters: "Develops explosive hip extension — the engine behind roundhouse kicks and spinning techniques.",
      alternatives: [
        { name: "Squat Jumps", reason: "No box needed, still trains explosive hip extension" },
        { name: "Broad Jumps", reason: "Horizontal plyometric that builds similar power" },
      ],
    },
    da: {
      notes: "Maksimal højdeintention. Træd ned (spring ikke ned) for at beskytte leddene. Fuld hofteekstension i toppen.",
      whyItMatters: "Udvikler eksplosiv hofteekstension — motoren bag rundspark og spinteknikker.",
      alternatives: [
        { name: "Squat Jumps", reason: "Ingen boks nødvendig, træner stadig eksplosiv hofteekstension" },
        { name: "Broad Jumps", reason: "Horisontal plyometrisk øvelse der opbygger lignende kraft" },
      ],
    },
    sv: {
      notes: "Maximal höjdintention. Kliv ner (hoppa inte ner) för att skydda lederna. Full höftextension i toppen.",
      whyItMatters: "Utvecklar explosiv höftextension — motorn bakom rundsparkar och snurrteknik.",
      alternatives: [
        { name: "Squat Jumps", reason: "Ingen box behövs, tränar fortfarande explosiv höftextension" },
        { name: "Broad Jumps", reason: "Horisontell plyometrisk övning som bygger liknande kraft" },
      ],
    },
  },
  hangCleanPull: {
    id: "hang-clean-pull",
    name: "Hang Clean Pull",
    category: "power",
    muscleGroups: ["glutes", "hamstrings", "back", "shoulders"],
    sets: 4,
    reps: "3",
    tempo: "Explosive triple extension",
    rest: "2-3 min",
    videoId: "FZaEqAAzH4Y",
    en: {
      notes: "Drive through the floor, shrug hard at the top. No need to catch — focus on the pull. Use straps if grip limits load.",
      whyItMatters: "Trains rate of force development (RFD) and triple extension — ankles, knees, hips — exactly the chain used in explosive kicks.",
      alternatives: [
        { name: "Dumbbell High Pull", reason: "Similar triple extension pattern with dumbbells" },
        { name: "Kettlebell Swing", reason: "Trains hip hinge explosiveness with simpler technique" },
        { name: "Explosive Broad Jump", reason: "No equipment — trains full triple extension with bodyweight" },
      ],
    },
    da: {
      notes: "Driv igennem gulvet, træk skuldrene kraftigt op i toppen. Ingen fangst nødvendig — fokusér på trækket. Brug stropper hvis greb begrænser belastning.",
      whyItMatters: "Træner kraftudviklingshastighed (RFD) og trippelekstension — ankler, knæ, hofter — præcis den kæde der bruges i eksplosive spark.",
      alternatives: [
        { name: "Dumbbell High Pull", reason: "Lignende trippelekstensionsmønster med håndvægte" },
        { name: "Kettlebell Swing", reason: "Træner hoftehængsel-eksplosivitet med enklere teknik" },
        { name: "Eksplosivt Længdespring", reason: "Intet udstyr — træner fuld trippelekstension med kropsvægt" },
      ],
    },
    sv: {
      notes: "Driv genom golvet, ryck hårt i toppen. Inget fång behövs — fokusera på draget. Använd remmar om greppet begränsar lasten.",
      whyItMatters: "Tränar kraftutvecklingshastighet (RFD) och trippelextension — vrister, knän, höfter — exakt den kedja som används i explosiva sparkar.",
      alternatives: [
        { name: "Dumbbell High Pull", reason: "Liknande trippelextensionsmönster med hantlar" },
        { name: "Kettlebell Swing", reason: "Tränar höftgångjärns-explosivitet med enklare teknik" },
        { name: "Explosivt Längdhopp", reason: "Ingen utrustning — tränar full trippelextension med kroppsvikt" },
      ],
    },
  },
  splitSquat: {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    category: "strength",
    muscleGroups: ["glutes", "quads", "hip-flexors"],
    sets: 3,
    reps: "6-8 each leg",
    tempo: "3-0-1-0",
    rest: "90 sec",
    videoId: "2C-uNgKwPLE",
    en: {
      notes: "Control the eccentric (3 sec down). Drive up powerfully. Keep torso upright. Addresses single-leg imbalances critical for kicking.",
      whyItMatters: "Taekwondo is a single-leg sport. This builds unilateral strength and hip stability for powerful kicks off either leg.",
      alternatives: [
        { name: "Reverse Lunge", reason: "Similar unilateral pattern without needing a bench" },
        { name: "Step-Up", reason: "Single-leg strength with less balance demand" },
        { name: "Bodyweight Split Squat", reason: "No equipment — same pattern using bodyweight only" },
      ],
    },
    da: {
      notes: "Kontrollér den excentriske fase (3 sek ned). Driv kraftfuldt op. Hold overkroppen oprejst. Adresserer ubalancer på ét ben, som er kritiske for spark.",
      whyItMatters: "Taekwondo er en ét-bens sport. Denne øvelse opbygger unilateral styrke og hoftestabilitet for kraftige spark fra begge ben.",
      alternatives: [
        { name: "Reverse Lunge", reason: "Lignende unilateralt mønster uden brug af bænk" },
        { name: "Step-Up", reason: "Ét-bens styrke med mindre balancekrav" },
        { name: "Kropsvægt Split Squat", reason: "Intet udstyr — samme mønster kun med kropsvægt" },
      ],
    },
    sv: {
      notes: "Kontrollera den excentriska fasen (3 sek ner). Driv upp kraftfullt. Håll bålen upprätt. Adresserar obalanser på ett ben, kritiskt för sparkar.",
      whyItMatters: "Taekwondo är en enbens-sport. Denna övning bygger unilateral styrka och höftstabilitet för kraftfulla sparkar från båda benen.",
      alternatives: [
        { name: "Reverse Lunge", reason: "Liknande unilateralt mönster utan bänk" },
        { name: "Step-Up", reason: "Enbens-styrka med mindre balanskrav" },
        { name: "Kroppsvikt Split Squat", reason: "Ingen utrustning — samma mönster med enbart kroppsvikt" },
      ],
    },
  },
  nordicCurl: {
    id: "nordic-curl",
    name: "Nordic Hamstring Curl",
    category: "strength",
    muscleGroups: ["hamstrings"],
    sets: 3,
    reps: "4-6",
    tempo: "5 sec eccentric",
    rest: "2 min",
    videoId: "6NCN6kOagfY",
    en: {
      notes: "Control the descent as slowly as possible. Push off the floor to assist the concentric if needed. Crucial for hamstring injury prevention.",
      whyItMatters: "Prevents hamstring tears from high kicks. Eccentric hamstring strength is the #1 predictor of injury resilience in kicking athletes.",
      alternatives: [
        { name: "Slider Leg Curl", reason: "Eccentric hamstring work using sliders or towel on smooth floor" },
        { name: "Romanian Deadlift", reason: "Trains hamstring lengthening under load" },
      ],
    },
    da: {
      notes: "Kontrollér nedsænkningen så langsomt som muligt. Skub fra gulvet for at hjælpe den koncentriske fase om nødvendigt. Afgørende for forebyggelse af hamstringskader.",
      whyItMatters: "Forebygger hamstringskader fra høje spark. Excentrisk hamstringstyrke er den bedste forudsiger for skadesmodstand hos sparkeatleter.",
      alternatives: [
        { name: "Slider Leg Curl", reason: "Excentrisk hamstringarbejde med sliders eller håndklæde på glat gulv" },
        { name: "Romanian Deadlift", reason: "Træner hamstringforlængelse under belastning" },
      ],
    },
    sv: {
      notes: "Kontrollera nedsänkningen så långsamt som möjligt. Tryck ifrån golvet för att hjälpa den koncentriska fasen vid behov. Avgörande för att förebygga hamstringsskador.",
      whyItMatters: "Förebygger hamstringsskador från höga sparkar. Excentrisk hamstringsstyrka är den främsta prediktorn för skademotståndskraft hos sparkande idrottare.",
      alternatives: [
        { name: "Slider Leg Curl", reason: "Excentriskt hamstringsarbete med sliders eller handduk på slät yta" },
        { name: "Romanian Deadlift", reason: "Tränar hamstringsförlängning under belastning" },
      ],
    },
  },
  medicBallRotationalThrow: {
    id: "med-ball-rotational-throw",
    name: "Med Ball Rotational Throw",
    category: "power",
    muscleGroups: ["core", "hip-flexors", "shoulders"],
    sets: 3,
    reps: "5 each side",
    rest: "90 sec",
    videoId: "DttZ5JU-b_U",
    en: {
      notes: "Initiate from the hips, not the arms. Release with maximum intent. Use a 3-5 kg ball. Think 'turning kick' rotation.",
      whyItMatters: "Directly mimics the rotational power pattern of roundhouse and hook kicks. Develops core RFD.",
      alternatives: [
        { name: "Cable Woodchop", reason: "Same rotational pattern with adjustable resistance" },
        { name: "Landmine Rotation", reason: "Rotational power using a barbell in a landmine" },
        { name: "Standing Rotational Throw (no ball)", reason: "No equipment — mimic the throw motion explosively with clasped hands" },
      ],
    },
    da: {
      notes: "Start fra hofterne, ikke armene. Slip med maksimal intention. Brug en 3-5 kg bold. Tænk 'rundspark'-rotation.",
      whyItMatters: "Efterligner direkte det roterende kraftmønster fra rundspark og krogafspark. Udvikler core RFD.",
      alternatives: [
        { name: "Cable Woodchop", reason: "Samme rotationsmønster med justerbar modstand" },
        { name: "Landmine Rotation", reason: "Rotationskraft med vægtstang i en landmine" },
        { name: "Stående Rotationskast (uden bold)", reason: "Intet udstyr — efterlign kastbevægelsen eksplosivt med foldede hænder" },
      ],
    },
    sv: {
      notes: "Initiera från höfterna, inte armarna. Släpp med maximal intention. Använd en 3–5 kg boll. Tänk 'rundspark'-rotation.",
      whyItMatters: "Efterliknar direkt det roterande kraftmönstret i rundsparkar och krokavsparkar. Utvecklar core-RFD.",
      alternatives: [
        { name: "Cable Woodchop", reason: "Samma rotationsmönster med justerbart motstånd" },
        { name: "Landmine Rotation", reason: "Rotationskraft med skivstång i en landmine" },
        { name: "Stående Rotationskast (utan boll)", reason: "Ingen utrustning — efterlikna kaströrelsen explosivt med knäppta händer" },
      ],
    },
  },
  bandedHipFlexorDrive: {
    id: "banded-hip-flexor-drive",
    name: "Banded Standing Knee Drive",
    category: "speed",
    muscleGroups: ["hip-flexors", "core"],
    sets: 3,
    reps: "8-10 each leg (fast)",
    rest: "60 sec",
    videoId: "LHzdOtePvTs",
    en: {
      notes: "Attach band low behind you. Drive knee up explosively against resistance. Mimic chambering a front kick. Speed over load.",
      whyItMatters: "Strengthens hip flexors with speed — the muscle group that chambers every kick. Weak hip flexors = slow kicks.",
      alternatives: [
        { name: "Cable Knee Drive", reason: "Same movement using a cable machine for consistent resistance" },
        { name: "Hanging Knee Raise (fast)", reason: "Trains hip flexor speed with bodyweight" },
        { name: "Standing Fast Knee Drives", reason: "No equipment — explosive knee drives from standing position" },
      ],
    },
    da: {
      notes: "Fastgør elastik lavt bag dig. Driv knæet eksplosivt op mod modstand. Efterlign opladning af et frontspark. Hastighed over belastning.",
      whyItMatters: "Styrker hoftefleksorer med hastighed — den muskelgruppe der oplader hvert spark. Svage hoftefleksorer = langsomme spark.",
      alternatives: [
        { name: "Cable Knee Drive", reason: "Samme bevægelse med kabelmaskine for ensartet modstand" },
        { name: "Hanging Knee Raise (hurtigt)", reason: "Træner hoftefleksorhastighed med kropsvægt" },
        { name: "Stående Hurtige Knædrivninger", reason: "Intet udstyr — eksplosive knædrivninger fra stående position" },
      ],
    },
    sv: {
      notes: "Fäst bandet lågt bakom dig. Driv knäet explosivt uppåt mot motstånd. Efterlikna upphämtningen av en frontspark. Hastighet framför belastning.",
      whyItMatters: "Stärker höftflexorerna med hastighet — den muskelgrupp som hämtar upp varje spark. Svaga höftflexorer = långsamma sparkar.",
      alternatives: [
        { name: "Cable Knee Drive", reason: "Samma rörelse med kabeldrag för jämnt motstånd" },
        { name: "Hanging Knee Raise (snabbt)", reason: "Tränar höftflexorhastighet med kroppsvikt" },
        { name: "Stående Snabba Knädrivningar", reason: "Ingen utrustning — explosiva knädrivningar från stående" },
      ],
    },
  },
  depthJumpToSprint: {
    id: "depth-jump-sprint",
    name: "Depth Jump to 5m Sprint",
    category: "plyometric",
    muscleGroups: ["glutes", "quads", "calves"],
    sets: 4,
    reps: "3",
    rest: "2-3 min",
    videoId: "ZHVWsggG4Ig",
    en: {
      notes: "Step off a 30-40 cm box, land and immediately explode forward into a 5m sprint. Minimal ground contact time. This is ADVANCED — master box jumps first.",
      whyItMatters: "Trains reactive strength and amortization phase — the ability to absorb and redirect force instantly, like a fast step-in to attack.",
      alternatives: [
        { name: "Drop Jump (vertical)", reason: "Same reactive concept without sprint space needed" },
        { name: "Hurdle Hops", reason: "Reactive plyometric using consecutive low hurdles" },
      ],
    },
    da: {
      notes: "Træd af en 30-40 cm boks, land og eksplodér straks fremad i en 5m sprint. Minimal jordkontakttid. Dette er AVANCERET — mestér box jumps først.",
      whyItMatters: "Træner reaktiv styrke og afdæmpningsfasen — evnen til at absorbere og omdirigere kraft øjeblikkeligt, som et hurtigt indskridt til angreb.",
      alternatives: [
        { name: "Drop Jump (vertikal)", reason: "Samme reaktive koncept uden behov for sprintplads" },
        { name: "Hurdle Hops", reason: "Reaktiv plyometrisk øvelse med lave hække i række" },
      ],
    },
    sv: {
      notes: "Kliv av en 30–40 cm box, landa och explodera omedelbart framåt i en 5 m sprint. Minimal markkontakttid. AVANCERAT — bemästra box jumps först.",
      whyItMatters: "Tränar reaktiv styrka och amortiseringsfasen — förmågan att absorbera och omdirigera kraft omedelbart, som ett snabbt inkliv till attack.",
      alternatives: [
        { name: "Drop Jump (vertikal)", reason: "Samma reaktiva koncept utan behov av sprintutrymme" },
        { name: "Hurdle Hops", reason: "Reaktiv plyometrisk övning med låga häckar i rad" },
      ],
    },
  },
  copenhagenPlank: {
    id: "copenhagen-plank",
    name: "Copenhagen Plank",
    category: "strength",
    muscleGroups: ["core", "hip-flexors"],
    sets: 3,
    reps: "20-30 sec each side",
    rest: "60 sec",
    videoId: "yByUFuQsgCg",
    en: {
      notes: "Top leg on bench, bottom leg floating. Straight line from head to toe. Brutal on adductors and obliques — critical for side kicks.",
      whyItMatters: "Bulletproofs the groin/adductors against injury from side kicks and wide stances. Also builds anti-lateral flexion core strength.",
      alternatives: [
        { name: "Side Plank with Adduction", reason: "Similar adductor + core work with simpler setup" },
        { name: "Sumo Squat Hold", reason: "Isometric adductor and groin strengthening" },
      ],
    },
    da: {
      notes: "Øverste ben på bænk, nederste ben svævende. Lige linje fra hoved til tå. Brutal på adduktorer og skrå mavemuskler — kritisk for sidespark.",
      whyItMatters: "Beskytter lysken/adduktorerne mod skader fra sidespark og brede stillinger. Opbygger også anti-lateral fleksion corestyrke.",
      alternatives: [
        { name: "Side Plank med Adduktion", reason: "Lignende adduktor + core arbejde med enklere opsætning" },
        { name: "Sumo Squat Hold", reason: "Isometrisk adduktor- og lyskestyrkelse" },
      ],
    },
    sv: {
      notes: "Översta benet på bänken, underbenet svävande. Rak linje från huvud till tå. Brutal på adduktorer och sneda magmuskler — kritisk för sidosparkar.",
      whyItMatters: "Skyddar ljumsken/adduktorerna mot skador från sidosparkar och breda ställningar. Bygger även anti-lateral flexion core-styrka.",
      alternatives: [
        { name: "Sidoplanka med Adduktion", reason: "Liknande adduktor- + core-arbete med enklare uppställning" },
        { name: "Sumo Squat Hold", reason: "Isometrisk adduktor- och ljumskstärkning" },
      ],
    },
  },
  ankleHops: {
    id: "ankle-hops",
    name: "Ankle Hops (Pogo Jumps)",
    category: "plyometric",
    muscleGroups: ["calves"],
    sets: 3,
    reps: "15-20",
    rest: "60 sec",
    videoId: "wa1ClvLqSHo",
    en: {
      notes: "Stiff ankles, minimal knee bend. Bounce off the ground using only ankle stiffness. Think 'hot coals.' Develops foot speed and reactive stiffness.",
      whyItMatters: "Develops ankle stiffness for bouncing footwork. Fast fighters have stiff, reactive ankles that let them change direction instantly.",
      alternatives: [
        { name: "Calf Raises (fast)", reason: "Builds calf strength when plyometrics aren't suitable" },
        { name: "Jump Rope", reason: "Similar ankle stiffness training with rhythm" },
      ],
    },
    da: {
      notes: "Stive ankler, minimal knæbøjning. Hops fra gulvet ved kun at bruge ankelstivhed. Tænk 'glødende kul'. Udvikler fodhastighed og reaktiv stivhed.",
      whyItMatters: "Udvikler ankelstivhed til hoppende fodarbejde. Hurtige kæmpere har stive, reaktive ankler der lader dem skifte retning øjeblikkeligt.",
      alternatives: [
        { name: "Calf Raises (hurtigt)", reason: "Opbygger lægstyrke når plyometrik ikke er egnet" },
        { name: "Sjippetov", reason: "Lignende ankelstivhedstræning med rytme" },
      ],
    },
    sv: {
      notes: "Stela vrister, minimal knäböjning. Studsa från golvet med enbart vriststyvhet. Tänk 'glödande kol.' Utvecklar fothastighet och reaktiv styvhet.",
      whyItMatters: "Utvecklar vriststyvhet för studsande fotarbete. Snabba fighters har styva, reaktiva vrister som låter dem byta riktning direkt.",
      alternatives: [
        { name: "Calf Raises (snabbt)", reason: "Bygger vadstyrka när plyometrik inte passar" },
        { name: "Hopprep", reason: "Liknande vriststyvhetsträning med rytm" },
      ],
    },
  },
  halfKneelingPallofPress: {
    id: "pallof-press",
    name: "Half-Kneeling Pallof Press",
    category: "strength",
    muscleGroups: ["core"],
    sets: 3,
    reps: "8-10 each side",
    rest: "60 sec",
    videoId: "AH_QZLm_0-s",
    en: {
      notes: "Press cable/band away from chest while resisting rotation. Half-kneeling forces hip stability. Slow and controlled.",
      whyItMatters: "Anti-rotation core strength prevents energy leaks during kicks. If your core collapses mid-kick, power is lost.",
      alternatives: [
        { name: "Band Anti-Rotation Hold", reason: "Simpler setup using a resistance band around a post" },
        { name: "Dead Bug", reason: "Anti-extension core work without cable equipment" },
        { name: "Bird Dog with Pause", reason: "No equipment — anti-rotation core stability from all fours" },
      ],
    },
    da: {
      notes: "Pres kabel/elastik væk fra brystet mens du modstår rotation. Halv-knælende position tvinger hoftestabilitet. Langsomt og kontrolleret.",
      whyItMatters: "Anti-rotations corestyrke forhindrer energitab under spark. Hvis din core kollapser midt i et spark, går kraften tabt.",
      alternatives: [
        { name: "Elastik Anti-Rotations Hold", reason: "Enklere opsætning med elastik rundt om en stolpe" },
        { name: "Dead Bug", reason: "Anti-ekstension corearbejde uden kabeludstyr" },
        { name: "Bird Dog med Pause", reason: "Intet udstyr — anti-rotations corestabilitet fra alle fire" },
      ],
    },
    sv: {
      notes: "Pressa kabel/band bort från bröstet samtidigt som du motstår rotation. Halvknäställning tvingar höftstabilitet. Långsamt och kontrollerat.",
      whyItMatters: "Anti-rotations core-styrka förhindrar energiförluster under sparkar. Om din core kollapsar mitt i en spark förloras kraften.",
      alternatives: [
        { name: "Band Anti-Rotationshåll", reason: "Enklare uppställning med band runt en stolpe" },
        { name: "Dead Bug", reason: "Anti-extensions core-arbete utan kabelutrustning" },
        { name: "Bird Dog med Paus", reason: "Ingen utrustning — anti-rotations core-stabilitet från alla fyra" },
      ],
    },
  },
  hipCARs: {
    id: "hip-cars",
    name: "Hip CARs (Controlled Articular Rotations)",
    category: "mobility",
    muscleGroups: ["hip-flexors", "glutes"],
    sets: 2,
    reps: "5 each direction, each leg",
    rest: "None",
    videoId: "zbH4XmSREoc",
    en: {
      notes: "Slow, controlled circles through full hip range. Keep pelvis stable — only the femur moves. Do these daily, not just on gym days.",
      whyItMatters: "Maintains and expands hip range of motion under control. High kicks require both flexibility AND strength at end range.",
      alternatives: [
        { name: "Leg Swings (front/side)", reason: "Dynamic hip mobility with simpler execution" },
        { name: "90/90 Hip Switches", reason: "Seated hip rotation drill for internal/external rotation" },
      ],
    },
    da: {
      notes: "Langsomme, kontrollerede cirkler gennem fuld hofteomfang. Hold bækkenet stabilt — kun lårbenet bevæger sig. Gør dette dagligt, ikke kun på træningsdage.",
      whyItMatters: "Vedligeholder og udvider hoftens bevægelighed under kontrol. Høje spark kræver både fleksibilitet OG styrke i yderposition.",
      alternatives: [
        { name: "Bensving (front/side)", reason: "Dynamisk hoftemobilitet med enklere udførelse" },
        { name: "90/90 Hofteskift", reason: "Siddende hofterotationsøvelse for indad/udadrotation" },
      ],
    },
    sv: {
      notes: "Långsamma, kontrollerade cirklar genom fullt höftomfång. Håll bäckenet stabilt — bara lårbenet rör sig. Gör dessa dagligen, inte bara på gymdagar.",
      whyItMatters: "Bevarar och utökar höftens rörelseomfång under kontroll. Höga sparkar kräver både flexibilitet OCH styrka i ytterpositionen.",
      alternatives: [
        { name: "Bensvingar (fram/sida)", reason: "Dynamisk höftmobilitet med enklare utförande" },
        { name: "90/90 Höftväxlingar", reason: "Sittande höftrotationsövning för inåt-/utåtrotation" },
      ],
    },
  },
  worldsGreatestStretch: {
    id: "worlds-greatest-stretch",
    name: "World's Greatest Stretch",
    category: "mobility",
    muscleGroups: ["hip-flexors", "hamstrings", "core", "shoulders"],
    sets: 2,
    reps: "5 each side",
    rest: "None",
    videoId: "NIz2MdMqBxk",
    en: {
      notes: "Lunge, plant hand, rotate thoracic spine to the sky. Hold each position 2-3 sec. Perfect warm-up flow.",
      whyItMatters: "Opens up every chain used in TKD — hips, thoracic spine, ankles. The single best warm-up movement for martial artists.",
      alternatives: [
        { name: "Spiderman Lunge with Reach", reason: "Similar multi-joint stretch with rotation" },
        { name: "Inchworm to Lunge", reason: "Full-body warm-up flow without rotation component" },
      ],
    },
    da: {
      notes: "Udfald, plant hånden, rotér brysthvirvelsøjlen mod himlen. Hold hver position 2-3 sek. Perfekt opvarmningsflow.",
      whyItMatters: "Åbner alle kæder der bruges i TKD — hofter, brysthvirvelsøjle, ankler. Den bedste enkeltstående opvarmningsøvelse for kampsportsudøvere.",
      alternatives: [
        { name: "Spiderman Lunge med Ræk", reason: "Lignende multi-led stræk med rotation" },
        { name: "Inchworm til Udfald", reason: "Helkropsopvarmningsflow uden rotationskomponent" },
      ],
    },
    sv: {
      notes: "Utfallssteg, placera handen, rotera bröstryggen mot taket. Håll varje position 2–3 sek. Perfekt uppvärmningsflöde.",
      whyItMatters: "Öppnar varje kedja som används i TKD — höfter, bröstrygg, vrister. Den bästa enskilda uppvärmningsrörelsen för kampsportare.",
      alternatives: [
        { name: "Spiderman Lunge med Räckning", reason: "Liknande multi-ledsträck med rotation" },
        { name: "Inchworm till Utfall", reason: "Helkropps uppvärmningsflöde utan rotationskomponent" },
      ],
    },
  },
  kettlebellSwing: {
    id: "kettlebell-swing",
    name: "Kettlebell Swing",
    category: "power",
    muscleGroups: ["glutes", "hamstrings", "core"],
    sets: 4,
    reps: "10-12",
    rest: "90 sec",
    videoId: "YSxHifyI6s8",
    en: {
      notes: "Hinge at hips, snap forward explosively. Arms are just hooks — all power comes from the hip snap. Keep lats engaged and core braced.",
      whyItMatters: "Develops explosive hip extension and posterior chain power — the same snap that drives roundhouse and back kicks.",
      alternatives: [
        { name: "Banded Hip Hinge Pull-Through", reason: "Same hip snap pattern using a resistance band anchored low behind you" },
        { name: "Dumbbell Swing", reason: "Identical movement if no kettlebell is available" },
        { name: "Broad Jump", reason: "No equipment — trains explosive hip extension with bodyweight" },
      ],
    },
    da: {
      notes: "Hængsel i hofterne, snap fremad eksplosivt. Armene er bare kroge — al kraft kommer fra hoftesnappet. Hold lats aktiveret og core spændt.",
      whyItMatters: "Udvikler eksplosiv hofteekstension og posterior kæde-kraft — det samme snap der driver rundspark og bagspark.",
      alternatives: [
        { name: "Elastik Hofte-Pull-Through", reason: "Samme hoftesnap-mønster med elastik forankret lavt bag dig" },
        { name: "Håndvægt Swing", reason: "Identisk bevægelse hvis ingen kettlebell er tilgængelig" },
        { name: "Længdespring", reason: "Intet udstyr — træner eksplosiv hofteekstension med kropsvægt" },
      ],
    },
    sv: {
      notes: "Gångjärn i höfterna, snäpp framåt explosivt. Armarna är bara krokar — all kraft kommer från höftsnäppen. Håll lats aktiverade och core spänd.",
      whyItMatters: "Utvecklar explosiv höftextension och posterior kedja-kraft — samma snäpp som driver rundsparkar och baksparkar.",
      alternatives: [
        { name: "Band Höft-Pull-Through", reason: "Samma höftsnäpp-mönster med band förankrat lågt bakom" },
        { name: "Hantelsvingar", reason: "Identisk rörelse om ingen kettlebell finns" },
        { name: "Längdhopp", reason: "Ingen utrustning — tränar explosiv höftextension med kroppsvikt" },
      ],
    },
  },
  boxSquat: {
    id: "box-squat",
    name: "Box Squat",
    category: "strength",
    muscleGroups: ["glutes", "quads", "hamstrings"],
    sets: 4,
    reps: "5-6",
    tempo: "2-1-X-0",
    rest: "2-3 min",
    videoId: "pGsRqxOSgyk",
    en: {
      notes: "Sit back to the box with control, pause briefly, then drive up explosively. Box height at or just below parallel. Teaches proper hip hinge depth.",
      whyItMatters: "Builds concentric-dominant power from a dead stop — mimics exploding from a low stance into a kick or step-in attack.",
      alternatives: [
        { name: "Banded Box Squat", reason: "Add a loop band around knees to increase glute activation and hip stability" },
        { name: "Goblet Squat to Box", reason: "Lighter load variation using a dumbbell or kettlebell" },
        { name: "Bodyweight Box Squat", reason: "No equipment — same pause-and-explode pattern with bodyweight" },
      ],
    },
    da: {
      notes: "Sæt dig tilbage til boksen med kontrol, kort pause, driv derefter eksplosivt op. Bokshøjde ved eller lige under parallel. Lærer korrekt hoftehængsel-dybde.",
      whyItMatters: "Opbygger koncentrisk-dominant kraft fra død start — efterligner eksplosion fra lav stilling til spark eller indskridt.",
      alternatives: [
        { name: "Elastik Box Squat", reason: "Tilføj en loop-elastik rundt om knæene for øget gluteal-aktivering og hoftestabilitet" },
        { name: "Goblet Squat til Boks", reason: "Lettere belastningsvariation med håndvægt eller kettlebell" },
        { name: "Kropsvægt Box Squat", reason: "Intet udstyr — samme pause-og-eksplodér mønster med kropsvægt" },
      ],
    },
    sv: {
      notes: "Sätt dig bak mot boxen med kontroll, kort paus, driv sedan explosivt uppåt. Boxhöjd vid eller strax under parallell. Lär korrekt gångjärndjup.",
      whyItMatters: "Bygger koncentrisk-dominant kraft från dödstart — efterliknar explosion från låg ställning till spark eller inkliv.",
      alternatives: [
        { name: "Band Box Squat", reason: "Lägg till loop-band runt knäna för ökad gluteal-aktivering" },
        { name: "Goblet Squat till Box", reason: "Lättare belastningsvariant med hantel eller kettlebell" },
        { name: "Kroppsvikt Box Squat", reason: "Ingen utrustning — samma paus-och-explodera-mönster med kroppsvikt" },
      ],
    },
  },
  barbellHipThrust: {
    id: "barbell-hip-thrust",
    name: "Barbell Hip Thrust",
    category: "strength",
    muscleGroups: ["glutes", "hamstrings"],
    sets: 4,
    reps: "8-10",
    tempo: "2-1-1-0",
    rest: "2 min",
    videoId: "xDmFkJxPzeM",
    en: {
      notes: "Upper back on bench, drive hips to full extension. Squeeze glutes hard at top for 1 sec. Chin tucked, ribs down. Don't hyperextend the lower back.",
      whyItMatters: "Isolates glute max — the primary engine for powerful kicks, explosive stance changes, and hip extension in jumping.",
      alternatives: [
        { name: "Banded Hip Thrust", reason: "Loop band above knees adds abduction demand — great for home training without a barbell" },
        { name: "Single-Leg Hip Thrust", reason: "Unilateral variation addressing imbalances between kicking and standing leg" },
        { name: "Glute Bridge (floor)", reason: "No bench needed — same hip extension pattern from the ground" },
      ],
    },
    da: {
      notes: "Øvre ryg på bænk, driv hofterne til fuld ekstension. Klem gluteerne hårdt i toppen i 1 sek. Hagen ind, ribben ned. Undgå hyperekstension i lænden.",
      whyItMatters: "Isolerer gluteus maximus — den primære motor for kraftige spark, eksplosive stillingsskift og hofteekstension i spring.",
      alternatives: [
        { name: "Elastik Hip Thrust", reason: "Loop-elastik over knæene tilføjer abduktionskrav — perfekt til hjemmetræning uden vægtstang" },
        { name: "Ét-bens Hip Thrust", reason: "Unilateral variation der adresserer ubalancer mellem spark- og standbenet" },
        { name: "Glutebro (gulv)", reason: "Ingen bænk nødvendig — samme hofteekstension fra gulvet" },
      ],
    },
    sv: {
      notes: "Övre ryggen på bänk, driv höfterna till full extension. Kläm gluteerna hårt i toppen i 1 sek. Hakan in, revben ner. Överextendra inte ländryggen.",
      whyItMatters: "Isolerar gluteus maximus — den primära motorn för kraftfulla sparkar, explosiva ställningsbyten och höftextension i hopp.",
      alternatives: [
        { name: "Band Hip Thrust", reason: "Loop-band ovanför knäna tillför abduktionskrav — utmärkt för hemmaträning utan skivstång" },
        { name: "Enbens Hip Thrust", reason: "Unilateral variation som adresserar obalanser mellan spark- och ståbenet" },
        { name: "Glutebro (golv)", reason: "Ingen bänk behövs — samma höftextension från golvet" },
      ],
    },
  },
  bandedLateralWalk: {
    id: "banded-lateral-walk",
    name: "Banded Lateral Walk",
    category: "strength",
    muscleGroups: ["glutes", "hip-flexors"],
    sets: 3,
    reps: "12-15 each direction",
    rest: "60 sec",
    videoId: "jrEBEisxbGo",
    en: {
      notes: "Mini band above knees or ankles. Stay low in quarter-squat. Push knees out against band tension. Controlled steps — don't let feet snap together.",
      whyItMatters: "Activates glute medius for lateral stability — critical for maintaining balance on the standing leg during kicks.",
      alternatives: [
        { name: "Banded Clamshell", reason: "Easier regression targeting same glute med activation lying on side" },
        { name: "Side-Lying Hip Abduction", reason: "No band needed — targets glute med with bodyweight" },
        { name: "Lateral Lunge", reason: "Dynamic lateral movement without band equipment" },
      ],
    },
    da: {
      notes: "Minielastik over knæ eller ankler. Hold dig lav i kvart-squat. Pres knæene ud mod elastikspændingen. Kontrollerede skridt — lad ikke fødderne klappe sammen.",
      whyItMatters: "Aktiverer gluteus medius for lateral stabilitet — kritisk for at holde balancen på standbenet under spark.",
      alternatives: [
        { name: "Elastik Clamshell", reason: "Lettere regression der rammer samme gluteus medius aktivering på siden" },
        { name: "Sidelæggende Hofteabduktion", reason: "Ingen elastik nødvendig — rammer gluteus medius med kropsvægt" },
        { name: "Lateralt Udfald", reason: "Dynamisk lateral bevægelse uden elastikudstyr" },
      ],
    },
    sv: {
      notes: "Miniband ovanför knäna eller vristerna. Stå lågt i kvartssquat. Pressa knäna ut mot bandspänningen. Kontrollerade steg — låt inte fötterna slå ihop.",
      whyItMatters: "Aktiverar gluteus medius för lateral stabilitet — kritiskt för att hålla balansen på ståbenet under sparkar.",
      alternatives: [
        { name: "Band Clamshell", reason: "Enklare regression som tränar samma gluteus medius på sidan" },
        { name: "Sidoliggande Höftabduktion", reason: "Inget band behövs — tränar gluteus medius med kroppsvikt" },
        { name: "Lateralt Utfall", reason: "Dynamisk lateral rörelse utan bandutrustning" },
      ],
    },
  },
  bandedPullApart: {
    id: "banded-pull-apart",
    name: "Banded Pull-Apart",
    category: "mobility",
    muscleGroups: ["shoulders", "back"],
    sets: 3,
    reps: "15-20",
    rest: "45 sec",
    videoId: "iL1ByD6svas",
    en: {
      notes: "Hold band at shoulder width, arms straight. Pull apart until band touches chest. Squeeze shoulder blades together. Light resistance, high reps.",
      whyItMatters: "Counteracts forward-rounded posture from guard stance. Healthy shoulders allow full-range punching and blocking without impingement.",
      alternatives: [
        { name: "Face Pull (cable)", reason: "Same posterior shoulder and scapular work with cable machine" },
        { name: "Prone Y-T-W Raises", reason: "No band needed — lying face down, lift arms in Y, T, and W patterns" },
        { name: "Band Dislocates", reason: "Full-range shoulder mobility using a light band overhead" },
      ],
    },
    da: {
      notes: "Hold elastikken i skulderbredde, armene strakte. Træk fra hinanden til elastikken rører brystet. Klem skulderbladene sammen. Let modstand, mange gentagelser.",
      whyItMatters: "Modvirker fremadroteret holdning fra gardstilling. Sunde skuldre tillader fuld bevægelsesomfang i slag og blokeringer uden impingement.",
      alternatives: [
        { name: "Face Pull (kabel)", reason: "Samme posteriore skulder- og skapulaarbejde med kabelmaskine" },
        { name: "Liggende Y-T-W Løft", reason: "Ingen elastik nødvendig — liggende på maven, løft armene i Y, T og W mønstre" },
        { name: "Elastik Dislocates", reason: "Fuld skuldermobilitet med let elastik over hovedet" },
      ],
    },
    sv: {
      notes: "Håll bandet i axelbredd, armarna raka. Dra isär tills bandet vidrör bröstet. Kläm ihop skulderbladen. Lätt motstånd, höga reps.",
      whyItMatters: "Motverkar framåtroterad hållning från gardställning. Friska axlar ger fullt rörelseomfång i slag och blockeringar utan impingement.",
      alternatives: [
        { name: "Face Pull (kabel)", reason: "Samma bakre deltoid- och skulderbladsarbete med kabelmaskin" },
        { name: "Liggande Y-T-W Lyft", reason: "Inget band behövs — ligg på magen, lyft armarna i Y, T och W" },
        { name: "Band Dislocates", reason: "Full axelmobilitet med lätt band över huvudet" },
      ],
    },
  },
  bandedGoodMorning: {
    id: "banded-good-morning",
    name: "Banded Good Morning",
    category: "strength",
    muscleGroups: ["hamstrings", "glutes", "back"],
    sets: 3,
    reps: "10-12",
    tempo: "3-0-1-0",
    rest: "60 sec",
    videoId: "vKPGe8zb2S4",
    en: {
      notes: "Stand on band, loop behind neck. Hinge forward with soft knees until hamstrings stretch, then drive hips forward. Keep back neutral throughout.",
      whyItMatters: "Strengthens the posterior chain through a hip hinge — building hamstring resilience for high kicks and protecting against pulls.",
      alternatives: [
        { name: "Romanian Deadlift", reason: "Heavier hip hinge variation with barbell or dumbbells" },
        { name: "Bodyweight Good Morning", reason: "No band — hands behind head, same hinge pattern" },
        { name: "Single-Leg RDL", reason: "Unilateral hip hinge for balance and hamstring strength" },
      ],
    },
    da: {
      notes: "Stå på elastikken, loop bag nakken. Hængsel fremad med bløde knæ til hamstrings strækkes, driv derefter hofterne frem. Hold ryggen neutral hele vejen.",
      whyItMatters: "Styrker den posteriore kæde gennem et hoftehængsel — opbygger hamstringmodstandskraft for høje spark og beskytter mod fibersprængninger.",
      alternatives: [
        { name: "Romanian Deadlift", reason: "Tungere hoftehængsel-variation med vægtstang eller håndvægte" },
        { name: "Kropsvægt Good Morning", reason: "Ingen elastik — hænder bag hovedet, samme hængselmønster" },
        { name: "Ét-bens RDL", reason: "Unilateralt hoftehængsel for balance og hamstringstyrke" },
      ],
    },
    sv: {
      notes: "Stå på bandet, loop bakom nacken. Gångjärn framåt med mjuka knän tills hamstrings sträcks, driv sedan höfterna fram. Håll ryggen neutral hela tiden.",
      whyItMatters: "Stärker den posteriora kedjan genom ett höftgångjärn — bygger hamstringsmotstånds kraft för höga sparkar och skyddar mot sträckningar.",
      alternatives: [
        { name: "Romanian Deadlift", reason: "Tyngre höftgångjärnsvariation med skivstång eller hantlar" },
        { name: "Kroppsvikt Good Morning", reason: "Inget band — händer bakom huvudet, samma gångjärnsmönster" },
        { name: "Enbens RDL", reason: "Unilateralt höftgångjärn för balans och hamstringsstyrka" },
      ],
    },
  },
  bandedSquat: {
    id: "banded-squat",
    name: "Banded Squat",
    category: "strength",
    muscleGroups: ["glutes", "quads", "core"],
    sets: 3,
    reps: "12-15",
    rest: "60 sec",
    videoId: "xVbslraXZBQ",
    en: {
      notes: "Stand on band, hold at shoulders. Push knees out over toes. Full depth with upright torso. Band increases resistance at top where lockout matters.",
      whyItMatters: "Accommodating resistance from the band trains lockout power — the same top-range force used when driving up from a low stance to kick.",
      alternatives: [
        { name: "Goblet Squat", reason: "Similar pattern with a dumbbell or kettlebell instead of band" },
        { name: "Bodyweight Squat", reason: "No equipment needed — high reps for endurance" },
        { name: "Banded Squat with Pulse", reason: "Add 3 pulses at bottom for extra time under tension" },
      ],
    },
    da: {
      notes: "Stå på elastikken, hold ved skuldrene. Pres knæene ud over tæerne. Fuld dybde med oprejst overkrop. Elastikken øger modstanden i toppen hvor lockout er vigtig.",
      whyItMatters: "Akkommoderende modstand fra elastikken træner lockout-kraft — den samme top-range kraft der bruges når man driver op fra lav stilling til spark.",
      alternatives: [
        { name: "Goblet Squat", reason: "Lignende mønster med håndvægt eller kettlebell i stedet for elastik" },
        { name: "Kropsvægt Squat", reason: "Intet udstyr nødvendigt — mange gentagelser for udholdenhed" },
        { name: "Elastik Squat med Puls", reason: "Tilføj 3 pulse i bunden for ekstra tid under spænding" },
      ],
    },
    sv: {
      notes: "Stå på bandet, håll vid axlarna. Pressa knäna ut över tårna. Fullt djup med upprätt bål. Bandet ökar motståndet i toppen där lockout är viktig.",
      whyItMatters: "Ackommoderande motstånd från bandet tränar lockout-kraft — samma top-range kraft som används vid uppdriv från låg ställning till spark.",
      alternatives: [
        { name: "Goblet Squat", reason: "Liknande mönster med hantel eller kettlebell istället för band" },
        { name: "Kroppsvikt Squat", reason: "Ingen utrustning behövs — höga reps för uthållighet" },
        { name: "Band Squat med Puls", reason: "Lägg till 3 pulser i botten för extra tid under spänning" },
      ],
    },
  },
  singleLegRDL: {
    id: "single-leg-rdl",
    name: "Single-Leg Romanian Deadlift",
    category: "strength",
    muscleGroups: ["hamstrings", "glutes", "core"],
    sets: 3,
    reps: "8 each leg",
    tempo: "3-0-1-0",
    rest: "90 sec",
    videoId: "BPGpT3MocNQ",
    en: {
      notes: "Hold dumbbell in opposite hand. Hinge at hip, keep back flat. Free leg extends behind you. Control the descent — don't rush.",
      whyItMatters: "Builds single-leg balance and hamstring strength — essential for stable kicking base and preventing hamstring pulls during high kicks.",
      alternatives: [
        { name: "Bodyweight Single-Leg RDL", reason: "No equipment — same balance and hinge pattern" },
        { name: "Banded Single-Leg RDL", reason: "Loop band under foot for resistance without dumbbells" },
      ],
    },
    da: {
      notes: "Hold håndvægt i modsatte hånd. Hængsel i hoften, hold ryggen flad. Frit ben strækkes bagud. Kontrollér nedsænkningen — skynd dig ikke.",
      whyItMatters: "Opbygger ét-bens balance og hamstringstyrke — essentielt for stabil sparkebase og forebyggelse af hamstringskader under høje spark.",
      alternatives: [
        { name: "Kropsvægt Ét-bens RDL", reason: "Intet udstyr — samme balance og hængselmønster" },
        { name: "Elastik Ét-bens RDL", reason: "Loop-elastik under foden for modstand uden håndvægte" },
      ],
    },
    sv: {
      notes: "Håll hantel i motsatta handen. Gångjärn i höften, håll ryggen platt. Fria benet sträcks bakåt. Kontrollera nedsänkningen — stressa inte.",
      whyItMatters: "Bygger enbens-balans och hamstringsstyrka — essentiellt för stabil sparkbas och för att förebygga hamstringsskador vid höga sparkar.",
      alternatives: [
        { name: "Kroppsvikt Enbens RDL", reason: "Ingen utrustning — samma balans- och gångjärnsmönster" },
        { name: "Band Enbens RDL", reason: "Loop-band under foten för motstånd utan hantlar" },
      ],
    },
  },
  lateralBoundHold: {
    id: "lateral-bound-hold",
    name: "Lateral Bound with Stick",
    category: "plyometric",
    muscleGroups: ["glutes", "quads", "calves"],
    sets: 3,
    reps: "5 each side",
    rest: "90 sec",
    videoId: "dRU1sy4Xyyg",
    en: {
      notes: "Leap sideways, land on one leg and STICK the landing for 2 sec. No wobble. Emphasize control and absorption.",
      whyItMatters: "Develops lateral power and single-leg stability — critical for explosive angle changes and maintaining balance after kicks.",
      alternatives: [
        { name: "Lateral Shuffle to Sprint", reason: "Dynamic lateral movement without jump demands" },
        { name: "Skater Jumps", reason: "Similar lateral plyometric with continuous rhythm" },
      ],
    },
    da: {
      notes: "Spring sidelæns, land på ét ben og HOLD landingen i 2 sek. Ingen vaklen. Fremhæv kontrol og absorption.",
      whyItMatters: "Udvikler lateral kraft og ét-bens stabilitet — kritisk for eksplosive vinkelændringer og opretholdelse af balance efter spark.",
      alternatives: [
        { name: "Lateral Shuffle til Sprint", reason: "Dynamisk lateral bevægelse uden springkrav" },
        { name: "Skater Jumps", reason: "Lignende lateral plyometrisk øvelse med kontinuerlig rytme" },
      ],
    },
    sv: {
      notes: "Hoppa åt sidan, landa på ett ben och HÅLL landningen i 2 sek. Ingen vackling. Betona kontroll och absorption.",
      whyItMatters: "Utvecklar lateral kraft och enbens-stabilitet — kritiskt för explosiva vinkeländringar och att hålla balansen efter sparkar.",
      alternatives: [
        { name: "Lateral Shuffle till Sprint", reason: "Dynamisk lateral rörelse utan hoppkrav" },
        { name: "Skater Jumps", reason: "Liknande lateral plyometrisk övning med kontinuerlig rytm" },
      ],
    },
  },
  plankShouderTap: {
    id: "plank-shoulder-tap",
    name: "Plank Shoulder Tap",
    category: "strength",
    muscleGroups: ["core", "shoulders"],
    sets: 3,
    reps: "10 each side",
    rest: "60 sec",
    videoId: "LEZq7QU9Wew",
    en: {
      notes: "From push-up position, tap opposite shoulder without rotating hips. Anti-rotation under bodyweight. Keep feet wider for easier balance.",
      whyItMatters: "Trains anti-rotation stability under dynamic load — the same demand as throwing a kick while keeping guard up.",
      alternatives: [
        { name: "Dead Bug", reason: "Supine anti-rotation core work with less shoulder demand" },
        { name: "Bear Crawl Hold", reason: "Isometric core + shoulder stability from quadruped" },
      ],
    },
    da: {
      notes: "Fra armstrækningsposition, tap modsatte skulder uden at rotere hofterne. Anti-rotation under kropsvægt. Hold fødderne bredere for nemmere balance.",
      whyItMatters: "Træner anti-rotationsstabilitet under dynamisk belastning — samme krav som at sparke mens man holder garden.",
      alternatives: [
        { name: "Dead Bug", reason: "Rygleje anti-rotation corearbejde med mindre skulderkrav" },
        { name: "Bear Crawl Hold", reason: "Isometrisk core + skulderstabilitet fra firbenet stilling" },
      ],
    },
    sv: {
      notes: "Från armhävningsposition, slå på motsatta axeln utan att rotera höfterna. Anti-rotation under kroppsvikt. Håll fötterna bredare för enklare balans.",
      whyItMatters: "Tränar anti-rotationsstabilitet under dynamisk belastning — samma krav som att sparka medan man håller garden uppe.",
      alternatives: [
        { name: "Dead Bug", reason: "Ryggläge anti-rotations core-arbete med mindre axelkrav" },
        { name: "Bear Crawl Hold", reason: "Isometrisk core- + axelstabilitet från fyrfotsställning" },
      ],
    },
  },
  calfRaiseEccentric: {
    id: "eccentric-calf-raise",
    name: "Eccentric Single-Leg Calf Raise",
    category: "strength",
    muscleGroups: ["calves"],
    sets: 3,
    reps: "10 each leg",
    tempo: "1-0-5-0",
    rest: "60 sec",
    videoId: "yKFaGDog_oA",
    en: {
      notes: "Rise on two legs, lower on one over 5 seconds. Full range — stretch at the bottom. Essential for Achilles tendon health.",
      whyItMatters: "Bulletproofs the Achilles tendon and develops calf resilience for all the jumping, bouncing, and pivoting in TKD.",
      alternatives: [
        { name: "Double-Leg Slow Calf Raise", reason: "Easier regression with same eccentric emphasis" },
        { name: "Banded Calf Raise", reason: "Add band resistance around forefoot for extra load at home" },
      ],
    },
    da: {
      notes: "Hæv på to ben, sænk på ét over 5 sekunder. Fuldt bevægelsesomfang — stræk i bunden. Essentielt for akillessenens sundhed.",
      whyItMatters: "Beskytter akillessenen og udvikler lægmodstandskraft for alle spring, hop og pivotering i TKD.",
      alternatives: [
        { name: "To-bens Langsom Hæve", reason: "Lettere regression med samme excentriske fokus" },
        { name: "Elastik Hævning", reason: "Tilføj elastikmodstand rundt forfoden for ekstra belastning hjemme" },
      ],
    },
    sv: {
      notes: "Höj på två ben, sänk på ett under 5 sekunder. Fullt omfång — sträck i botten. Essentiellt för hälsenans hälsa.",
      whyItMatters: "Skyddar hälsenan och utvecklar vadmotstånds kraft för alla hopp, studs och pivoteringar i TKD.",
      alternatives: [
        { name: "Tvåbens Långsam Vadhöjning", reason: "Enklare regression med samma excentriska fokus" },
        { name: "Band Vadhöjning", reason: "Lägg till bandmotstånd runt framfoten för extra belastning hemma" },
      ],
    },
  },
  turkishGetUp: {
    id: "turkish-get-up",
    name: "Turkish Get-Up",
    category: "strength",
    muscleGroups: ["core", "shoulders", "glutes", "hip-flexors"],
    sets: 2,
    reps: "3 each side",
    rest: "90 sec",
    videoId: "0bWRPC49-KI",
    en: {
      notes: "Slow and deliberate — each phase is a position. Keep eyes on the weight. This is a full-body integration exercise, not a strength grind.",
      whyItMatters: "Integrates shoulder stability, hip mobility, and core control through multiple planes — mirrors the multi-positional demands of TKD.",
      alternatives: [
        { name: "Half Get-Up", reason: "Partial range version — just to the seated position and back down" },
        { name: "Bodyweight Get-Up", reason: "No weight — practice the pattern before adding load" },
      ],
    },
    da: {
      notes: "Langsomt og bevidst — hver fase er en position. Hold øjnene på vægten. Dette er en helkropsintegration, ikke en styrkeøvelse.",
      whyItMatters: "Integrerer skulderstabilitet, hoftemobilitet og corekontrol gennem flere planer — spejler de multi-positionelle krav i TKD.",
      alternatives: [
        { name: "Halv Get-Up", reason: "Delvis bevægelse — kun til siddende position og tilbage" },
        { name: "Kropsvægt Get-Up", reason: "Ingen vægt — øv mønsteret før belastning tilføjes" },
      ],
    },
    sv: {
      notes: "Långsamt och medvetet — varje fas är en position. Håll blicken på vikten. Detta är en helkroppsintegration, inte ett styrkepass.",
      whyItMatters: "Integrerar axelstabilitet, höftmobilitet och core-kontroll genom flera plan — speglar de multipositionella kraven i TKD.",
      alternatives: [
        { name: "Halv Get-Up", reason: "Delvis rörelse — bara till sittande position och tillbaka" },
        { name: "Kroppsvikt Get-Up", reason: "Ingen vikt — öva mönstret innan belastning läggs till" },
      ],
    },
  },
  jumpLunge: {
    id: "jump-lunge",
    name: "Jump Lunge (Alternating)",
    category: "plyometric",
    muscleGroups: ["glutes", "quads", "hip-flexors"],
    sets: 3,
    reps: "6 each leg",
    rest: "90 sec",
    videoId: "y7Iug7V20lU",
    en: {
      notes: "Explode upward from lunge, switch legs mid-air, land softly. Focus on height and control, not speed. Keep torso upright throughout.",
      whyItMatters: "Develops reactive single-leg power and rapid stance switching — directly transfers to fast footwork transitions in sparring.",
      alternatives: [
        { name: "Reverse Lunge to Knee Drive", reason: "Lower impact unilateral plyometric without jumping" },
        { name: "Split Squat Jump (same leg)", reason: "Focus power on one leg at a time" },
      ],
    },
    da: {
      notes: "Eksplodér opad fra udfald, skift ben i luften, land blødt. Fokus på højde og kontrol, ikke hastighed. Hold overkroppen oprejst hele vejen.",
      whyItMatters: "Udvikler reaktiv ét-bens kraft og hurtige stillingsskift — overføres direkte til hurtige fodskift i sparring.",
      alternatives: [
        { name: "Reverse Lunge til Knædrivning", reason: "Lavere belastning unilateral plyometrisk uden spring" },
        { name: "Split Squat Jump (samme ben)", reason: "Fokusér kraft på ét ben ad gangen" },
      ],
    },
    sv: {
      notes: "Explodera uppåt från utfall, byt ben i luften, landa mjukt. Fokus på höjd och kontroll, inte hastighet. Håll bålen upprätt hela tiden.",
      whyItMatters: "Utvecklar reaktiv enbens-kraft och snabba ställningsbyten — överförs direkt till snabba fotarbetsövergångar i sparring.",
      alternatives: [
        { name: "Reverse Lunge till Knädrivning", reason: "Lägre belastning, unilateral plyometrisk utan hopp" },
        { name: "Split Squat Jump (samma ben)", reason: "Fokusera kraften på ett ben i taget" },
      ],
    },
  },
  facePull: {
    id: "face-pull",
    name: "Face Pull",
    category: "mobility",
    muscleGroups: ["shoulders", "back"],
    sets: 3,
    reps: "15-20",
    rest: "45 sec",
    videoId: "rep-qVOkqgk",
    en: {
      notes: "Cable or band at face height. Pull to face with external rotation at end. Elbows high, squeeze rear delts. Light load, focus on contraction.",
      whyItMatters: "Corrects forward shoulder posture from guard stance and builds scapular stability for healthy punching and blocking.",
      alternatives: [
        { name: "Band Pull-Apart", reason: "Similar rear delt work with simpler setup" },
        { name: "Prone Y-Raise", reason: "No equipment — lying face-down shoulder retraction drill" },
      ],
    },
    da: {
      notes: "Kabel eller elastik i ansigtshøjde. Træk til ansigt med udadrotation i slutningen. Albuer højt, klem bagre deltoider. Let belastning, fokus på kontraktion.",
      whyItMatters: "Korrigerer fremadroteret skulderholdning fra gardstilling og opbygger skapulær stabilitet for sunde slag og blokeringer.",
      alternatives: [
        { name: "Elastik Pull-Apart", reason: "Lignende bagre deltoidarbejde med enklere opsætning" },
        { name: "Liggende Y-Løft", reason: "Intet udstyr — liggende skulderretraktionsøvelse" },
      ],
    },
    sv: {
      notes: "Kabel eller band i ansiktshöjd. Dra till ansiktet med utåtrotation i slutet. Armbågarna högt, kläm bakre deltoider. Lätt belastning, fokus på kontraktion.",
      whyItMatters: "Korrigerar framåtroterad axelhållning från gardställning och bygger skulderblads-stabilitet för sunda slag och blockeringar.",
      alternatives: [
        { name: "Band Pull-Apart", reason: "Liknande bakre deltoidarbete med enklare uppställning" },
        { name: "Liggande Y-Lyft", reason: "Ingen utrustning — liggande skulderretraktionsövning" },
      ],
    },
  },
  gobletSquat: {
    id: "goblet-squat",
    name: "Goblet Squat",
    category: "strength",
    muscleGroups: ["quads", "glutes", "core"],
    sets: 3,
    reps: "10-12",
    tempo: "3-1-1-0",
    rest: "90 sec",
    videoId: "MeIiIdhvXT4",
    en: {
      notes: "Hold KB or DB at chest. Sit deep between heels, elbows inside knees. Pause at bottom. Great for learning squat mechanics and building baseline strength.",
      whyItMatters: "Builds foundational squat strength with an upright torso — perfect for athletes who need lower body strength without heavy barbell loading.",
      alternatives: [
        { name: "Bodyweight Squat", reason: "No equipment — same depth and pattern" },
        { name: "Banded Squat", reason: "Band resistance for home training without weights" },
      ],
    },
    da: {
      notes: "Hold KB eller håndvægt ved brystet. Sæt dig dybt mellem hælene, albuer inden for knæene. Pause i bunden. Fantastisk til at lære squat-mekanik og opbygge grundstyrke.",
      whyItMatters: "Opbygger grundlæggende squat-styrke med oprejst overkrop — perfekt til atleter der har brug for underkropsstyrke uden tung vægtstangsbelastning.",
      alternatives: [
        { name: "Kropsvægt Squat", reason: "Intet udstyr — samme dybde og mønster" },
        { name: "Elastik Squat", reason: "Elastikmodstand til hjemmetræning uden vægte" },
      ],
    },
    sv: {
      notes: "Håll KB eller hantel vid bröstet. Sätt dig djupt mellan hälarna, armbågar innanför knäna. Pausa i botten. Utmärkt för att lära squat-mekanik och bygga grundstyrka.",
      whyItMatters: "Bygger grundläggande squat-styrka med upprätt bål — perfekt för idrottare som behöver underkroppsstyrka utan tung skivstångsbelastning.",
      alternatives: [
        { name: "Kroppsvikt Squat", reason: "Ingen utrustning — samma djup och mönster" },
        { name: "Band Squat", reason: "Bandmotstånd för hemmaträning utan vikter" },
      ],
    },
  },
  thoracicRotation: {
    id: "thoracic-rotation",
    name: "Seated Thoracic Rotation",
    category: "mobility",
    muscleGroups: ["core", "back"],
    sets: 2,
    reps: "8 each side",
    rest: "None",
    videoId: "XGPpKMiMuHo",
    en: {
      notes: "Sit cross-legged or on bench. Hands behind head. Rotate upper body to one side, hold 2 sec. Keep hips locked — only thoracic spine moves.",
      whyItMatters: "Thoracic rotation is the foundation of every rotational kick and punch. Limited t-spine mobility forces compensation from the lower back.",
      alternatives: [
        { name: "Open Book Stretch", reason: "Lying rotation for t-spine with less setup" },
        { name: "Thread the Needle", reason: "Quadruped thoracic rotation with shoulder involvement" },
      ],
    },
    da: {
      notes: "Sid krydsbenede eller på bænk. Hænder bag hovedet. Rotér overkroppen til én side, hold 2 sek. Hold hofterne låste — kun brysthvirvelsøjlen bevæger sig.",
      whyItMatters: "Thorakal rotation er fundamentet for hvert rotationsspark og slag. Begrænset t-spine mobilitet tvinger kompensation fra lænden.",
      alternatives: [
        { name: "Open Book Stræk", reason: "Liggende rotation for t-spine med mindre opsætning" },
        { name: "Thread the Needle", reason: "Firbenet thorakal rotation med skulderinvolvering" },
      ],
    },
    sv: {
      notes: "Sitt med korslagda ben eller på bänk. Händer bakom huvudet. Rotera överkroppen åt en sida, håll 2 sek. Håll höfterna låsta — bara bröstryggen rör sig.",
      whyItMatters: "Bröstryggrotation är grunden för varje rotationsspark och slag. Begränsad t-spine-mobilitet tvingar kompensation från ländryggen.",
      alternatives: [
        { name: "Open Book Stretch", reason: "Liggande rotation för t-spine med enklare uppställning" },
        { name: "Thread the Needle", reason: "Fyrfotsställning bröstryggrotation med axelinblandning" },
      ],
    },
  },
  pistolSquatNegative: {
    id: "pistol-squat-negative",
    name: "Pistol Squat Negative",
    category: "strength",
    muscleGroups: ["quads", "glutes", "core"],
    sets: 3,
    reps: "4-5 each leg",
    tempo: "5 sec eccentric",
    rest: "90 sec",
    videoId: "t7Oj8-E3_PY",
    en: {
      notes: "Stand on one leg, lower yourself as slowly as possible (5 sec) to seated on a box or bench. Use both legs to stand back up. Progress to full pistols over time.",
      whyItMatters: "Builds extreme single-leg eccentric strength and control — directly improves kicking leg stability and landing mechanics.",
      alternatives: [
        { name: "Assisted Pistol Squat", reason: "Hold a band or post for support through full range" },
        { name: "Step-Down", reason: "Similar single-leg eccentric from a step or box" },
      ],
    },
    da: {
      notes: "Stå på ét ben, sænk dig så langsomt som muligt (5 sek) til siddende på boks eller bænk. Brug begge ben til at rejse dig. Progrediér til fulde pistols over tid.",
      whyItMatters: "Opbygger ekstrem ét-bens excentrisk styrke og kontrol — forbedrer direkte sparkbenets stabilitet og landingsmekanik.",
      alternatives: [
        { name: "Assisteret Pistol Squat", reason: "Hold en elastik eller stolpe for støtte gennem fuld range" },
        { name: "Step-Down", reason: "Lignende ét-bens excentrisk fra et trin eller boks" },
      ],
    },
    sv: {
      notes: "Stå på ett ben, sänk dig så långsamt som möjligt (5 sek) till sittande på box eller bänk. Använd båda benen för att resa dig. Progredirera till fulla pistols över tid.",
      whyItMatters: "Bygger extrem enbens excentrisk styrka och kontroll — förbättrar direkt sparkbenets stabilitet och landningsmekanik.",
      alternatives: [
        { name: "Assisterad Pistol Squat", reason: "Håll ett band eller stolpe för stöd genom fullt omfång" },
        { name: "Step-Down", reason: "Liknande enbens excentrik från ett steg eller box" },
      ],
    },
  },

  // === CUT KICK / HIP STRENGTH EXERCISES ===

  standingHipAdduction: {
    id: "standing-hip-adduction",
    name: "Standing Cable Hip Adduction",
    category: "strength",
    muscleGroups: ["hip-flexors", "glutes", "core"],
    sets: 3,
    reps: "12-15 each leg",
    tempo: "2-1-2-0",
    rest: "60 sec",
    videoId: "1LjVJfFtZ5A",
    en: {
      notes: "Stand tall on the support leg. Drive the working leg across the body with control. Squeeze at the end range. Keep hips square — no leaning.",
      whyItMatters: "The cut kick (naeryo chagi) requires powerful hip adduction to drive the leg downward through the target. This exercise directly strengthens that pulling motion.",
      alternatives: [
        { name: "Side-Lying Hip Adduction", reason: "No cable needed — gravity provides resistance lying on your side" },
        { name: "Banded Hip Adduction", reason: "Portable alternative using a resistance band anchored low" },
      ],
    },
    da: {
      notes: "Stå oprejst på støttebenet. Træk arbejdsbenet hen over kroppen med kontrol. Klem i slutpositionen. Hold hofterne lige — ingen hældning.",
      whyItMatters: "Cut-sparket (naeryo chagi) kræver kraftig hofteadduktion for at drive benet nedad gennem målet. Denne øvelse styrker direkte den trækkende bevægelse.",
      alternatives: [
        { name: "Sidelæggende hofteadduktion", reason: "Intet kabel nødvendigt — tyngdekraften giver modstand liggende på siden" },
        { name: "Elastik hofteadduktion", reason: "Bærbart alternativ med elastik forankret lavt" },
      ],
    },
    sv: {
      notes: "Stå upprätt på stödbenet. Driv arbetsbenet tvärs över kroppen med kontroll. Kläm i ytterläget. Håll höfterna raka — ingen lutning.",
      whyItMatters: "Cut-sparken (naeryo chagi) kräver kraftig höftadduktion för att driva benet nedåt genom målet. Denna övning stärker direkt den dragande rörelsen.",
      alternatives: [
        { name: "Sidoliggande höftadduktion", reason: "Ingen kabel behövs — tyngdkraften ger motstånd liggande på sidan" },
        { name: "Band höftadduktion", reason: "Portabelt alternativ med band förankrat lågt" },
      ],
    },
  },

  weightedHipFlexorRaise: {
    id: "weighted-hip-flexor-raise",
    name: "Weighted Standing Knee Drive",
    category: "strength",
    muscleGroups: ["hip-flexors", "core", "quads"],
    sets: 4,
    reps: "8-10 each leg",
    tempo: "1-1-2-0",
    rest: "90 sec",
    videoId: "L8fvypPrzzs",
    en: {
      notes: "Strap ankle weight or use cable. Drive knee up explosively to chest height, then lower with a slow 2-second eccentric. Stand tall — no trunk lean.",
      whyItMatters: "The initial lift of the cut kick demands explosive hip flexion strength. Heavy knee drives build the raw force to raise the leg high before the downward cut.",
      alternatives: [
        { name: "Banded Marching", reason: "Lighter resistance — good for warm-up or high reps" },
        { name: "Hanging Knee Raise", reason: "Trains hip flexors with core engagement in a suspended position" },
      ],
    },
    da: {
      notes: "Brug ankelvægt eller kabel. Driv knæet eksplosivt op til brysthøjde, sænk derefter med langsom 2-sekunders excentrisk. Stå oprejst — ingen overkropshældning.",
      whyItMatters: "Det indledende løft af cut-sparket kræver eksplosiv hoftefleksionsstyrke. Tunge knæløft opbygger rå kraft til at løfte benet højt før det nedadgående snit.",
      alternatives: [
        { name: "Elastik march", reason: "Lettere modstand — god til opvarmning eller mange gentagelser" },
        { name: "Hængende knæløft", reason: "Træner hoftefleksorer med core-engagement i hængende position" },
      ],
    },
    sv: {
      notes: "Använd ankelvikt eller kabel. Driv knäet explosivt upp till brösthöjd, sänk sedan med långsam 2-sekunders excentrik. Stå upprätt — ingen bållutning.",
      whyItMatters: "Det inledande lyftet i cut-sparken kräver explosiv höftflexionsstyrka. Tunga knälyft bygger rå kraft att lyfta benet högt före det nedåtgående snittet.",
      alternatives: [
        { name: "Band Marsch", reason: "Lättare motstånd — bra för uppvärmning eller höga reps" },
        { name: "Hängande Knälyft", reason: "Tränar höftflexorer med core-engagemang i hängande position" },
      ],
    },
  },

  lateralLungeWithPause: {
    id: "lateral-lunge-with-pause",
    name: "Lateral Lunge with 2s Pause",
    category: "strength",
    muscleGroups: ["glutes", "quads", "hip-flexors", "hamstrings"],
    sets: 3,
    reps: "6-8 each side",
    tempo: "2-2-1-0",
    rest: "90 sec",
    videoId: "gwWv7aPcD88",
    en: {
      notes: "Step wide laterally, sit deep into the hip with a 2-second pause at the bottom. Push back explosively. Keep the trailing leg straight. Chest up.",
      whyItMatters: "The cut kick requires lateral hip stability and adductor strength to control the leg in the frontal plane. Lateral lunges build both under load.",
      alternatives: [
        { name: "Cossack Squat", reason: "Deeper lateral hip mobility with similar adductor loading" },
        { name: "Slider Lateral Lunge", reason: "Adds instability for greater hip stabilizer recruitment" },
      ],
    },
    da: {
      notes: "Træd bredt til siden, sæt dig dybt ned i hoften med 2-sekunders pause i bunden. Skub eksplosivt tilbage. Hold det bageste ben strakt. Bryst op.",
      whyItMatters: "Cut-sparket kræver lateral hoftestabilitet og adduktorstyrke for at kontrollere benet i frontalplanet. Laterale lunges opbygger begge dele under belastning.",
      alternatives: [
        { name: "Cossack Squat", reason: "Dybere lateral hoftemobilitet med lignende adduktorbelastning" },
        { name: "Slider lateral lunge", reason: "Tilføjer ustabilitet for større hoftestabilisator-rekruttering" },
      ],
    },
    sv: {
      notes: "Kliv brett åt sidan, sjunk djupt ner i höften med 2-sekunders paus i botten. Tryck tillbaka explosivt. Håll det bakre benet rakt. Bröst upp.",
      whyItMatters: "Cut-sparken kräver lateral höftstabilitet och adduktorstyrka för att kontrollera benet i frontalplanet. Laterala utfall bygger båda under belastning.",
      alternatives: [
        { name: "Cossack Squat", reason: "Djupare lateral höftmobilitet med liknande adduktorbelastning" },
        { name: "Slider Lateralt Utfall", reason: "Tillför instabilitet för större höftstabilisator-rekrytering" },
      ],
    },
  },

  singleLegRDLHipControl: {
    id: "single-leg-rdl-hip-control",
    name: "Single-Leg RDL (Hip Control Focus)",
    category: "strength",
    muscleGroups: ["hamstrings", "glutes", "core", "hip-flexors"],
    sets: 3,
    reps: "8-10 each leg",
    tempo: "3-1-1-0",
    rest: "90 sec",
    videoId: "59i0MtDQxss",
    en: {
      notes: "Hinge at the hip on one leg with a slow 3-second eccentric. Keep hips level — no rotation. Squeeze the glute at the top. Use dumbbell or kettlebell.",
      whyItMatters: "Single-leg hip hinge control translates directly to the standing leg stability needed during the cut kick. The slow eccentric builds resilient hamstrings and hip control.",
      alternatives: [
        { name: "Kickstand RDL", reason: "Partially supported — good stepping stone to full single-leg" },
        { name: "Band-Assisted Single-Leg RDL", reason: "Provides balance assistance while building the pattern" },
      ],
    },
    da: {
      notes: "Hængsel i hoften på ét ben med langsom 3-sekunders excentrisk. Hold hofterne i niveau — ingen rotation. Klem balderne i toppen. Brug håndvægt eller kettlebell.",
      whyItMatters: "Ét-bens hoftehængsel-kontrol oversættes direkte til standbenstabiliteten der er nødvendig under cut-sparket. Den langsomme excentriske fase opbygger modstandsdygtige hamstrings og hoftekontrol.",
      alternatives: [
        { name: "Kickstand RDL", reason: "Delvist støttet — godt trin mod fuld ét-bens" },
        { name: "Elastik-assisteret ét-bens RDL", reason: "Giver balancestøtte mens mønsteret opbygges" },
      ],
    },
    sv: {
      notes: "Gångjärn i höften på ett ben med långsam 3-sekunders excentrik. Håll höfterna i nivå — ingen rotation. Kläm gluteus i toppen. Använd hantel eller kettlebell.",
      whyItMatters: "Enbens höftgångjärnskontroll överförs direkt till ståbensstabiliteten som behövs under cut-sparken. Den långsamma excentriska fasen bygger motståndskraftiga hamstrings och höftkontroll.",
      alternatives: [
        { name: "Kickstand RDL", reason: "Delvis stödd — bra mellansteg mot full enbens-övning" },
        { name: "Bandassisterad Enbens RDL", reason: "Ger balansstöd medan mönstret byggs upp" },
      ],
    },
  },

  hipAirplanes: {
    id: "hip-airplanes",
    name: "Hip Airplanes",
    category: "mobility",
    muscleGroups: ["glutes", "hip-flexors", "core"],
    sets: 3,
    reps: "6-8 each side",
    rest: "60 sec",
    videoId: "yB-AxXUFl_Q",
    en: {
      notes: "Stand on one leg, hinge forward slightly. Rotate the pelvis open (external rotation) then closed (internal rotation) in a controlled manner. Keep the standing knee slightly bent.",
      whyItMatters: "Cut kicks require full rotational control of the hip joint. Hip airplanes build dynamic stability through the entire range of hip internal and external rotation under load.",
      alternatives: [
        { name: "Standing Hip CARs", reason: "Similar rotational hip mobility in a standing position" },
        { name: "90/90 Hip Switches", reason: "Floor-based hip rotation drill for similar range of motion" },
      ],
    },
    da: {
      notes: "Stå på ét ben, hængsel let fremad. Rotér bækkenet åbent (ekstern rotation) derefter lukket (intern rotation) kontrolleret. Hold standknæet let bøjet.",
      whyItMatters: "Cut-spark kræver fuld rotationskontrol af hofteleddet. Hip airplanes opbygger dynamisk stabilitet gennem hele rækken af hoftens interne og eksterne rotation under belastning.",
      alternatives: [
        { name: "Stående hofte-CARs", reason: "Lignende roterende hoftemobilitet i stående position" },
        { name: "90/90 hofte-skift", reason: "Gulvbaseret hofterotationsøvelse for lignende bevægelsesomfang" },
      ],
    },
    sv: {
      notes: "Stå på ett ben, gångjärn lätt framåt. Rotera bäckenet öppet (extern rotation) sedan stängt (intern rotation) kontrollerat. Håll ståknäet lätt böjt.",
      whyItMatters: "Cut-sparkar kräver full rotationskontroll av höftleden. Hip airplanes bygger dynamisk stabilitet genom hela omfånget av höftens interna och externa rotation under belastning.",
      alternatives: [
        { name: "Stående Höft-CARs", reason: "Liknande roterande höftmobilitet i stående position" },
        { name: "90/90 Höftväxlingar", reason: "Golvbaserad höftrotationsövning för liknande rörelseomfång" },
      ],
    },
  },

  isometricCutKickHold: {
    id: "isometric-cut-kick-hold",
    name: "Isometric Cut Kick Hold",
    category: "strength",
    muscleGroups: ["hip-flexors", "quads", "core", "glutes"],
    sets: 4,
    reps: "20-30 sec each leg",
    rest: "60 sec",
    videoId: "bUy3dSDBkOQ",
    en: {
      notes: "Raise the leg to full cut kick height (above head if possible). Hold the position with control — no swinging. Use a wall for light balance support initially. Focus on hip flexor engagement.",
      whyItMatters: "Isometric holds at end-range build the specific strength and endurance to maintain the leg at peak height during the cut kick. This is the most sport-specific exercise for naeryo chagi.",
      alternatives: [
        { name: "Wall-Assisted Leg Hold", reason: "Use a wall to help hold the leg at height while building strength" },
        { name: "Banded Leg Raise & Hold", reason: "Band assists the hold while still training hip flexor endurance" },
      ],
    },
    da: {
      notes: "Løft benet til fuld cut-spark højde (over hovedet hvis muligt). Hold positionen med kontrol — ingen svingning. Brug en væg til let balancestøtte i starten. Fokusér på hoftefleksor-engagement.",
      whyItMatters: "Isometriske holds i slutposition opbygger den specifikke styrke og udholdenhed til at holde benet i tophøjde under cut-sparket. Dette er den mest sportsspecifikke øvelse for naeryo chagi.",
      alternatives: [
        { name: "Vægstøttet benhold", reason: "Brug en væg til at hjælpe med at holde benet i højden mens styrken opbygges" },
        { name: "Elastik benløft & hold", reason: "Elastikken assisterer holdet mens hoftefleksor-udholdenhed stadig trænes" },
      ],
    },
    sv: {
      notes: "Lyft benet till full cut-spark-höjd (ovanför huvudet om möjligt). Håll positionen med kontroll — ingen svängning. Använd en vägg för lätt balansstöd initialt. Fokusera på höftflexorengagemang.",
      whyItMatters: "Isometriska håll i ytterposition bygger den specifika styrkan och uthålligheten att hålla benet på tophöjd under cut-sparken. Detta är den mest sportspecifika övningen för naeryo chagi.",
      alternatives: [
        { name: "Väggassisterat Benhåll", reason: "Använd en vägg för att hålla benet i höjd medan styrkan byggs" },
        { name: "Band Benlyft & Håll", reason: "Bandet assisterar hållet medan höftflexor-uthållighet fortfarande tränas" },
      ],
    },
  },
};

type Locale = "en" | "da" | "sv";

function resolveExercise(base: ExerciseBase, locale: Locale): Exercise {
  const effectiveLocale = (locale === "sv" ? "en" : locale) as "en" | "da";
  const localized = base[effectiveLocale] || base.en;
  return {
    id: base.id,
    name: base.name,
    category: base.category,
    muscleGroups: base.muscleGroups,
    sets: base.sets,
    reps: base.reps,
    tempo: base.tempo,
    rest: base.rest,
    videoId: base.videoId,
    notes: localized.notes,
    whyItMatters: localized.whyItMatters,
    alternatives: localized.alternatives,
  };
}

let currentLocale: Locale = "en";

export function setExerciseLocale(locale: Locale) {
  currentLocale = locale;
}

function getExercises(): Record<string, Exercise> {
  const result: Record<string, Exercise> = {};
  for (const [key, base] of Object.entries(exercisesData)) {
    result[key] = resolveExercise(base, currentLocale);
  }
  return result;
}

export const EXERCISES = new Proxy({} as Record<string, Exercise>, {
  get(_, key: string) {
    if (exercisesData[key]) return resolveExercise(exercisesData[key], currentLocale);
    return undefined;
  },
  ownKeys() {
    return Object.keys(exercisesData);
  },
  getOwnPropertyDescriptor(_, key: string) {
    if (key in exercisesData) {
      return { configurable: true, enumerable: true, value: resolveExercise(exercisesData[key as string], currentLocale) };
    }
    return undefined;
  },
});

export function getWeeklyPlan(locale: Locale = currentLocale): TrainingDay[] {
  const ex = getExercises();
  const dayLabels = locale === "da" 
    ? { monday: "Mandag", tuesday: "Tirsdag", wednesday: "Onsdag", thursday: "Torsdag", friday: "Fredag", saturday: "Lørdag", sunday: "Søndag" }
    : locale === "sv"
    ? { monday: "Måndag", tuesday: "Tisdag", wednesday: "Onsdag", thursday: "Torsdag", friday: "Fredag", saturday: "Lördag", sunday: "Söndag" }
    : { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };

  return [
    { id: "monday", dayOfWeek: dayLabels.monday, label: locale === "da" ? "TKD Teknik" : locale === "sv" ? "TKD Teknik" : "TKD Technical", type: "tkd", focus: locale === "da" ? "Poomsae / Teknisk træning" : locale === "sv" ? "Poomsae / Teknisk träning" : "Poomsae / Technical Drilling", exercises: [] },
    { id: "tuesday", dayOfWeek: dayLabels.tuesday, label: locale === "da" ? "Kraft & Eksplosivitet" : locale === "sv" ? "Kraft & Explosivitet" : "Power & Explosiveness", type: "gym", focus: locale === "da" ? "Underkroppskraft + Plyometrik" : locale === "sv" ? "Underkroppskraft + Plyometrik" : "Lower Body Power + Plyometrics", exercises: [ex.worldsGreatestStretch, ex.hipCARs, ex.hangCleanPull, ex.trapBarDeadlift, ex.boxJumps, ex.medicBallRotationalThrow, ex.ankleHops] },
    { id: "wednesday", dayOfWeek: dayLabels.wednesday, label: locale === "da" ? "TKD Sparring" : "TKD Sparring", type: "tkd", focus: locale === "da" ? "Sparring / Taktisk arbejde" : locale === "sv" ? "Sparring / Taktiskt arbete" : "Sparring / Tactical Work", exercises: [] },
    { id: "thursday", dayOfWeek: dayLabels.thursday, label: locale === "da" ? "Styrke & Modstandskraft" : locale === "sv" ? "Styrka & Motståndskraft" : "Strength & Resilience", type: "gym", focus: locale === "da" ? "Unilateral styrke + Skadeforebyggelse" : locale === "sv" ? "Unilateral styrka + Skadeförebyggande" : "Unilateral Strength + Injury Prevention", exercises: [ex.worldsGreatestStretch, ex.hipCARs, ex.splitSquat, ex.nordicCurl, ex.copenhagenPlank, ex.halfKneelingPallofPress, ex.bandedHipFlexorDrive] },
    { id: "friday", dayOfWeek: dayLabels.friday, label: locale === "da" ? "TKD Sparring" : "TKD Sparring", type: "tkd", focus: locale === "da" ? "Hård sparring / Konkurrenceforberedelse" : locale === "sv" ? "Hård sparring / Tävlingsförberedelse" : "Heavy Sparring / Competition Prep", exercises: [] },
    { id: "saturday", dayOfWeek: dayLabels.saturday, label: locale === "da" ? "Hastighed & Reaktiv" : locale === "sv" ? "Hastighet & Reaktiv" : "Speed & Reactive", type: "gym", focus: locale === "da" ? "RFD + Reaktiv plyometrik (let session)" : locale === "sv" ? "RFD + Reaktiv plyometrik (lätt pass)" : "RFD + Reactive Plyometrics (Light Session)", exercises: [ex.hipCARs, ex.depthJumpToSprint, ex.bandedHipFlexorDrive, ex.medicBallRotationalThrow, ex.ankleHops] },
    { id: "sunday", dayOfWeek: dayLabels.sunday, label: locale === "da" ? "Restitution" : locale === "sv" ? "Återhämtning" : "Recovery", type: "recovery", focus: locale === "da" ? "Aktiv restitution / Mobilitet" : locale === "sv" ? "Aktiv återhämtning / Mobilitet" : "Active Recovery / Mobility", exercises: [ex.hipCARs, ex.worldsGreatestStretch] },
  ];
}

// Keep backward-compatible WEEKLY_PLAN export
export const WEEKLY_PLAN = getWeeklyPlan("en");

export function getAllExercises(): Exercise[] {
  return Object.keys(exercisesData).map(key => resolveExercise(exercisesData[key], currentLocale));
}

export function getExerciseById(id: string): Exercise | undefined {
  const base = Object.values(exercisesData).find((e) => e.id === id);
  return base ? resolveExercise(base, currentLocale) : undefined;
}
