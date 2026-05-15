import { useEffect, useMemo, useRef, useState } from "react";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Camera, Loader2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AccountDangerZone } from "@/components/AccountDangerZone";
import { ParentInviteSection } from "@/components/ParentInviteSection";
import { PasskeySettings } from "@/components/PasskeySettings";
import { PublicProfileSettings } from "@/components/profile/PublicProfileSettings";


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
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const avatarDisplayUrl = useAvatarUrl(avatarUrl);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [clubId, setClubId] = useState("");
  const [country, setCountry] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [defaultLocale, setDefaultLocale] = useState<Locale | "">("");
  const [galLicense, setGalLicense] = useState("");
  const [galLicenseExpires, setGalLicenseExpires] = useState("");
  const [hasMyFightBook, setHasMyFightBook] = useState(false);
  const [myFightBookExpires, setMyFightBookExpires] = useState("");
  const [tkdStartDate, setTkdStartDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale, setLocale } = useLanguage();

  const isBirthdayToday = useMemo(() => {
    if (!birthDate) return false;
    const today = new Date();
    const bd = new Date(birthDate);
    return bd.getDate() === today.getDate() && bd.getMonth() === today.getMonth();
  }, [birthDate]);

  const derivedAge = useMemo(() => {
    if (!birthDate) return age;
    const today = new Date();
    const bd = new Date(birthDate);
    let a = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
    return a > 0 ? String(a) : "";
  }, [birthDate, age]);

  const derivedExperience = useMemo(() => {
    if (!tkdStartDate) return experience;
    const start = new Date(tkdStartDate);
    const today = new Date();
    const years = today.getFullYear() - start.getFullYear();
    const m = today.getMonth() - start.getMonth();
    const adj = m < 0 || (m === 0 && today.getDate() < start.getDate()) ? 1 : 0;
    const y = Math.max(0, years - adj);
    return y > 0 ? String(y) : "0";
  }, [tkdStartDate, experience]);

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
            .select("age, weight_kg, belt_level, experience_years, discipline, goals, weekly_schedule, program_weeks, current_injury, avatar_url, club_id, country, custom_calories, default_locale, gal_license, gal_license_expires_at, has_myfightbook, myfightbook_expires_at, tkd_start_date, birth_date")
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
          setSavedAvatarUrl(profileData.avatar_url || null);
          setClubId(profileData.club_id || "");
          setCountry(profileData.country || "");
          setCustomCalories(profileData.custom_calories?.toString() || "");
          setDefaultLocale((profileData.default_locale as Locale) || "");
          setGalLicense(profileData.gal_license || "");
          setGalLicenseExpires(profileData.gal_license_expires_at || "");
          setHasMyFightBook(!!profileData.has_myfightbook);
          setMyFightBookExpires(profileData.myfightbook_expires_at || "");
          setTkdStartDate(profileData.tkd_start_date || "");
          setBirthDate(profileData.birth_date || "");
          
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
    const original = e.target.files?.[0];
    if (!original) return;

    if (!original.type.startsWith("image/") && !/\.(heic|heif)$/i.test(original.name)) {
      toast({ title: t("selectImageFile"), variant: "destructive" });
      return;
    }

    setUploading(true);

    let file: File = original;
    let ext = (original.name.split(".").pop() || "").toLowerCase();
    // Normalize common variants
    if (ext === "jpeg" || ext === "jpe") ext = "jpg";

    // Auto-convert HEIC/HEIF → JPEG in-browser
    const isHeic =
      ext === "heic" ||
      ext === "heif" ||
      original.type === "image/heic" ||
      original.type === "image/heif";

    if (isHeic) {
      try {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({
          blob: original,
          toType: "image/jpeg",
          quality: 0.85,
        });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        file = new File([blob], original.name.replace(/\.(heic|heif)$/i, ".jpg"), {
          type: "image/jpeg",
        });
        ext = "jpg";
      } catch (err: any) {
        console.error("[avatar] HEIC conversion failed", { name: original.name, type: original.type, size: original.size, err });
        toast({
          title: t("uploadFailed"),
          description: "Could not convert HEIC photo. Please use a JPG or PNG instead.",
          variant: "destructive",
          duration: 10000,
        });
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } else if (!ext) {
      ext = original.type === "image/png" ? "png" : "jpg";
    }

    // Allowlist: only formats browsers can reliably display
    const ALLOWED_EXT = ["jpg", "png", "webp", "gif"];
    if (!ALLOWED_EXT.includes(ext)) {
      toast({
        title: t("uploadFailed"),
        description: `Unsupported image format (.${ext}). Please use JPG, PNG, WEBP or GIF.`,
        variant: "destructive",
        duration: 10000,
      });
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Size guard (10 MB) — checked after conversion
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t("uploadFailed"),
        description: "Image too large (max 10 MB).",
        variant: "destructive",
        duration: 10000,
      });
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined });

      if (uploadError) {
        console.error("[avatar] storage upload failed", {
          message: uploadError.message,
          name: file.name,
          type: file.type,
          size: file.size,
        });
        throw uploadError;
      }

      // Local state only — persisted to DB via update-my-profile on form submit
      setAvatarUrl(filePath + "?t=" + Date.now());
      toast({ title: t("photoUploaded") });
    } catch (err: any) {
      toast({
        title: t("uploadFailed"),
        description: err?.message || "Unknown error",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await supabase.auth.getSession();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Strip cache-busting suffix before persisting
      const cleanAvatarUrl = avatarUrl ? avatarUrl.split("?")[0] : null;

      const payload = {
        age: age ? parseInt(age) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        belt_level: belt,
        experience_years: experience ? parseInt(experience) : null,
        tkd_sessions_per_week: tkdCount,
        goals,
        weekly_schedule: schedule,
        program_weeks: programWeeks,
        current_injury: currentInjury || null,
        discipline,
        club_id: clubId || null,
        country: country || null,
        custom_calories: customCalories ? parseInt(customCalories) : null,
        default_locale: defaultLocale || null,
        gal_license: galLicense.trim() || null,
        gal_license_expires_at: galLicenseExpires || null,
        has_myfightbook: hasMyFightBook,
        myfightbook_expires_at: hasMyFightBook && myFightBookExpires ? myFightBookExpires : null,
        
        avatar_url: cleanAvatarUrl,
      };

      const { data, error } = await supabase.functions.invoke("update-my-profile", {
        body: payload,
      });

      if (error) throw error;

      if (!data?.success) {
        console.error("Profile update function returned unexpected response", { userId: user.id, data });
        toast({ title: t("error"), description: t("profileSaveFailedSession"), variant: "destructive" });
        return;
      }

      setSavedAvatarUrl(cleanAvatarUrl);
      toast({ title: t("profileSaved") });

      // Determine where to navigate after save
      const redirectAfterSetup = new URLSearchParams(window.location.search).get("redirect");
      const targetRoute = redirectAfterSetup || "/dashboard";

      // Notify admin if user is pending approval
      try {
        const { data: protectedFields } = await supabase.rpc("get_profile_protected_fields", { _user_id: user.id });
        const pf = Array.isArray(protectedFields) ? protectedFields[0] : protectedFields;
        if (pf && !pf.is_approved) {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "coach-profile-ready",
              templateData: {
                userName: user.user_metadata?.display_name || user.email,
                userEmail: user.email,
                belt,
                discipline,
              },
            },
          });
        }
      } catch {
        // Non-critical — don't block the user
      }

      navigate(targetRoute);
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
        <div className="flex justify-end items-center gap-2 mb-4">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} title={t("home")}>
            <Home className="h-4 w-4" />
          </Button>
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
                {avatarDisplayUrl ? (
                  <img src={avatarDisplayUrl} alt="Profile" className="h-full w-full object-cover" />
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
            {avatarUrl && avatarUrl.split("?")[0] !== (savedAvatarUrl || "") && !uploading && (
              <div className="absolute mt-28 sm:mt-32 text-[10px] text-destructive font-medium">
                ⚠ Click Save to keep this photo
              </div>
            )}
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
            <Label htmlFor="defaultLocale">{t("defaultLanguage")}</Label>
            <p className="text-xs text-muted-foreground mb-1">{t("defaultLanguageHint")}</p>
            <select
              id="defaultLocale"
              value={defaultLocale}
              onChange={(e) => {
                const v = e.target.value as Locale | "";
                setDefaultLocale(v);
                if (v) setLocale(v);
              }}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{`— ${t("defaultLanguage")} —`}</option>
              <option value="en">🇬🇧 English</option>
              <option value="da">🇩🇰 Dansk</option>
              <option value="sv">🇸🇪 Svenska</option>
              <option value="no">🇳🇴 Norsk</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="ar">🇸🇦 العربية</option>
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
              <Input id="age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
            </div>
            <div>
              <Label htmlFor="weight">{t("weightKg")}</Label>
              <Input id="weight" type="number" inputMode="decimal" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
          </div>

          <div>
            <Label htmlFor="customCalories">{t("dailyCalorieTarget")}</Label>
            <p className="text-xs text-muted-foreground mb-1">{t("dailyCalorieHint")}</p>
            <Input
              id="customCalories"
              type="number"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              placeholder="2500"
              min={500}
              max={10000}
            />
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
                  <option key={b} value={b}>{t(b)} {t("belt")}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="exp">{t("yearsOfExperience")}</Label>
              <Input id="exp" type="number" inputMode="numeric" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="3" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <div>
              <Label className="text-sm font-semibold">{t("licenses") || "Licenses"}</Label>
              <p className="text-xs text-muted-foreground">{t("licensesHint") || "Optional — for competition eligibility"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gal_license" className="text-xs">{t("galLicense") || "GAL license"}</Label>
                <Input
                  id="gal_license"
                  value={galLicense}
                  onChange={(e) => setGalLicense(e.target.value)}
                  placeholder="—"
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="gal_expires" className="text-xs">{t("expiresAt") || "Expires"}</Label>
                <Input
                  id="gal_expires"
                  type="date"
                  value={galLicenseExpires}
                  onChange={(e) => setGalLicenseExpires(e.target.value)}
                />
              </div>
            </div>

            {country === "Denmark" && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="has_mfb"
                    checked={hasMyFightBook}
                    onCheckedChange={(c) => setHasMyFightBook(!!c)}
                  />
                  <Label htmlFor="has_mfb" className="text-sm font-normal cursor-pointer">
                    {t("hasMyFightBook") || "MyFightBook"}
                  </Label>
                </div>
                {hasMyFightBook && (
                  <div>
                    <Label htmlFor="mfb_expires" className="text-xs">{t("expiresAt") || "Expires"}</Label>
                    <Input
                      id="mfb_expires"
                      type="date"
                      value={myFightBookExpires}
                      onChange={(e) => setMyFightBookExpires(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
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
                  {t(d)}
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
                  {t(goal)}
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

        <div className="mt-6">
          <PublicProfileSettings />
        </div>

        {(!age || parseInt(age, 10) < 18) && (
          <div className="mt-6">
            <ParentInviteSection />
          </div>
        )}
        <PasskeySettings />

        <AccountDangerZone />
      </div>

    </div>
  );
}
