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
  },
};

type Locale = "en" | "da";

function resolveExercise(base: ExerciseBase, locale: Locale): Exercise {
  const localized = base[locale] || base.en;
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
    : { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday" };

  return [
    { id: "monday", dayOfWeek: dayLabels.monday, label: locale === "da" ? "TKD Teknik" : "TKD Technical", type: "tkd", focus: locale === "da" ? "Poomsae / Teknisk træning" : "Poomsae / Technical Drilling", exercises: [] },
    { id: "tuesday", dayOfWeek: dayLabels.tuesday, label: locale === "da" ? "Kraft & Eksplosivitet" : "Power & Explosiveness", type: "gym", focus: locale === "da" ? "Underkroppskraft + Plyometrik" : "Lower Body Power + Plyometrics", exercises: [ex.worldsGreatestStretch, ex.hipCARs, ex.hangCleanPull, ex.trapBarDeadlift, ex.boxJumps, ex.medicBallRotationalThrow, ex.ankleHops] },
    { id: "wednesday", dayOfWeek: dayLabels.wednesday, label: locale === "da" ? "TKD Sparring" : "TKD Sparring", type: "tkd", focus: locale === "da" ? "Sparring / Taktisk arbejde" : "Sparring / Tactical Work", exercises: [] },
    { id: "thursday", dayOfWeek: dayLabels.thursday, label: locale === "da" ? "Styrke & Modstandskraft" : "Strength & Resilience", type: "gym", focus: locale === "da" ? "Unilateral styrke + Skadeforebyggelse" : "Unilateral Strength + Injury Prevention", exercises: [ex.worldsGreatestStretch, ex.hipCARs, ex.splitSquat, ex.nordicCurl, ex.copenhagenPlank, ex.halfKneelingPallofPress, ex.bandedHipFlexorDrive] },
    { id: "friday", dayOfWeek: dayLabels.friday, label: locale === "da" ? "TKD Sparring" : "TKD Sparring", type: "tkd", focus: locale === "da" ? "Hård sparring / Konkurrenceforberedelse" : "Heavy Sparring / Competition Prep", exercises: [] },
    { id: "saturday", dayOfWeek: dayLabels.saturday, label: locale === "da" ? "Hastighed & Reaktiv" : "Speed & Reactive", type: "gym", focus: locale === "da" ? "RFD + Reaktiv plyometrik (let session)" : "RFD + Reactive Plyometrics (Light Session)", exercises: [ex.hipCARs, ex.depthJumpToSprint, ex.bandedHipFlexorDrive, ex.medicBallRotationalThrow, ex.ankleHops] },
    { id: "sunday", dayOfWeek: dayLabels.sunday, label: locale === "da" ? "Restitution" : "Recovery", type: "recovery", focus: locale === "da" ? "Aktiv restitution / Mobilitet" : "Active Recovery / Mobility", exercises: [ex.hipCARs, ex.worldsGreatestStretch] },
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
