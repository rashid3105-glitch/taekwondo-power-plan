import { useState } from "react";
import { type Exercise, CATEGORY_LABELS } from "@/data/exercises";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ShieldAlert, Target, CheckCircle2, Youtube } from "lucide-react";
import { MuscleGroupBadges } from "./MuscleIcon";
import { ExerciseIllustration } from "./ExerciseIllustration";
import { getExerciseGoals, getRiskLevel, RISK_STYLES } from "@/lib/exerciseClassification";
import { EXERCISE_CATEGORY_STYLE } from "@/lib/exerciseCategoryStyle";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const GOAL_LABEL_KEY: Record<string, TranslationKey> = {
  speed: "goalSpeed",
  power: "goalPower",
  rfd: "goalRfd",
  mobility: "goalMobility",
  strength: "goalStrength",
};

const RISK_LABEL_KEY: Record<string, TranslationKey> = {
  low: "riskLow",
  medium: "riskMedium",
  high: "riskHigh",
};

const CUES_KEY: Record<string, TranslationKey> = {
  power: "cuesPower",
  speed: "cuesSpeed",
  strength: "cuesStrength",
  mobility: "cuesMobility",
  plyometric: "cuesPlyometric",
};

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
}

export function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();
  const goals = getExerciseGoals(exercise);
  const risk = getRiskLevel(exercise);
  const catStyle = EXERCISE_CATEGORY_STYLE[exercise.category];
  const CatIcon = catStyle.Icon;

  const youtubeHref = exercise.videoId
    ? `https://www.youtube.com/watch?v=${exercise.videoId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + " taekwondo tutorial")}`;

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden transition-all">
      {/* Header */}
      <div className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
        >
          <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
          <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0", catStyle.tile)}>
            <CatIcon className={cn("h-4 w-4", catStyle.icon)} />
          </span>
          <span className="font-semibold text-sm text-foreground flex-1 text-left truncate">{exercise.name}</span>
          <MuscleGroupBadges muscles={exercise.muscleGroups} size={26} />
          <span className="text-xs text-muted-foreground mr-2 whitespace-nowrap">
            {exercise.sets}×{exercise.reps}
          </span>
          <span className={cn("hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", RISK_STYLES[risk])}>
            <ShieldAlert className="h-3 w-3" />
            {t(RISK_LABEL_KEY[risk])}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline px-2 py-0.5 rounded bg-muted">
            {CATEGORY_LABELS[exercise.category]}
          </span>
        </button>
        <a
          href={youtubeHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="YouTube"
          className="flex items-center justify-center h-7 w-7 rounded-md bg-red-600/15 text-red-600 hover:bg-red-600/25 transition-colors flex-shrink-0"
        >
          <Youtube className="h-4 w-4" />
        </a>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 animate-slide-up">
          {/* Goal + risk badge row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <Target className="h-3 w-3" /> {t("filterByGoal")}:
            </span>
            {goals.map((g) => (
              <span key={g} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                {t(GOAL_LABEL_KEY[g])}
              </span>
            ))}
            <span className={cn("ml-auto sm:hidden inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", RISK_STYLES[risk])}>
              <ShieldAlert className="h-3 w-3" />
              {t(RISK_LABEL_KEY[risk])}
            </span>
          </div>

          {/* Embedded YouTube short-form demo */}
          {exercise.videoId && (
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${exercise.videoId}?rel=0&modestbranding=1`}
                  title={`${exercise.name} — ${t("videoDemo")}`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              {CUES_KEY[exercise.category] && (
                <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> {t("formCuesLabel")}
                  </p>
                  <ul className="space-y-1">
                    {t(CUES_KEY[exercise.category]).split("\n").map((cue, i) => (
                      <li key={i} className="text-xs text-foreground/90 flex gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Exercise illustration */}
          <ExerciseIllustration exercise={exercise} />

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t("exerciseSetsReps")}</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t("exerciseRest")}</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t("exerciseTempo")}</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>

          {/* Why it matters */}
          <div className="space-y-2">
            <p className="text-xs leading-relaxed text-primary/80">
              <span className="font-semibold text-primary">{t("exerciseWhyMattersTkd")} </span>
              {exercise.whyItMatters}
            </p>
          </div>

          {/* Alternatives */}
          {exercise.alternatives && exercise.alternatives.length > 0 && (
            <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("exerciseAlternatives")}</p>
              {exercise.alternatives.map((alt, k) => (
                <p key={k} className="text-xs text-foreground">
                  <span className="font-semibold">{alt.name}</span>
                  <span className="text-muted-foreground"> — {alt.reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
