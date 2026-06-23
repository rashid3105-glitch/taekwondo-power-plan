import { useState, useEffect } from "react";
import { getAllExercises, setExerciseLocale, CATEGORY_LABELS, type ExerciseCategory, type Exercise } from "@/data/exercises";
import { ExerciseCard } from "./ExerciseCard";
import { useLanguage } from "@/i18n/LanguageContext";
import { AddExerciseForm } from "./AddExerciseForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Search, MessageCircle, Target, ShieldAlert, Activity, Zap, Dumbbell, Move, Flame, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getExerciseGoals, getRiskLevel, type ExerciseGoal, type RiskLevel, RISK_STYLES } from "@/lib/exerciseClassification";
import type { TranslationKey } from "@/i18n/translations";

const GOALS: ExerciseGoal[] = ["speed", "power", "rfd", "mobility", "strength"];
const RISKS: RiskLevel[] = ["low", "medium", "high"];

const GOAL_LABEL_KEY: Record<ExerciseGoal, TranslationKey> = {
  speed: "goalSpeed",
  power: "goalPower",
  rfd: "goalRfd",
  mobility: "goalMobility",
  strength: "goalStrength",
};

const RISK_LABEL_KEY: Record<RiskLevel, TranslationKey> = {
  low: "riskLow",
  medium: "riskMedium",
  high: "riskHigh",
};

const CATEGORIES: ExerciseCategory[] = ["power", "plyometric", "speed", "strength", "mobility"];

const FILTER_STYLES: Record<ExerciseCategory, string> = {
  power: "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
  plyometric: "data-[active=true]:bg-explosive data-[active=true]:text-foreground",
  speed: "data-[active=true]:bg-speed data-[active=true]:text-primary-foreground",
  strength: "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  mobility: "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
};

const CATEGORY_ICONS: Record<ExerciseCategory, typeof Dumbbell> = {
  power: Activity,
  plyometric: Flame,
  speed: Zap,
  strength: Dumbbell,
  mobility: Move,
};

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || "";
}

interface UserExercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  sets: number;
  reps: string;
  tempo: string | null;
  rest: string;
  notes: string;
  video_url: string | null;
  why_it_matters: string;
  alternatives: any;
}

function toExercise(ue: UserExercise): Exercise & { isCustom: true; dbId: string } {
  return {
    id: `custom-${ue.id}`,
    dbId: ue.id,
    isCustom: true,
    name: ue.name,
    category: ue.category as ExerciseCategory,
    muscleGroups: ue.muscle_groups as any,
    sets: ue.sets,
    reps: ue.reps,
    tempo: ue.tempo || undefined,
    rest: ue.rest,
    notes: ue.notes,
    videoId: ue.video_url ? extractYouTubeId(ue.video_url) : "",
    whyItMatters: ue.why_it_matters,
    alternatives: Array.isArray(ue.alternatives) ? ue.alternatives : [],
  };
}

export function ExerciseLibrary() {
  const [filter, setFilter] = useState<ExerciseCategory | "all" | "custom">("all");
  const [goalFilters, setGoalFilters] = useState<Set<ExerciseGoal>>(new Set());
  const [riskFilters, setRiskFilters] = useState<Set<RiskLevel>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [userExercises, setUserExercises] = useState<(Exercise & { isCustom: true; dbId: string })[]>([]);
  const [videoOverrides, setVideoOverrides] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  setExerciseLocale(locale);
  const allBuiltIn = getAllExercises();

  useEffect(() => {
    loadUserExercises();
    // Load video overrides from localStorage
    const stored = localStorage.getItem("exercise-video-overrides");
    if (stored) {
      try { setVideoOverrides(JSON.parse(stored)); } catch {}
    }
  }, []);

  const loadUserExercises = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoggedIn(false); return; }
    setIsLoggedIn(true);

    const { data } = await supabase
      .from("user_exercises")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setUserExercises((data as unknown as UserExercise[]).map(toExercise));
    }
  };

  const deleteCustomExercise = async (dbId: string) => {
    const { error } = await supabase.from("user_exercises").delete().eq("id", dbId);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Exercise deleted" });
      setUserExercises((prev) => prev.filter((e) => e.dbId !== dbId));
    }
  };

  const handleVideoChange = async (exerciseId: string, newVideoId: string) => {
    // For custom exercises, update in DB
    const customEx = userExercises.find((e) => e.id === exerciseId);
    if (customEx) {
      const videoUrl = newVideoId ? `https://www.youtube.com/watch?v=${newVideoId}` : null;
      const { error } = await supabase
        .from("user_exercises")
        .update({ video_url: videoUrl })
        .eq("id", customEx.dbId);
      if (error) {
        toast({ title: "Failed to update video", variant: "destructive" });
        return;
      }
      setUserExercises((prev) =>
        prev.map((e) => e.dbId === customEx.dbId ? { ...e, videoId: newVideoId } : e)
      );
      toast({ title: "Video updated" });
    } else {
      // Built-in exercises: store override in localStorage
      const updated = { ...videoOverrides, [exerciseId]: newVideoId };
      setVideoOverrides(updated);
      localStorage.setItem("exercise-video-overrides", JSON.stringify(updated));
      toast({ title: "Video updated" });
    }
  };

  // Apply video overrides to built-in exercises
  const allExercises = [
    ...allBuiltIn.map((e) => ({
      ...e,
      videoId: videoOverrides[e.id] ?? e.videoId,
      isCustom: false as const,
    })),
    ...userExercises,
  ];

  const baseFiltered = filter === "all"
    ? allExercises
    : filter === "custom"
    ? userExercises
    : allExercises.filter((e) => e.category === filter);

  const filtered = baseFiltered.filter((e) => {
    if (goalFilters.size > 0) {
      const goals = getExerciseGoals(e);
      if (!goals.some((g) => goalFilters.has(g))) return false;
    }
    if (riskFilters.size > 0) {
      if (!riskFilters.has(getRiskLevel(e))) return false;
    }
    return true;
  });

  const toggleGoal = (g: ExerciseGoal) => {
    setGoalFilters((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };
  const toggleRisk = (r: RiskLevel) => {
    setRiskFilters((prev) => {
      const next = new Set(prev);
      next.has(r) ? next.delete(r) : next.add(r);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <Alert className="border-primary/30 bg-primary/5">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <Search className="h-4 w-4 text-primary" />
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <AlertDescription className="text-sm text-muted-foreground">
            {t("exerciseDisclaimer")}
          </AlertDescription>
        </div>
      </Alert>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          data-active={filter === "all"}
          className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
            data-[active=true]:bg-foreground data-[active=true]:text-background
            data-[active=false]:text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {t("allFilter")} ({allExercises.length})
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            data-active={filter === cat}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
              data-[active=false]:text-muted-foreground hover:text-foreground cursor-pointer
              ${FILTER_STYLES[cat]}`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
        {userExercises.length > 0 && (
          <button
            onClick={() => setFilter("custom")}
            data-active={filter === "custom"}
            className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
              data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
              data-[active=false]:text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {t("myExercises")} ({userExercises.length})
          </button>
        )}
      </div>

      {/* Goal filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1 mr-1">
          <Target className="h-3 w-3" /> {t("filterByGoal")}
        </span>
        {GOALS.map((g) => {
          const active = goalFilters.has(g);
          return (
            <button
              key={g}
              onClick={() => toggleGoal(g)}
              data-active={active}
              className="rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors
                data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:border-primary
                data-[active=false]:text-muted-foreground data-[active=false]:border-border hover:text-foreground cursor-pointer"
            >
              {t(GOAL_LABEL_KEY[g])}
            </button>
          );
        })}
      </div>

      {/* Risk filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1 mr-1">
          <ShieldAlert className="h-3 w-3" /> {t("filterByRisk")}
        </span>
        {RISKS.map((r) => {
          const active = riskFilters.has(r);
          return (
            <button
              key={r}
              onClick={() => toggleRisk(r)}
              data-active={active}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors hover:text-foreground cursor-pointer ${
                active ? RISK_STYLES[r] : "text-muted-foreground border-border"
              }`}
            >
              {t(RISK_LABEL_KEY[r])}
            </button>
          );
        })}
      </div>

      {/* Add button */}
      {isLoggedIn && !showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t("addCustomExercise")}
        </Button>
      )}

      {/* Add form */}
      {showForm && (
        <AddExerciseForm onClose={() => setShowForm(false)} onAdded={loadUserExercises} />
      )}

      {/* Exercise list — collapsible category sections (closed by default) */}
      <div className="space-y-3">
        {(filter === "custom" ? ["custom" as const] : CATEGORIES).map((cat) => {
          const catItems = filter === "custom"
            ? filtered
            : filtered.filter((e) => e.category === cat);
          if (catItems.length === 0) return null;
          const Icon = cat === "custom" ? Plus : CATEGORY_ICONS[cat as ExerciseCategory];
          const label = cat === "custom" ? t("myExercises") : CATEGORY_LABELS[cat as ExerciseCategory];
          return (
            <Collapsible key={cat} defaultOpen={false}>
              <CollapsibleTrigger className="group w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground flex-1 text-left">{label}</h2>
                <Badge variant="secondary" className="text-[10px]">{catItems.length}</Badge>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 pt-3 pb-1">
                  {catItems.map((exercise, i) => (
                    <div key={exercise.id} className="relative">
                      <ExerciseCard exercise={exercise} index={i + 1} />
                      {"isCustom" in exercise && exercise.isCustom && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                          <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">{t("customLabel")}</span>
                          <button
                            onClick={() => deleteCustomExercise(exercise.dbId)}
                            className="h-6 w-6 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors"
                            title={t("deleteExercise")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
