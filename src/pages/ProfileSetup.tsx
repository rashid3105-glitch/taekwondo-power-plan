import { useEffect, useRef, useState } from "react";
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
import { AccountDangerZone } from "@/components/AccountDangerZone";

import { COUNTRIES } from "@/data/countries";

const BELT_LEVELS = ["white", "yellow", "green", "blue", "red", "black"];
const GOAL_OPTIONS = [
  "Faster kicks",
  "More explosive footwork",
  "Competition prep",
  "Build lean muscle",
  "Injury prevention",
  "Stronger hips",
  "Improve flexibility",
  "General fitness",
  "Improve balance",
  "Better stance transitions",
  "Movement flow",
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

interface ClubOption {
  id: string;
  name: string;
}

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
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [clubId, setClubId] = useState("");
  const [country, setCountry] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const loadProfileSetupData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const [clubsRes, profileRes] = await Promise.all([
          supabase.from("clubs" as any).select("id, name").order("name"),
          supabase
            .from("profiles")
            .select("age, weight_kg, belt_level, experience_years, discipline, goals, weekly_schedule, program_weeks, current_injury, avatar_url, club_id")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (clubsRes.error) throw clubsRes.error;
        if (profileRes.error) throw profileRes.error;

        setClubs((clubsRes.data ?? []) as unknown as ClubOption[]);

        const profileData = profileRes.data as any;
        if (profileData) {
          setAge(profileData.age?.toString() || "");
          setWeight(profileData.weight_kg?.toString() || "");
          setBelt(profileData.belt_level || "white");
          setExperience(profileData.experience_years?.toString() || "");
          setDiscipline(profileData.discipline || "sparring");
          setGoals(profileData.goals || []);
          setSchedule((profileData.weekly_schedule as DaySchedule[]) || DEFAULT_SCHEDULE);
          setProgramWeeks(profileData.program_weeks || 8);
          setCurrentInjury(profileData.current_injury || "");
          setAvatarUrl(profileData.avatar_url || null);
          setClubId(profileData.club_id || "");
          setCountry(profileData.country || "");
        }
      } catch (err: any) {
        toast({ title: t("error"), description: err.message, variant: "destructive" });
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfileSetupData();
  }, [navigate, t, toast]);

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
        discipline,
        club_id: clubId || null,
        country: country || null,
      } as any).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: t("profileSaved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

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

          <div>
            <Label htmlFor="country">{t("country") || "Country"}</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("chooseCountry") || "Choose country"}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="club">{t("club")}</Label>
            <select
              id="club"
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{t("chooseClub")}</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
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

          <div>
            <Label>{t("discipline")}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t("disciplineHint")}</p>
            <div className="flex gap-2">
              {(["sparring", "poomsae"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d)}
                  data-active={discipline === d}
                  className="flex-1 rounded-lg px-4 py-3 text-sm font-semibold border border-border transition-colors cursor-pointer
                    data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:border-primary
                    data-[active=false]:text-muted-foreground hover:text-foreground"
                >
                  {t(d as any)}
                </button>
              ))}
            </div>
          </div>

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

        <AccountDangerZone />
      </div>
    </div>
  );
}
