import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const BELT_LEVELS = ["white", "yellow", "green", "blue", "red", "black"];
const GOAL_OPTIONS = [
  "Faster kicks",
  "More explosive footwork",
  "Competition prep",
  "Build lean muscle",
  "Injury prevention",
  "Improve flexibility",
  "General fitness",
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday", type: "tkd" },
  { day: "Tuesday", type: "gym" },
  { day: "Wednesday", type: "tkd" },
  { day: "Thursday", type: "gym" },
  { day: "Friday", type: "tkd" },
  { day: "Saturday", type: "gym" },
  { day: "Sunday", type: "rest" },
];

export default function ProfileSetup() {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [belt, setBelt] = useState("white");
  const [experience, setExperience] = useState("");
  const [discipline, setDiscipline] = useState("sparring");
  const [goals, setGoals] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [programWeeks, setProgramWeeks] = useState(8);
  const [currentInjury, setCurrentInjury] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const tkdCount = schedule.filter((s) => s.type === "tkd").length;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: t("selectImageFile"), variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl + "?t=" + Date.now());

      await supabase.from("profiles").update({
        avatar_url: publicUrl,
      }).eq("user_id", user.id);

      toast({ title: t("photoUploaded") });
    } catch (err: any) {
      toast({ title: t("uploadFailed"), description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").update({
        age: age ? parseInt(age) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        belt_level: belt,
        experience_years: experience ? parseInt(experience) : null,
        tkd_sessions_per_week: tkdCount,
        goals,
        weekly_schedule: schedule as any,
        program_weeks: programWeeks,
        current_injury: currentInjury || null,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: t("profileSaved") });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 sm:py-8">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-energy mb-3">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">{t("athleteProfile")}</h1>
          <p className="text-sm text-muted-foreground">{t("profileSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar upload */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-border bg-muted overflow-hidden flex items-center justify-center transition-all group-hover:border-primary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground font-medium whitespace-nowrap">
                {avatarUrl ? t("changePhoto") : t("addPhoto")}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="age">{t("age")}</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
            </div>
            <div>
              <Label htmlFor="weight">{t("weightKg")}</Label>
              <Input id="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="belt">{t("beltLevel")}</Label>
              <select
                id="belt"
                value={belt}
                onChange={(e) => setBelt(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {BELT_LEVELS.map((b) => (
                  <option key={b} value={b}>{t(b as any)} {t("belt")}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="exp">{t("yearsOfExperience")}</Label>
              <Input id="exp" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="3" />
            </div>
          </div>

          {/* Program Length */}
          <div>
            <Label>{t("programLength")}</Label>
            <p className="text-xs text-muted-foreground mb-3">
              {programWeeks} {t("weeks")}
            </p>
            <Slider
              value={[programWeeks]}
              onValueChange={(v) => setProgramWeeks(v[0])}
              min={4}
              max={12}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>4 {t("weeks")}</span>
              <span>12 {t("weeks")}</span>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <Label>{t("weeklySchedule")}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t("weeklyScheduleHint")}</p>
            <WeekSchedulePicker schedule={schedule} onChange={setSchedule} />
          </div>

          <div>
            <Label>{t("trainingGoals")}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t("selectAllThatApply")}</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  data-active={goals.includes(goal)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium border border-border transition-colors cursor-pointer
                    data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
                    data-[active=false]:text-muted-foreground hover:text-foreground"
                >
                  {t(goal as any)}
                </button>
              ))}
            </div>
          </div>

          {/* Current Injury */}
          <div>
            <Label htmlFor="injury">{t("currentInjury")}</Label>
            <p className="text-xs text-muted-foreground mb-2">
              {t("currentInjuryHint")}
            </p>
            <Input
              id="injury"
              value={currentInjury}
              onChange={(e) => setCurrentInjury(e.target.value)}
              placeholder={t("injuryPlaceholder")}
              maxLength={200}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("saving") : t("saveProfileContinue")}
          </Button>
        </form>
      </div>
    </div>
  );
}
