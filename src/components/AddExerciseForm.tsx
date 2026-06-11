import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Loader2 } from "lucide-react";
import { CATEGORY_LABELS, type ExerciseCategory, type MuscleGroup } from "@/data/exercises";

const CATEGORIES: ExerciseCategory[] = ["power", "plyometric", "speed", "strength", "mobility"];
const MUSCLE_GROUPS: MuscleGroup[] = [
  "glutes", "quads", "hamstrings", "calves", "core", "hip-flexors", "shoulders", "back", "chest",
];

interface AddExerciseFormProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddExerciseForm({ onClose, onAdded }: AddExerciseFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExerciseCategory>("strength");
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8-10");
  const [tempo, setTempo] = useState("");
  const [rest, setRest] = useState("90 sec");
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [alt1Name, setAlt1Name] = useState("");
  const [alt1Reason, setAlt1Reason] = useState("");
  const [alt2Name, setAlt2Name] = useState("");
  const [alt2Reason, setAlt2Reason] = useState("");
  const { toast } = useToast();

  const toggleMuscle = (m: MuscleGroup) => {
    setMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast({ title: "Enter a valid exercise name (max 100 chars)", variant: "destructive" });
      return;
    }
    if (muscles.length === 0) {
      toast({ title: "Select at least one muscle group", variant: "destructive" });
      return;
    }

    const setsNum = parseInt(sets);
    if (isNaN(setsNum) || setsNum < 1 || setsNum > 20) {
      toast({ title: "Sets must be between 1 and 20", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "You must be logged in", variant: "destructive" });
      setSaving(false);
      return;
    }

    const alternatives = [
      ...(alt1Name.trim() ? [{ name: alt1Name.trim().slice(0, 100), reason: alt1Reason.trim().slice(0, 200) }] : []),
      ...(alt2Name.trim() ? [{ name: alt2Name.trim().slice(0, 100), reason: alt2Reason.trim().slice(0, 200) }] : []),
    ];

    const { error } = await supabase.from("user_exercises").insert({
      user_id: user.id,
      name: trimmedName,
      category,
      muscle_groups: muscles,
      sets: setsNum,
      reps: reps.trim().slice(0, 30) || "8-10",
      tempo: tempo.trim().slice(0, 50) || null,
      rest: rest.trim().slice(0, 30) || "90 sec",
      notes: notes.trim().slice(0, 500),
      video_url: videoUrl.trim().slice(0, 500) || null,
      why_it_matters: whyItMatters.trim().slice(0, 500),
      alternatives,
    });

    if (error) {
      toast({ title: "Failed to save exercise", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Exercise added!" });
      onAdded();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-card-foreground">Add Custom Exercise</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-card-foreground">Exercise Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Barbell Hip Thrust"
              maxLength={100}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Muscle groups */}
        <div>
          <Label className="text-xs text-card-foreground">Muscle Groups *</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {MUSCLE_GROUPS.map((m) => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={muscles.includes(m)}
                  onCheckedChange={() => toggleMuscle(m)}
                />
                <span className="text-xs text-card-foreground capitalize">{m.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sets, Reps, Rest, Tempo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-card-foreground">Sets</Label>
            <Input type="number" inputMode="numeric" min={1} max={20} value={sets} onChange={(e) => setSets(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">Reps</Label>
            <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8-10" maxLength={30} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">Rest</Label>
            <Input value={rest} onChange={(e) => setRest(e.target.value)} placeholder="90 sec" maxLength={30} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">Tempo</Label>
            <Input value={tempo} onChange={(e) => setTempo(e.target.value)} placeholder="3-0-1-0" maxLength={50} className="mt-1" />
          </div>
        </div>

        {/* Notes & Why it matters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-card-foreground">Coaching Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key form cues..." maxLength={500} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">Why It Matters for TKD</Label>
            <Input value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} placeholder="Builds explosive..." maxLength={500} className="mt-1" />
          </div>
        </div>

        {/* Video URL */}
        <div>
          <Label className="text-xs text-card-foreground">YouTube Video URL (optional)</Label>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." maxLength={500} className="mt-1" />
        </div>

        {/* Alternatives */}
        <div className="space-y-2">
          <Label className="text-xs text-card-foreground">Alternatives (optional)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={alt1Name} onChange={(e) => setAlt1Name(e.target.value)} placeholder="Alternative 1 name" maxLength={100} />
            <Input value={alt1Reason} onChange={(e) => setAlt1Reason(e.target.value)} placeholder="Reason for substitution" maxLength={200} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={alt2Name} onChange={(e) => setAlt2Name(e.target.value)} placeholder="Alternative 2 name" maxLength={100} />
            <Input value={alt2Reason} onChange={(e) => setAlt2Reason(e.target.value)} placeholder="Reason for substitution" maxLength={200} />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : <><Plus className="h-4 w-4 mr-1" /> Add Exercise</>}
        </Button>
      </form>
    </div>
  );
}
