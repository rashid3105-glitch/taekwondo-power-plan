import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { ArrowLeft, FileText, ClipboardList, CalendarRange, IdCard, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { WeeklySquadExport } from "@/components/coach/WeeklySquadExport";
import { BulkMonthlyReportsCard } from "@/components/coach/BulkMonthlyReportsCard";
import { MonthlyDevelopmentReportsCard } from "@/components/coach/MonthlyDevelopmentReportsCard";
import { LicenseReport } from "@/components/reports/LicenseReport";

type View = "home" | "monthly" | "weekly" | "licenses";

interface Athlete {
  user_id: string;
  display_name: string;
  athlete_code: string | null;
  belt_level: string;
  weekly_schedule: any;
  avatar_url?: string | null;
  is_coach?: boolean;
}

export default function LibraryReports() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasCoachRole, loading: roleLoading } = useRole();
  const [view, setView] = useState<View>("home");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");

  useEffect(() => {
    if (!roleLoading && !hasCoachRole) navigate("/library", { replace: true });
  }, [roleLoading, hasCoachRole, navigate]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: me } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const clubId = (me as any)?.club_id as string | null;
      if (!clubId) return;
      const { data } = await supabase.rpc("get_club_member_profiles", { _club_id: clubId });
      const squad = ((data as any[]) || [])
        .filter((p) => p.user_id !== user.id && !p.is_coach)
        .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")) as Athlete[];
      setAthletes(squad);
      if (squad.length) setSelectedAthlete((prev) => prev || squad[0].user_id);
    })();
  }, []);

  const cards = [
    {
      key: "monthly",
      label: t("reportsMonthlyTitle"),
      desc: t("reportsMonthlyDesc"),
      icon: ClipboardList,
      color: "text-primary",
      onClick: () => setView("monthly"),
    },
    {
      key: "weekly",
      label: t("reportsWeeklyTitle"),
      desc: t("reportsWeeklyDesc"),
      icon: CalendarRange,
      color: "text-tab-progress",
      onClick: () => setView("weekly"),
    },
    {
      key: "licenses",
      label: t("reportsLicensesTitle"),
      desc: t("reportsLicensesDesc"),
      icon: IdCard,
      color: "text-emerald-500",
      onClick: () => setView("licenses"),
    },
    {
      key: "tests",
      label: t("reportsTestSheetsTitle"),
      desc: t("reportsTestSheetsDesc"),
      icon: FileSpreadsheet,
      color: "text-amber-500",
      onClick: () => navigate("/coach/testing/sessions"),
    },
  ];

  const onBack = () => (view === "home" ? navigate("/library") : setView("home"));

  const currentTitle =
    view === "monthly" ? t("reportsMonthlyTitle")
    : view === "weekly" ? t("reportsWeeklyTitle")
    : view === "licenses" ? t("reportsLicensesTitle")
    : t("reportsTitle");

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold text-card-foreground">{currentTitle}</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        {view === "home" && (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">{t("reportsTitle")}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t("reportsChooseDesc")}</p>
            <div className="grid gap-4">
              {cards.map((c) => (
                <button
                  key={c.key}
                  onClick={c.onClick}
                  className="flex items-center gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer text-left"
                >
                  <div className="h-12 w-12 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-center shrink-0">
                    <c.icon className={`h-6 w-6 ${c.color}`} />
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100 text-base">{c.label}</div>
                    <div className="text-sm text-zinc-400">{c.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {view === "monthly" && (
          <div className="space-y-4">
            <select
              value={selectedAthlete}
              onChange={(e) => setSelectedAthlete(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              {athletes.map((a) => (
                <option key={a.user_id} value={a.user_id}>{a.display_name}</option>
              ))}
            </select>
            {selectedAthlete && (
              <MonthlyDevelopmentReportsCard
                athleteId={selectedAthlete}
                athleteName={athletes.find((a) => a.user_id === selectedAthlete)?.display_name || ""}
              />
            )}
            {athletes.length > 0 && <BulkMonthlyReportsCard athletes={athletes as any} />}
          </div>
        )}

        {view === "weekly" && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm text-muted-foreground">{t("reportsWeeklyDesc")}</p>
            <WeeklySquadExport athletes={athletes as any} variant="inline" />
          </div>
        )}

        {view === "licenses" && <LicenseReport />}
      </main>
      <AppFooter />
    </div>
  );
}
