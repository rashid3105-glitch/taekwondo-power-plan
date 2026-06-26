import { useState } from "react";
import { type MentalExercise, MENTAL_CATEGORY_LABELS, MENTAL_CATEGORY_ICONS, MENTAL_DIFFICULTY_LABELS } from "@/data/mentalExercises";
import { ChevronDown, ChevronUp, Clock, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const DIFFICULTY_STYLES = {
  beginner: "bg-tab-nutrition/15 text-tab-nutrition",
  intermediate: "bg-tab-plan/15 text-tab-plan",
  advanced: "bg-tab-rehab/15 text-tab-rehab",
};

export function MentalExerciseCard({ exercise, index }: { exercise: MentalExercise; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { locale, t } = useLanguage();
  const catLabels = MENTAL_CATEGORY_LABELS[locale];
  const diffLabels = MENTAL_DIFFICULTY_LABELS[locale];

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground overflow-hidden transition-all">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className="text-base">{MENTAL_CATEGORY_ICONS[exercise.category]}</span>
        <span className="font-semibold text-sm text-foreground flex-1 text-left">{exercise.name}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[exercise.difficulty]}`}>
          {diffLabels[exercise.difficulty]}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 animate-slide-up">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {exercise.duration}</span>
            <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {catLabels[exercise.category]}</span>
          </div>

          <p className="text-sm text-card-foreground/80 leading-relaxed">{exercise.description}</p>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("mentalSteps")}</p>
            <ol className="space-y-1.5">
              {exercise.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-card-foreground/90">
                  <span className="font-bold text-tab-mental min-w-[16px]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <p className="text-xs leading-relaxed text-tab-mental/80">
            <span className="font-semibold text-tab-mental">{t("mentalWhyItMatters")} </span>
            {exercise.whyItMatters}
          </p>
        </div>
      )}
    </div>
  );
}
