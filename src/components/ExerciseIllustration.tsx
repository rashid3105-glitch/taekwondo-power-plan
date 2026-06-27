import { type Exercise } from "@/data/exercises";
import { MuscleGroupBadges } from "./MuscleIcon";
import { Dumbbell, Zap, Wind, Move, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Import all exercise images
import trapBarDeadlift from "@/assets/exercises/trap-bar-deadlift.jpg";
import boxJumps from "@/assets/exercises/box-jumps.jpg";
import hangCleanPull from "@/assets/exercises/hang-clean-pull.jpg";
import bulgarianSplitSquat from "@/assets/exercises/bulgarian-split-squat.jpg";
import nordicCurl from "@/assets/exercises/nordic-curl.jpg";
import medBallRotationalThrow from "@/assets/exercises/med-ball-rotational-throw.jpg";
import bandedHipFlexorDrive from "@/assets/exercises/banded-hip-flexor-drive.jpg";
import depthJumpSprint from "@/assets/exercises/depth-jump-sprint.jpg";
import copenhagenPlank from "@/assets/exercises/copenhagen-plank.jpg";
import ankleHops from "@/assets/exercises/ankle-hops.jpg";
import pallofPress from "@/assets/exercises/pallof-press.jpg";
import hipCars from "@/assets/exercises/hip-cars.jpg";
import worldsGreatestStretch from "@/assets/exercises/worlds-greatest-stretch.jpg";
import kettlebellSwing from "@/assets/exercises/kettlebell-swing.jpg";
import boxSquat from "@/assets/exercises/box-squat.jpg";
import barbellHipThrust from "@/assets/exercises/barbell-hip-thrust.jpg";
import bandedLateralWalk from "@/assets/exercises/banded-lateral-walk.jpg";
import bandedPullApart from "@/assets/exercises/banded-pull-apart.jpg";
import bandedGoodMorning from "@/assets/exercises/banded-good-morning.jpg";
import bandedSquat from "@/assets/exercises/banded-squat.jpg";
import singleLegRdl from "@/assets/exercises/single-leg-rdl.jpg";
import lateralBoundHold from "@/assets/exercises/lateral-bound-hold.jpg";
import plankShoulderTap from "@/assets/exercises/plank-shoulder-tap.jpg";
import eccentricCalfRaise from "@/assets/exercises/eccentric-calf-raise.jpg";
import turkishGetUp from "@/assets/exercises/turkish-get-up.jpg";
import jumpLunge from "@/assets/exercises/jump-lunge.jpg";
import facePull from "@/assets/exercises/face-pull.jpg";
import gobletSquat from "@/assets/exercises/goblet-squat.jpg";
import thoracicRotation from "@/assets/exercises/thoracic-rotation.jpg";
import pistolSquatNegative from "@/assets/exercises/pistol-squat-negative.jpg";
import standingHipAdduction from "@/assets/exercises/standing-hip-adduction.jpg";
import weightedHipFlexorRaise from "@/assets/exercises/weighted-hip-flexor-raise.jpg";
import lateralLungeWithPause from "@/assets/exercises/lateral-lunge-with-pause.jpg";
import singleLegRdlHipControl from "@/assets/exercises/single-leg-rdl-hip-control.jpg";
import hipAirplanes from "@/assets/exercises/hip-airplanes.jpg";
import isometricCutKickHold from "@/assets/exercises/isometric-cut-kick-hold.jpg";

const EXERCISE_IMAGES: Record<string, string> = {
  "trap-bar-deadlift": trapBarDeadlift,
  "box-jumps": boxJumps,
  "hang-clean-pull": hangCleanPull,
  "bulgarian-split-squat": bulgarianSplitSquat,
  "nordic-curl": nordicCurl,
  "med-ball-rotational-throw": medBallRotationalThrow,
  "banded-hip-flexor-drive": bandedHipFlexorDrive,
  "depth-jump-sprint": depthJumpSprint,
  "copenhagen-plank": copenhagenPlank,
  "ankle-hops": ankleHops,
  "pallof-press": pallofPress,
  "hip-cars": hipCars,
  "worlds-greatest-stretch": worldsGreatestStretch,
  "kettlebell-swing": kettlebellSwing,
  "box-squat": boxSquat,
  "barbell-hip-thrust": barbellHipThrust,
  "banded-lateral-walk": bandedLateralWalk,
  "banded-pull-apart": bandedPullApart,
  "banded-good-morning": bandedGoodMorning,
  "banded-squat": bandedSquat,
  "single-leg-rdl": singleLegRdl,
  "lateral-bound-hold": lateralBoundHold,
  "plank-shoulder-tap": plankShoulderTap,
  "eccentric-calf-raise": eccentricCalfRaise,
  "turkish-get-up": turkishGetUp,
  "jump-lunge": jumpLunge,
  "face-pull": facePull,
  "goblet-squat": gobletSquat,
  "thoracic-rotation": thoracicRotation,
  "pistol-squat-negative": pistolSquatNegative,
  "standing-hip-adduction": standingHipAdduction,
  "weighted-hip-flexor-raise": weightedHipFlexorRaise,
  "lateral-lunge-with-pause": lateralLungeWithPause,
  "single-leg-rdl-hip-control": singleLegRdlHipControl,
  "hip-airplanes": hipAirplanes,
  "isometric-cut-kick-hold": isometricCutKickHold,
};

const CATEGORY_CONFIG: Record<string, { icon: typeof Dumbbell; color: string; bg: string; border: string; label: string }> = {
  power: { icon: Zap, color: "text-accent", bg: "bg-accent/20", border: "border-accent/40", label: "POWER" },
  speed: { icon: Wind, color: "text-speed", bg: "bg-speed/20", border: "border-speed/40", label: "SPEED" },
  strength: { icon: Dumbbell, color: "text-primary", bg: "bg-primary/20", border: "border-primary/40", label: "STRENGTH" },
  mobility: { icon: Move, color: "text-accent", bg: "bg-accent/20", border: "border-accent/40", label: "MOBILITY" },
  plyometric: { icon: Flame, color: "text-explosive", bg: "bg-explosive/20", border: "border-explosive/40", label: "PLYOMETRIC" },
};

function parseFormCues(notes: string): string[] {
  const parts = notes
    .split(/(?:\.\s+|\s—\s)/)
    .map(s => s.replace(/\.$/, "").trim())
    .filter(s => s.length > 5);
  return parts.slice(0, 4);
}

interface ExerciseIllustrationProps {
  exercise: Exercise;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 1.05 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export function ExerciseIllustration({ exercise }: ExerciseIllustrationProps) {
  const config = CATEGORY_CONFIG[exercise.category] || CATEGORY_CONFIG.strength;
  const Icon = config.icon;
  const cues = parseFormCues(exercise.notes);
  const image = EXERCISE_IMAGES[exercise.id];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative rounded-xl overflow-hidden border-2",
        config.border
      )}
    >
      {/* Exercise photo */}
      {image && (
        <motion.div variants={imageVariants} className="relative">
          <img
            src={image}
            alt={exercise.name}
            className="w-full h-56 sm:h-64 object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          
          {/* Category badge on image */}
          <motion.div
            variants={itemVariants}
            className={cn(
              "absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md",
              config.bg, "border", config.border
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", config.color)} />
            <span className={cn("text-[10px] font-extrabold uppercase tracking-widest", config.color)}>
              {config.label}
            </span>
          </motion.div>

          {/* Sets x Reps on image */}
          <motion.div
            variants={itemVariants}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border"
          >
            <span className="font-mono text-sm font-extrabold text-foreground">
              {exercise.sets}×{exercise.reps}
            </span>
          </motion.div>

          {/* Muscle groups floating at bottom of image */}
          <motion.div
            variants={itemVariants}
            className="absolute bottom-3 left-3 right-3"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 backdrop-blur-md border border-border/50">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mr-1">Muscles</span>
              <MuscleGroupBadges muscles={exercise.muscleGroups} size={32} showLabels />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Form cues below image */}
      {cues.length > 0 && (
        <div className="p-4 space-y-2.5 bg-card/80">
          <p className={cn("text-[10px] uppercase tracking-widest font-extrabold", config.color)}>
            Key Form Cues
          </p>
          <div className="grid gap-2">
            {cues.map((cue, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-3 py-2.5 border",
                  "bg-secondary/60 border-border/50"
                )}
              >
                <span className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center",
                  config.bg, config.color
                )}>
                  {i + 1}
                </span>
                <span className="text-sm text-secondary-foreground leading-relaxed">{cue}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No-image fallback */}
      {!image && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", config.bg)}>
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className={cn("text-[10px] font-extrabold uppercase tracking-widest", config.color)}>
                {config.label}
              </span>
            </div>
            <span className="font-mono text-sm font-extrabold text-foreground">
              {exercise.sets}×{exercise.reps}
            </span>
          </div>
          <div className="flex items-center justify-center py-4">
            <MuscleGroupBadges muscles={exercise.muscleGroups} size={44} showLabels />
          </div>
          {cues.length > 0 && (
            <div className="space-y-2">
              <p className={cn("text-[10px] uppercase tracking-widest font-extrabold", config.color)}>
                Key Form Cues
              </p>
              <div className="grid gap-1.5">
                {cues.map((cue, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="flex items-start gap-2.5 bg-secondary/60 rounded-lg px-3 py-2.5 border border-border/50"
                  >
                    <span className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center",
                      config.bg, config.color
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-secondary-foreground leading-relaxed">{cue}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
