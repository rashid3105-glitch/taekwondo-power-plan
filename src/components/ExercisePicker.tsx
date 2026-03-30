import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Check } from "lucide-react";
import { getAllExercises, CATEGORY_LABELS, type ExerciseCategory, type Exercise } from "@/data/exercises";
import { supabase } from "@/integrations/supabase/client";
import { MuscleGroupBadges } from "@/components/MuscleIcon";
import { cn } from "@/lib/utils";

const CATEGORIES: ExerciseCategory[] = ["power", "plyometric", "speed", "strength", "mobility"];

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

interface PickerExercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  sets: number;
  reps: string;
  tempo?: string;
  rest: string;
  coachingCue?: string;
  whyItMatters?: string;
  alternatives?: { name: string; reason: string }[];
}

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: PickerExercise) => void;
  title?: string;
}

export function ExercisePicker({ open, onClose, onSelect, title = "Pick an Exercise" }: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ExerciseCategory | null>(null);
  const [customExercises, setCustomExercises] = useState<PickerExercise[]>([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_exercises")
        .select("*")
        .eq("user_id", user.id);
      if (data) {
        setCustomExercises(data.map(ue => ({
          id: `custom-${ue.id}`,
          name: ue.name,
          category: ue.category,
          muscleGroups: ue.muscle_groups,
          sets: ue.sets,
          reps: ue.reps,
          tempo: ue.tempo ?? undefined,
          rest: ue.rest,
          coachingCue: ue.notes,
          whyItMatters: ue.why_it_matters,
          alternatives: Array.isArray(ue.alternatives) ? ue.alternatives as any : [],
        })));
      }
    })();
  }, [open]);

  const builtInExercises: PickerExercise[] = useMemo(() => {
    return getAllExercises().map(ex => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      muscleGroups: ex.muscleGroups,
      sets: ex.sets,
      reps: ex.reps,
      tempo: ex.tempo,
      rest: ex.rest,
      coachingCue: ex.notes,
      whyItMatters: ex.whyItMatters,
      alternatives: ex.alternatives,
    }));
  }, []);

  const allExercises = useMemo(() => {
    return [...customExercises, ...builtInExercises];
  }, [customExercises, builtInExercises]);

  const filtered = useMemo(() => {
    let list = allExercises;
    if (catFilter) list = list.filter(e => e.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, catFilter, search]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCatFilter(null)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors",
              !catFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? null : cat)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors",
                catFilter === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No exercises found</p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                onSelect(ex);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left cursor-pointer"
            >
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[ex.category] || "bg-muted"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ex.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ex.sets}×{ex.reps} · {ex.rest}
                </p>
              </div>
              {ex.muscleGroups?.length > 0 && (
                <MuscleGroupBadges muscles={ex.muscleGroups as any} size={18} />
              )}
              <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
