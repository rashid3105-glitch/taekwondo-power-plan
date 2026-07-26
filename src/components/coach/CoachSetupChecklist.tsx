import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { CheckCircle2, Circle, ChevronRight, X, Rocket } from "lucide-react";

type StepKey = "schedule" | "season" | "athletes" | "visibility";

type Step = {
  key: StepKey;
  title: string;
  desc: string;
  done: boolean;
  optional?: boolean;
  route: string;
};

/**
 * "Kom godt i gang"-checklist for coaches.
 * Read-only: derives status from existing tables for the active club.
 * Never rendered for athletes.
 */
export function CoachSetupChecklist() {
  const { role } = useRole();
  const { activeClubId } = useActiveClub();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasSeason, setHasSeason] = useState(false);
  const [hasAthletes, setHasAthletes] = useState(false);
  const [hasVisibility, setHasVisibility] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const storageKey = activeClubId ? `coachSetupDismissed:${activeClubId}` : null;

  useEffect(() => {
    if (role !== "coach" || !activeClubId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      // Each query is isolated: a failure degrades to "not completed".
      const [scheduleRes, seasonRes, athleteRes] = await Promise.all([
        supabase.from("clubs" as any).select("default_weekly_schedule").eq("id", activeClubId).maybeSingle(),
        supabase.from("club_season_plans" as any).select("id").eq("club_id", activeClubId).limit(1),
        supabase.rpc("get_club_member_profiles" as any, { _club_id: activeClubId }),
      ]);

      if (!mounted) return;

      setHasSchedule(!!(scheduleRes.data as any)?.default_weekly_schedule);

      const planIds = ((seasonRes.data as any[]) ?? []).map((p) => p.id as string);
      setHasSeason(planIds.length > 0);

      const { data: { user } } = await supabase.auth.getUser();
      const athletes = ((athleteRes.data as any[]) ?? []).filter(
        (m) => !m.is_coach && m.user_id !== user?.id,
      );
      if (!mounted) return;
      setHasAthletes(athletes.length > 0);

      if (planIds.length > 0) {
        const { data: visData } = await supabase
          .from("club_season_plan_visibility" as any)
          .select("id")
          .in("season_plan_id", planIds)
          .limit(1);
        if (!mounted) return;
        setHasVisibility(((visData as any[]) ?? []).length > 0);
      } else {
        setHasVisibility(false);
      }

      setLoading(false);
    })().catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [role, activeClubId]);

  const coreDone = [hasSchedule, hasSeason, hasAthletes].filter(Boolean).length;
  const allCoreDone = coreDone === 3;

  // Restore dismissal, but show the card again if a core step became incomplete.
  useEffect(() => {
    if (!storageKey) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    setDismissed(stored === "1" && allCoreDone);
  }, [storageKey, allCoreDone]);

  if (role !== "coach" || !activeClubId || loading || dismissed) return null;

  const steps: Step[] = [
    {
      key: "schedule",
      title: t("coachSetupStepSchedule"),
      desc: t("coachSetupStepScheduleDesc"),
      done: hasSchedule,
      route: "/coach",
    },
    {
      key: "season",
      title: t("coachSetupStepSeason"),
      desc: t("coachSetupStepSeasonDesc"),
      done: hasSeason,
      route: "/coach/season-calendar",
    },
    {
      key: "athletes",
      title: t("coachSetupStepAthletes"),
      desc: t("coachSetupStepAthletesDesc"),
      done: hasAthletes,
      route: "/coach",
    },
    {
      key: "visibility",
      title: t("coachSetupStepVisibility"),
      desc: t("coachSetupStepVisibilityDesc"),
      done: hasVisibility,
      optional: true,
      route: "/coach/season-calendar",
    },
  ];

  const dismiss = () => {
    if (storageKey) window.localStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-bold text-card-foreground truncate">{t("coachSetupTitle")}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {allCoreDone
              ? t("coachSetupDone")
              : t("coachSetupProgress").replace("{done}", String(coreDone)).replace("{total}", "3")}
          </p>
        </div>
        {allCoreDone && (
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("coachSetupDismiss")}
            title={t("coachSetupDismiss")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(coreDone / 3) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.key}>
            <button
              type="button"
              onClick={() => navigate(step.route)}
              className="w-full text-left flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3 hover:bg-muted/50 transition-colors"
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${step.done ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
                  {step.title}
                  {step.optional && (
                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5 no-underline">
                      {t("coachSetupOptional")}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground mt-0.5">{step.desc}</span>
              </span>
              <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
