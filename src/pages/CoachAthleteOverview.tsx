import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { AvatarImg } from "@/components/AvatarImg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Loader2, Heart, Building, NotebookPen,
  LayoutDashboard, UserCog, Users,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { CoachAthleteDetail } from "@/components/CoachAthleteDetail";
import { AthleteOverviewTab } from "@/components/coach/AthleteOverviewTab";
import { CoachDiaryView } from "@/components/coach/CoachDiaryView";
import { SendReminderDialog } from "@/components/SendReminderDialog";
import { CoachAvatarUpload } from "@/components/coach/CoachAvatarUpload";

interface AthleteProfile {
  user_id: string;
  display_name: string;
  athlete_code: string | null;
  age: number | null;
  weight_kg: number | null;
  belt_level: string;
  experience_years: number | null;
  goals: string[] | null;
  tkd_sessions_per_week: number;
  current_injury: string | null;
  program_weeks: number | null;
  weekly_schedule: any;
  avatar_url: string | null;
  discipline: string;
  country: string | null;
  gal_license: string | null;
  gal_license_expires_at: string | null;
  has_myfightbook: boolean | null;
  myfightbook_expires_at: string | null;
  club_id?: string | null;
  club_name?: string | null;
}

interface AthletePlan {
  id: string; name: string; plan_data: any; is_active: boolean;
  created_at: string; user_id: string;
}
interface RehabPlan {
  id: string; name: string; plan_data: any; is_active: boolean;
  created_at: string; user_id: string; injury_description: string;
}

const TABS = ["overview", "manage"] as const;
type TabKey = (typeof TABS)[number];

export default function CoachAthleteOverview() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [plans, setPlans] = useState<AthletePlan[]>([]);
  const [rehabPlans, setRehabPlans] = useState<RehabPlan[]>([]);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [diaryEntries, setDiaryEntries] = useState<any[]>([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [parents, setParents] = useState<{ user_id: string; display_name: string | null }[]>([]);


  const tabParam = (searchParams.get("tab") as TabKey) || "overview";
  const activeTab: TabKey = TABS.includes(tabParam) ? tabParam : "overview";
  const setActiveTab = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  async function load() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    if (!athleteId) { navigate("/coach"); return; }

    const { data: rolesData } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const roles = (rolesData || []).map((r: any) => r.role);
    if (!roles.some((r: string) => r === "coach" || r === "admin")) {
      navigate("/dashboard");
      return;
    }

    const [profileRes, plansRes, rehabRes, clubsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, athlete_code, age, weight_kg, belt_level, experience_years, goals, tkd_sessions_per_week, current_injury, program_weeks, weekly_schedule, avatar_url, discipline, club_id, country, gal_license, gal_license_expires_at, has_myfightbook, myfightbook_expires_at")
        .eq("user_id", athleteId)
        .maybeSingle(),
      supabase
        .from("training_plans")
        .select("id, name, plan_data, is_active, created_at, user_id")
        .eq("user_id", athleteId)
        .order("created_at", { ascending: false }),
      supabase
        .from("rehab_plans")
        .select("id, name, plan_data, is_active, created_at, user_id, injury_description")
        .eq("user_id", athleteId)
        .order("created_at", { ascending: false }),
      supabase.from("clubs" as any).select("id, name"),
    ]);

    const p = profileRes.data as AthleteProfile | null;
    if (!p) {
      toast({ title: t("error"), description: t("athleteNotFound"), variant: "destructive" });
      navigate("/coach");
      return;
    }

    const clubMap = new Map<string, string>(
      ((clubsRes.data as unknown as { id: string; name: string }[] | null) ?? []).map((c) => [c.id, c.name]),
    );
    p.club_name = p.club_id ? clubMap.get(p.club_id) || null : null;

    setAthlete(p);
    setPlans((plansRes.data as AthletePlan[]) || []);
    setRehabPlans((rehabRes.data as RehabPlan[]) || []);
    setAuthorized(true);
    setLoading(false);
  }

  async function openDiary() {
    if (!athleteId) return;
    setDiaryOpen(true);
    setDiaryLoading(true);
    const { data } = await supabase
      .from("diary_entries")
      .select("id, entry_date, content, mood, energy, tags, entry_type")
      .eq("user_id", athleteId)
      .order("entry_date", { ascending: false });
    setDiaryEntries(data || []);
    setDiaryLoading(false);
  }

  if (loading || !athlete || !authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const activePlan = plans.find((p) => p.is_active);
  const hasInjury = !!(athlete.current_injury && athlete.current_injury.trim().length > 0);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Watermark />

      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 pt-safe">
        <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/coach")} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("squadTab")}
            </Button>
            <div className="flex items-center gap-1.5">
              <SendReminderDialog athleteId={athlete.user_id} athleteName={athlete.display_name} />
              <Button variant="outline" size="sm" className="h-9" onClick={openDiary}>
                <NotebookPen className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("diary")}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <AvatarImg avatarUrl={athlete.avatar_url} className="h-14 w-14 rounded-full object-cover border-2 border-border" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-extrabold text-foreground truncate">{athlete.display_name}</h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {athlete.club_name && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Building className="h-2.5 w-2.5" /> {athlete.club_name}
                  </Badge>
                )}
                {athlete.belt_level && (
                  <Badge variant="outline" className="text-[10px] capitalize">{athlete.belt_level}</Badge>
                )}
                {athlete.discipline && (
                  <Badge variant="outline" className="text-[10px] capitalize">{t(athlete.discipline)}</Badge>
                )}
                {athlete.athlete_code && (
                  <span className="text-[10px] text-muted-foreground font-mono">{athlete.athlete_code}</span>
                )}
                {hasInjury && (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <Heart className="h-2.5 w-2.5" /> {t("injured")}
                  </Badge>
                )}
                {!activePlan && (
                  <Badge className="text-[10px] bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/20">
                    {t("noPlan")}
                  </Badge>
                )}
              </div>
              <div className="mt-2">
                <CoachAvatarUpload
                  athleteId={athlete.user_id}
                  hasAvatar={!!athlete.avatar_url}
                  onUploaded={(url) => setAthlete({ ...athlete, avatar_url: url })}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full sm:w-[360px]">
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t("overview")}</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-1.5">
              <UserCog className="h-3.5 w-3.5" />
              <span>{t("manage")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-3">
            <AthleteOverviewTab
              athleteId={athlete.user_id}
              athleteName={athlete.display_name}
              plannedSessionsPerWeek={athlete.tkd_sessions_per_week || 0}
            />
          </TabsContent>

          <TabsContent value="manage" className="mt-3">
            <CoachAthleteDetail
              athlete={athlete as any}
              plans={plans}
              rehabPlans={rehabPlans}
              onRefresh={load}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={diaryOpen} onOpenChange={setDiaryOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <NotebookPen className="h-5 w-5" /> {athlete.display_name} — {t("diary")}
            </DialogTitle>
          </DialogHeader>
          {diaryLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <CoachDiaryView entries={diaryEntries as any} />
          )}
        </DialogContent>
      </Dialog>

      <AppFooter />
    </div>
  );
}
