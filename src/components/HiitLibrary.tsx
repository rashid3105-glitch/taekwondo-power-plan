import { useState } from "react";
import { HIIT_WORKOUTS, HIIT_CATEGORY_LABELS, type HiitWorkout } from "@/data/hiitWorkouts";
import { HiitRunner } from "./HiitRunner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Play, Clock, Flame, Target } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/i18n/translations";

const CATEGORIES: HiitWorkout["category"][] = ["kicks", "conditioning", "footwork", "sparring"];

const CAT_KEY: Record<HiitWorkout["category"], TranslationKey> = {
  kicks: "hiitCat_kicks",
  conditioning: "hiitCat_conditioning",
  footwork: "hiitCat_footwork",
  sparring: "hiitCat_sparring",
};

const LEVEL_KEY: Record<HiitWorkout["level"], TranslationKey> = {
  beginner: "hiitLevel_beginner",
  intermediate: "hiitLevel_intermediate",
  advanced: "hiitLevel_advanced",
};

const LEVEL_STYLES: Record<HiitWorkout["level"], string> = {
  beginner: "bg-accent/15 text-accent-foreground border-accent/30",
  intermediate: "bg-primary/15 text-primary border-primary/30",
  advanced: "bg-destructive/15 text-destructive border-destructive/30",
};

function totalSeconds(w: HiitWorkout): number {
  return w.intervals.reduce((sum, i) => sum + i.duration, 0);
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}:00` : `${m}:${s.toString().padStart(2, "0")}`;
}

export function HiitLibrary() {
  const [filter, setFilter] = useState<HiitWorkout["category"] | "all">("all");
  const [active, setActive] = useState<HiitWorkout | null>(null);
  const { t, locale } = useLanguage();
  const wName = (w: HiitWorkout) => (w.nameLocales as any)?.[locale] || w.name;
  const wDesc = (w: HiitWorkout) => (w.descLocales as any)?.[locale] || w.description;

  const filtered = filter === "all" ? HIIT_WORKOUTS : HIIT_WORKOUTS.filter((w) => w.category === filter);

  return (
    <div className="space-y-4">
      <Alert className="border-destructive/30 bg-destructive/5">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-destructive shrink-0 mt-0.5" fill="currentColor" />
          <AlertDescription className="text-sm text-muted-foreground">
            {t("hiitDisclaimer")}
          </AlertDescription>
        </div>
      </Alert>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          data-active={filter === "all"}
          className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors cursor-pointer
            data-[active=true]:bg-foreground data-[active=true]:text-background
            data-[active=false]:text-muted-foreground hover:text-foreground"
        >
          {t("allFilter")} ({HIIT_WORKOUTS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = HIIT_WORKOUTS.filter((w) => w.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              data-active={filter === cat}
              className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors cursor-pointer
                data-[active=true]:bg-destructive data-[active=true]:text-destructive-foreground
                data-[active=false]:text-muted-foreground hover:text-foreground"
            >
              {t(`hiitCat_${cat}` as any)} ({count})
            </button>
          );
        })}
      </div>

      {/* Workout cards */}
      <div className="grid gap-3">
        {filtered.map((w) => {
          const work = w.intervals.filter((i) => i.type === "WORK").length;
          const total = totalSeconds(w);
          return (
            <div
              key={w.id}
              className="rounded-xl border border-border bg-card p-4 hover:border-destructive/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-foreground leading-tight">{wName(w)}</h3>
                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold border",
                        LEVEL_STYLES[w.level]
                      )}
                    >
                      {t(`hiitLevel_${w.level}` as any)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{wDesc(w)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" fill="currentColor" />
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3 mt-2">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {work} {t("hiitRoundsLabel")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDuration(total)}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" /> {t(`hiitCat_${w.category}` as any)}
                </span>
              </div>

              <Button
                onClick={() => setActive(w)}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase tracking-wider text-xs h-10"
              >
                <Play className="h-4 w-4 mr-2" fill="currentColor" />
                {t("hiitStartSession")}
              </Button>
            </div>
          );
        })}
      </div>

      {active && (
        <HiitRunner
          open={!!active}
          onClose={() => setActive(null)}
          intervals={active.intervals}
          workoutName={wName(active)}
        />
      )}
    </div>
  );
}
