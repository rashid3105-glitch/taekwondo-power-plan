import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, LogOut, Trophy, Calendar, ClipboardList, Check, X, Settings, ChevronDown } from "lucide-react";
import { AvatarImg } from "@/components/AvatarImg";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { PHONE_CODES } from "@/data/phoneCodes";

interface AthleteProfile {
  user_id: string;
  display_name: string;
  belt_level: string | null;
  avatar_url: string | null;
  weekly_schedule: any;
  country: string | null;
  club_name?: string | null;
}

interface PlanRow {
  name: string;
  is_active: boolean;
}

interface CompetitionRow {
  id: string;
  name: string;
  event_date: string;
  result: string | null;
  location: string | null;
}

interface WorkoutLogDay {
  logged_date: string;
  completed: boolean;
}

interface AthleteData {
  profile: AthleteProfile;
  plan: PlanRow | null;
  competitions: CompetitionRow[];
  attendance: { date: string; completed: boolean }[];
  attendanceRate: number;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+45");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("display_name, phone, phone_country_code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (myProfile) {
        setDisplayName((myProfile as any).display_name || "");
        setPhone((myProfile as any).phone || "");
        setPhoneCountryCode((myProfile as any).phone_country_code || "+45");
      }

      const { data: links } = await supabase
        .from("parent_athletes" as any)
        .select("athlete_id")
        .eq("parent_user_id", user.id);
      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }
      const athleteIds = (links as any[]).map((l) => l.athlete_id);
      const results: AthleteData[] = [];
      for (const aid of athleteIds) {
        const [profileRes, planRes, compsRes, logsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, display_name, belt_level, avatar_url, weekly_schedule, country, club_id, clubs(name)")
            .eq("user_id", aid)
            .maybeSingle(),
          supabase
            .from("training_plans")
            .select("name, is_active")
            .eq("user_id", aid)
            .eq("is_active", true)
            .maybeSingle(),
          supabase
            .from("competitions")
            .select("id, name, event_date, result, location")
            .eq("user_id", aid)
            .order("event_date", { ascending: false })
            .limit(5),
          supabase
            .from("workout_logs")
            .select("logged_date, completed")
            .eq("user_id", aid)
            .order("logged_date", { ascending: false })
            .limit(200),
        ]);

        const map = new Map<string, boolean>();
        ((logsRes.data as WorkoutLogDay[] | null) || []).forEach((row) => {
          const prev = map.get(row.logged_date) ?? false;
          map.set(row.logged_date, prev || row.completed);
        });
        const dayList = Array.from(map.entries())
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .slice(0, 10)
          .map(([date, completed]) => ({ date, completed }));
        const totalDays = map.size;
        const completedDays = Array.from(map.values()).filter(Boolean).length;
        const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        if (profileRes.data) {
          const p: any = profileRes.data;
          results.push({
            profile: {
              user_id: p.user_id,
              display_name: p.display_name,
              belt_level: p.belt_level,
              avatar_url: p.avatar_url,
              weekly_schedule: p.weekly_schedule,
              country: p.country,
              club_name: p.clubs?.name ?? null,
            },
            plan: (planRes.data as PlanRow | null) || null,
            competitions: (compsRes.data as CompetitionRow[]) || [],
            attendance: dayList,
            attendanceRate: rate,
          });
        }
      }
      setAthletes(results);
      setLoading(false);
    })();
  }, [navigate]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({
        display_name: displayName.trim(),
        phone: phone.trim(),
        phone_country_code: phoneCountryCode || "+45",
      } as any).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: t("profileSaved") || "Saved" });
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">{t("parentDashboardTitle")}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" onClick={signOut} title={t("signOut") || "Sign out"}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {athletes.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            {t("joinInvalid")}
          </Card>
        )}

        {athletes.map((a) => (
          <div key={a.profile.user_id} className="space-y-4">
            {/* Header */}
            <Card className="p-4 flex items-center gap-3">
              <AvatarImg
                avatarUrl={a.profile.avatar_url}
                className="h-14 w-14 rounded-full object-cover border-2 border-border"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{a.profile.display_name}</div>
                <div className="text-xs text-muted-foreground capitalize">{a.profile.belt_level}</div>
                {(a.profile.club_name || a.profile.country) && (
                  <div className="text-xs text-muted-foreground truncate">
                    {[a.profile.club_name, a.profile.country].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                {t("parentViewBadge")}
              </span>
            </Card>

            {/* Training plan */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{t("parentPlanTitle")}</h2>
              </div>
              {a.plan ? (
                <>
                  <div className="text-sm font-medium">{a.plan.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(a.profile.weekly_schedule) ? a.profile.weekly_schedule : []).map(
                      (d: any, i: number) => (
                        <span
                          key={i}
                          className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium"
                        >
                          {d.day?.slice(0, 3)} · {d.type}
                        </span>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("parentNoPlan")}</p>
              )}
            </Card>

            {/* Competitions */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-sm">{t("parentCompetitionsTitle")}</h2>
              </div>
              {a.competitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-2">
                  {a.competitions.map((c) => {
                    const upcoming = new Date(c.event_date) >= new Date(new Date().toDateString());
                    return (
                      <li
                        key={c.id}
                        className="flex items-start gap-2 text-sm border-b border-border last:border-0 pb-2 last:pb-0"
                      >
                        {upcoming && <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />}
                        <div className="flex-1">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.event_date}
                            {c.location ? ` · ${c.location}` : ""}
                            {c.result ? ` · ${c.result}` : ""}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Attendance */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-sm">{t("parentAttendanceTitle")}</h2>
                </div>
                {a.attendance.length > 0 && (
                  <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                    {a.attendanceRate}% {t("parentAttendanceRate")}
                  </span>
                )}
              </div>
              {a.attendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {a.attendance.map((s) => (
                    <li key={s.date} className="flex items-center justify-between text-sm">
                      <span>{s.date}</span>
                      {s.completed ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ))}

        {/* Account settings */}
        <Card className="p-4 space-y-3">
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("accountSettings") || "Account settings"}
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
          </button>
          {settingsOpen && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label>{t("displayName") || "Name"}</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("phone") || "Phone"}</Label>
                <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button size="sm" onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save") || "Save"}
              </Button>
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-4">{t("parentReadOnlyNote")}</p>
      </div>
    </div>
  );
}
