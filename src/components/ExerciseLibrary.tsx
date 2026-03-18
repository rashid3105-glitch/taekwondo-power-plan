import { useState, useEffect } from "react";
import { getAllExercises, setExerciseLocale, CATEGORY_LABELS, type ExerciseCategory, type Exercise } from "@/data/exercises";
import { ExerciseCard } from "./ExerciseCard";
import { useLanguage } from "@/i18n/LanguageContext";
import { AddExerciseForm } from "./AddExerciseForm";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES: ExerciseCategory[] = ["power", "plyometric", "speed", "strength", "mobility"];

const FILTER_STYLES: Record<ExerciseCategory, string> = {
  power: "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
  plyometric: "data-[active=true]:bg-explosive data-[active=true]:text-foreground",
  speed: "data-[active=true]:bg-speed data-[active=true]:text-primary-foreground",
  strength: "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
  mobility: "data-[active=true]:bg-accent data-[active=true]:text-accent-foreground",
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
  const [showForm, setShowForm] = useState(false);
  const [userExercises, setUserExercises] = useState<(Exercise & { isCustom: true; dbId: string })[]>([]);
  const [videoOverrides, setVideoOverrides] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const { locale } = useLanguage();
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

  const filtered = filter === "all"
    ? allExercises
    : filter === "custom"
    ? userExercises
    : allExercises.filter((e) => e.category === filter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          data-active={filter === "all"}
          className="rounded-full px-3 py-1.5 text-xs font-semibold border border-border transition-colors
            data-[active=true]:bg-foreground data-[active=true]:text-background
            data-[active=false]:text-muted-foreground hover:text-foreground cursor-pointer"
        >
          All ({allExercises.length})
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
            My Exercises ({userExercises.length})
          </button>
        )}
      </div>

      {/* Add button */}
      {isLoggedIn && !showForm && (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Custom Exercise
        </Button>
      )}

      {/* Add form */}
      {showForm && (
        <AddExerciseForm onClose={() => setShowForm(false)} onAdded={loadUserExercises} />
      )}

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.map((exercise, i) => (
          <div key={exercise.id} className="relative">
            <ExerciseCard exercise={exercise} index={i + 1} />
            {"isCustom" in exercise && exercise.isCustom && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Custom</span>
                <button
                  onClick={() => deleteCustomExercise(exercise.dbId)}
                  className="h-6 w-6 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors"
                  title="Delete exercise"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
