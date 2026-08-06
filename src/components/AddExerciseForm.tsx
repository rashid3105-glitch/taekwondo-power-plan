import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Loader2, Users } from "lucide-react";
import { CATEGORY_LABELS, type ExerciseCategory, type MuscleGroup } from "@/data/exercises";
import { useLanguage } from "@/i18n/LanguageContext";

const CATEGORIES: ExerciseCategory[] = ["power", "plyometric", "speed", "strength", "mobility"];
const MUSCLE_GROUPS: MuscleGroup[] = [
  "glutes", "quads", "hamstrings", "calves", "core", "hip-flexors", "shoulders", "back", "chest",
];

interface AddExerciseFormProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddExerciseForm({ onClose, onAdded }: AddExerciseFormProps) {
  const { t } = useLanguage();
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
  const [canShare, setCanShare] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [shareWithClub, setShareWithClub] = useState(false);
  const { toast } = useToast();

  // Coaches (with a club) may publish the exercise to their whole club.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("club_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const isCoach = (roles ?? []).some((r: any) => r.role === "coach" || r.role === "admin");
      setClubId((profile?.club_id as string | null) ?? null);
      setCanShare(Boolean(isCoach && profile?.club_id));
    })();
  }, []);

  const toggleMuscle = (m: MuscleGroup) => {
    setMuscles((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast({ title: t("aefNameInvalid"), variant: "destructive" });
      return;
    }
    if (muscles.length === 0) {
      toast({ title: t("aefMuscleRequired"), variant: "destructive" });
      return;
    }

    const setsNum = parseInt(sets);
    if (isNaN(setsNum) || setsNum < 1 || setsNum > 20) {
      toast({ title: t("aefSetsInvalid"), variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: t("aefSaveFailed"), variant: "destructive" });
      setSaving(false);
      return;
    }

    const alternatives = [
      ...(alt1Name.trim() ? [{ name: alt1Name.trim().slice(0, 100), reason: alt1Reason.trim().slice(0, 200) }] : []),
      ...(alt2Name.trim() ? [{ name: alt2Name.trim().slice(0, 100), reason: alt2Reason.trim().slice(0, 200) }] : []),
    ];

    const share = canShare && shareWithClub && clubId;

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
      club_id: share ? clubId : null,
      visibility: share ? "club" : "private",
    });

    if (error) {
      toast({ title: t("aefSaveFailed"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("aefSaved") });
      onAdded();
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-card-foreground">{t("aefTitle")}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-card-foreground">{t("aefName")} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("aefCategory")} *</Label>
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
          <Label className="text-xs text-card-foreground">{t("aefMuscles")} *</Label>
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
            <Label className="text-xs text-card-foreground">{t("aefSets")}</Label>
            <Input type="number" inputMode="numeric" min={1} max={20} value={sets} onChange={(e) => setSets(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("aefReps")}</Label>
            <Input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8-10" maxLength={30} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("aefRest")}</Label>
            <Input value={rest} onChange={(e) => setRest(e.target.value)} placeholder="90 sec" maxLength={30} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("aefTempo")}</Label>
            <Input value={tempo} onChange={(e) => setTempo(e.target.value)} placeholder="3-0-1-0" maxLength={50} className="mt-1" />
          </div>
        </div>

        {/* Notes & Why it matters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-card-foreground">{t("aefNotes")}</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-card-foreground">{t("aefWhy")}</Label>
            <Input value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} maxLength={500} className="mt-1" />
          </div>

        </div>

        {/* Video URL */}
        <div>
          <Label className="text-xs text-card-foreground">{t("aefVideo")}</Label>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." maxLength={500} className="mt-1" />
        </div>

        {/* Share with club (coaches only) */}
        {canShare && (
          <label className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3 cursor-pointer">
            <Checkbox
              checked={shareWithClub}
              onCheckedChange={(v) => setShareWithClub(Boolean(v))}
              className="mt-0.5"
            />
            <span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
                <Users className="h-3.5 w-3.5 text-primary" />
                {t("aefShareClub")}
              </span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">{t("aefShareClubHint")}</span>
            </span>
          </label>
        )}

        {/* Alternatives */}
        <div className="space-y-2">
          <Label className="text-xs text-card-foreground">{t("aefAlternatives")}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={alt1Name} onChange={(e) => setAlt1Name(e.target.value)} placeholder={t("aefAltName")} maxLength={100} />
            <Input value={alt1Reason} onChange={(e) => setAlt1Reason(e.target.value)} placeholder={t("aefAltReason")} maxLength={200} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input value={alt2Name} onChange={(e) => setAlt2Name(e.target.value)} placeholder={t("aefAltName")} maxLength={100} />
            <Input value={alt2Reason} onChange={(e) => setAlt2Reason(e.target.value)} placeholder={t("aefAltReason")} maxLength={200} />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("aefSaving")}</> : <><Plus className="h-4 w-4 mr-1" /> {t("aefSave")}</>}
        </Button>
      </form>
    </div>
  );
}
