export type ExerciseCategory = "power" | "speed" | "strength" | "mobility" | "plyometric";

export type MuscleGroup = 
  | "glutes" | "quads" | "hamstrings" | "calves" 
  | "core" | "hip-flexors" | "shoulders" | "back" | "chest";

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
  videoId: string; // YouTube video ID
  whyItMatters: string;
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

const exercises: Record<string, Exercise> = {
  trapBarDeadlift: {
    id: "trap-bar-deadlift",
    name: "Trap Bar Deadlift",
    category: "power",
    muscleGroups: ["glutes", "quads", "hamstrings", "back"],
    sets: 4,
    reps: "3-5",
    tempo: "X (explosive concentric)",
    rest: "3 min",
    notes: "Focus on maximal force into the ground. Stand tall explosively. No grinding reps — stop the set if bar speed drops.",
    videoId: "WzvsIU9FW60",
    whyItMatters: "Builds total-body force production without the spinal loading of back squats. The upright torso mimics kicking posture.",
  },
  boxJumps: {
    id: "box-jumps",
    name: "Box Jumps (Step Down)",
    category: "plyometric",
    muscleGroups: ["glutes", "quads", "calves"],
    sets: 4,
    reps: "3-4",
    rest: "2 min",
    notes: "Maximum height intent. Step down (don't jump down) to protect joints. Full hip extension at the top.",
    videoId: "52r_Ul5k03g",
    whyItMatters: "Develops explosive hip extension — the engine behind roundhouse kicks and spinning techniques.",
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
    notes: "Drive through the floor, shrug hard at the top. No need to catch — focus on the pull. Use straps if grip limits load.",
    videoId: "FZaEqAAzH4Y",
    whyItMatters: "Trains rate of force development (RFD) and triple extension — ankles, knees, hips — exactly the chain used in explosive kicks.",
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
    notes: "Control the eccentric (3 sec down). Drive up powerfully. Keep torso upright. Addresses single-leg imbalances critical for kicking.",
    videoId: "2C-uNgKwPLE",
    whyItMatters: "Taekwondo is a single-leg sport. This builds unilateral strength and hip stability for powerful kicks off either leg.",
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
    notes: "Control the descent as slowly as possible. Push off the floor to assist the concentric if needed. Crucial for hamstring injury prevention.",
    videoId: "6NCN6kOagfY",
    whyItMatters: "Prevents hamstring tears from high kicks. Eccentric hamstring strength is the #1 predictor of injury resilience in kicking athletes.",
  },
  medicBallRotationalThrow: {
    id: "med-ball-rotational-throw",
    name: "Med Ball Rotational Throw",
    category: "power",
    muscleGroups: ["core", "hip-flexors", "shoulders"],
    sets: 3,
    reps: "5 each side",
    rest: "90 sec",
    notes: "Initiate from the hips, not the arms. Release with maximum intent. Use a 3-5 kg ball. Think 'turning kick' rotation.",
    videoId: "DttZ5JU-b_U",
    whyItMatters: "Directly mimics the rotational power pattern of roundhouse and hook kicks. Develops core RFD.",
  },
  bandedHipFlexorDrive: {
    id: "banded-hip-flexor-drive",
    name: "Banded Standing Knee Drive",
    category: "speed",
    muscleGroups: ["hip-flexors", "core"],
    sets: 3,
    reps: "8-10 each leg (fast)",
    rest: "60 sec",
    notes: "Attach band low behind you. Drive knee up explosively against resistance. Mimic chambering a front kick. Speed over load.",
    videoId: "LHzdOtePvTs",
    whyItMatters: "Strengthens hip flexors with speed — the muscle group that chambers every kick. Weak hip flexors = slow kicks.",
  },
  depthJumpToSprint: {
    id: "depth-jump-sprint",
    name: "Depth Jump to 5m Sprint",
    category: "plyometric",
    muscleGroups: ["glutes", "quads", "calves"],
    sets: 4,
    reps: "3",
    rest: "2-3 min",
    notes: "Step off a 30-40 cm box, land and immediately explode forward into a 5m sprint. Minimal ground contact time. This is ADVANCED — master box jumps first.",
    videoId: "ZHVWsggG4Ig",
    whyItMatters: "Trains reactive strength and amortization phase — the ability to absorb and redirect force instantly, like a fast step-in to attack.",
  },
  copenhagenPlank: {
    id: "copenhagen-plank",
    name: "Copenhagen Plank",
    category: "strength",
    muscleGroups: ["core", "hip-flexors"],
    sets: 3,
    reps: "20-30 sec each side",
    rest: "60 sec",
    notes: "Top leg on bench, bottom leg floating. Straight line from head to toe. Brutal on adductors and obliques — critical for side kicks.",
    videoId: "yByUFuQsgCg",
    whyItMatters: "Bulletproofs the groin/adductors against injury from side kicks and wide stances. Also builds anti-lateral flexion core strength.",
  },
  ankleHops: {
    id: "ankle-hops",
    name: "Ankle Hops (Pogo Jumps)",
    category: "plyometric",
    muscleGroups: ["calves"],
    sets: 3,
    reps: "15-20",
    rest: "60 sec",
    notes: "Stiff ankles, minimal knee bend. Bounce off the ground using only ankle stiffness. Think 'hot coals.' Develops foot speed and reactive stiffness.",
    videoId: "wa1ClvLqSHo",
    whyItMatters: "Develops ankle stiffness for bouncing footwork. Fast fighters have stiff, reactive ankles that let them change direction instantly.",
  },
  halfKneelingPallofPress: {
    id: "pallof-press",
    name: "Half-Kneeling Pallof Press",
    category: "strength",
    muscleGroups: ["core"],
    sets: 3,
    reps: "8-10 each side",
    rest: "60 sec",
    notes: "Press cable/band away from chest while resisting rotation. Half-kneeling forces hip stability. Slow and controlled.",
    videoId: "AH_QZLm_0-s",
    whyItMatters: "Anti-rotation core strength prevents energy leaks during kicks. If your core collapses mid-kick, power is lost.",
  },
  hipCARs: {
    id: "hip-cars",
    name: "Hip CARs (Controlled Articular Rotations)",
    category: "mobility",
    muscleGroups: ["hip-flexors", "glutes"],
    sets: 2,
    reps: "5 each direction, each leg",
    rest: "None",
    notes: "Slow, controlled circles through full hip range. Keep pelvis stable — only the femur moves. Do these daily, not just on gym days.",
    videoId: "zbH4XmSREoc",
    whyItMatters: "Maintains and expands hip range of motion under control. High kicks require both flexibility AND strength at end range.",
  },
  worldsGreatestStretch: {
    id: "worlds-greatest-stretch",
    name: "World's Greatest Stretch",
    category: "mobility",
    muscleGroups: ["hip-flexors", "hamstrings", "core", "shoulders"],
    sets: 2,
    reps: "5 each side",
    rest: "None",
    notes: "Lunge, plant hand, rotate thoracic spine to the sky. Hold each position 2-3 sec. Perfect warm-up flow.",
    videoId: "NIz2MdMqBxk",
    whyItMatters: "Opens up every chain used in TKD — hips, thoracic spine, ankles. The single best warm-up movement for martial artists.",
  },
};

export const EXERCISES = exercises;

export const WEEKLY_PLAN: TrainingDay[] = [
  {
    id: "monday",
    dayOfWeek: "Monday",
    label: "TKD Technical",
    type: "tkd",
    focus: "Poomsae / Technical Drilling",
    exercises: [],
  },
  {
    id: "tuesday",
    dayOfWeek: "Tuesday",
    label: "Power & Explosiveness",
    type: "gym",
    focus: "Lower Body Power + Plyometrics",
    exercises: [
      exercises.worldsGreatestStretch,
      exercises.hipCARs,
      exercises.hangCleanPull,
      exercises.trapBarDeadlift,
      exercises.boxJumps,
      exercises.medicBallRotationalThrow,
      exercises.ankleHops,
    ],
  },
  {
    id: "wednesday",
    dayOfWeek: "Wednesday",
    label: "TKD Sparring",
    type: "tkd",
    focus: "Sparring / Tactical Work",
    exercises: [],
  },
  {
    id: "thursday",
    dayOfWeek: "Thursday",
    label: "Strength & Resilience",
    type: "gym",
    focus: "Unilateral Strength + Injury Prevention",
    exercises: [
      exercises.worldsGreatestStretch,
      exercises.hipCARs,
      exercises.splitSquat,
      exercises.nordicCurl,
      exercises.copenhagenPlank,
      exercises.halfKneelingPallofPress,
      exercises.bandedHipFlexorDrive,
    ],
  },
  {
    id: "friday",
    dayOfWeek: "Friday",
    label: "TKD Sparring",
    type: "tkd",
    focus: "Heavy Sparring / Competition Prep",
    exercises: [],
  },
  {
    id: "saturday",
    dayOfWeek: "Saturday",
    label: "Speed & Reactive",
    type: "gym",
    focus: "RFD + Reactive Plyometrics (Light Session)",
    exercises: [
      exercises.hipCARs,
      exercises.depthJumpToSprint,
      exercises.bandedHipFlexorDrive,
      exercises.medicBallRotationalThrow,
      exercises.ankleHops,
    ],
  },
  {
    id: "sunday",
    dayOfWeek: "Sunday",
    label: "Recovery",
    type: "recovery",
    focus: "Active Recovery / Mobility",
    exercises: [
      exercises.hipCARs,
      exercises.worldsGreatestStretch,
    ],
  },
];

export function getAllExercises(): Exercise[] {
  return Object.values(exercises);
}

export function getExerciseById(id: string): Exercise | undefined {
  return Object.values(exercises).find((e) => e.id === id);
}
