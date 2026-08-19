import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Footprints, Sparkles, Trophy, Play, Check, FileDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  fetchActiveEnrollment, programWeekIndex, startProgram, stopProgram,
  type RunningEnrollment,
} from "@/lib/runningProgram";
import {
  RUNNING_PROGRAMS, buildCustomProgram, fmtDuration, fmtPace, parseGoalTime,
  type RunLevel, type RunProgram,
} from "@/data/runningPrograms";
import { downloadRunningProgramPdf } from "@/lib/runningProgramPdf";


const LEVEL_KEY: Record<RunLevel, TranslationKey> = {
  beginner: "runningLevelBeginner",
  intermediate: "runningLevelIntermediate",
  advanced: "runningLevelAdvanced",
};

const LEVEL_STYLE: Record<RunLevel, string> = {
  beginner: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  intermediate: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  advanced: "bg-red-500/15 text-red-500 border-red-500/30",
};

function programLabel(p: RunProgram): string {
  if (p.goalKm >= 42) return "Marathon (42.2 km)";
  if (p.goalKm >= 21) return "Half marathon (21.1 km)";
  return `${p.goalKm} km`;
}

export function RunningLibrary() {
  const { t, locale } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);
  const [custom, setCustom] = useState<RunProgram | null>(null);
  const [goalKm, setGoalKm] = useState("7");
  const [weeks, setWeeks] = useState("8");
  const [currentKm, setCurrentKm] = useState("3");
  const [goalTime, setGoalTime] = useState("");

  const programs = useMemo(() => RUNNING_PROGRAMS, []);
  const { toast } = useToast();
  const [enrollment, setEnrollment] = useState<RunningEnrollment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadEnrollment() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEnrollment(await fetchActiveEnrollment(user.id));
  }

  useEffect(() => { void loadEnrollment(); }, []);

  async function handleStart(p: RunProgram) {
    setBusyId(p.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not_authenticated");
      await startProgram(user.id, p);
      await loadEnrollment();
      toast({ title: t("runProgStarted") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function handleStop() {
    if (!enrollment) return;
    setBusyId(enrollment.program_id);
    try {
      await stopProgram(enrollment.id);
      await loadEnrollment();
      toast({ title: t("runProgStopped") });
    } finally {
      setBusyId(null);
    }
  }

  function handleBuild() {
    const g = parseFloat(goalKm);
    const w = parseInt(weeks, 10);
    const c = parseFloat(currentKm) || 0;
    const gs = parseGoalTime(goalTime);
    if (!Number.isFinite(g) || g <= 0 || !Number.isFinite(w) || w <= 0) return;
    if (goalTime.trim() && gs === null) {
      toast({ title: t("runningGoalTimeInvalid"), variant: "destructive" });
      return;
    }
    const p = buildCustomProgram(g, w, c, gs);
    setCustom(p);
    setOpenId(p.id);
  }

  async function handlePdf(p: RunProgram) {
    const isActive = enrollment?.program_id === p.id;
    await downloadRunningProgramPdf(p, {
      locale,
      programName: `${p.id.startsWith("custom-") ? `${t("runningCustomTitle")} — ` : ""}${programLabel(p)}`,
      startDate: isActive ? enrollment?.start_date ?? null : null,
      currentWeek: isActive && enrollment ? programWeekIndex(enrollment.start_date, enrollment.weeks) : null,
    });
  }

  const displayed: RunProgram[] = custom ? [...programs, custom] : programs;


  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("runningIntro")}</p>

      <div className="space-y-3">
        {displayed.map((p) => {
          const isOpen = openId === p.id;
          const isActive = enrollment?.program_id === p.id;
          return (
            <div key={p.id} className={`rounded-xl border bg-card overflow-hidden ${isActive ? "border-emerald-500/50" : "border-border"}`}>
              <button
                onClick={() => setOpenId(isOpen ? null : p.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
              >
                <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/15 text-primary flex-shrink-0">
                  {p.goalKm >= 21 ? <Trophy className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-card-foreground text-sm truncate">
                    {p.id.startsWith("custom-") ? `${t("runningCustomTitle")} — ${programLabel(p)}` : programLabel(p)}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span>{p.weeks} {t("runningWeeksLabel")}</span>
                    <span>{p.perWeek} {t("runningPerWeekLabel")}</span>
                    {p.goalSeconds ? (
                      <span className="inline-flex items-center px-1.5 rounded border border-primary/40 bg-primary/10 text-primary text-[10px] font-semibold">
                        {fmtDuration(p.goalSeconds)} · {fmtPace(p.goalSeconds / p.goalKm)}/km
                      </span>
                    ) : null}
                    <span className={`inline-flex items-center px-1.5 rounded border text-[10px] font-semibold ${LEVEL_STYLE[p.level]}`}>
                      {t(LEVEL_KEY[p.level])}
                    </span>
                    {isActive && enrollment && (
                      <span className="inline-flex items-center gap-1 px-1.5 rounded border border-emerald-500/40 bg-emerald-500/15 text-emerald-600 text-[10px] font-semibold">
                        <Check className="h-3 w-3" />
                        {t("runProgActive")} · {t("runningWeekLabel")} {programWeekIndex(enrollment.start_date, enrollment.weeks)}/{enrollment.weeks}
                      </span>
                    )}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 animate-slide-up">
                  <p className="text-xs text-card-foreground/80 leading-relaxed">{p.overview}</p>
                  <div className="flex gap-2">
                    {isActive ? (
                      <Button size="sm" variant="outline" className="flex-1" disabled={busyId === p.id} onClick={handleStop}>
                        {t("runProgStop")}
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1" disabled={busyId === p.id} onClick={() => handleStart(p)}>
                        <Play className="h-3.5 w-3.5 mr-1" />
                        {enrollment ? t("runProgSwitch") : t("runProgStart")}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => void handlePdf(p)} title={t("runProgDownloadPdf")}>
                      <FileDown className="h-3.5 w-3.5 mr-1" />
                      {t("runProgDownloadPdf")}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {p.plan.map((w) => (
                      <div key={w.week} className="rounded-lg border border-border bg-background/50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-card-foreground">
                            {t("runningWeekLabel")} {w.week}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{w.totalKm} km</span>
                        </div>
                        <ul className="space-y-1.5">
                          {w.sessions.map((s, i) => (
                            <li key={i} className="text-[12px] text-card-foreground/85 leading-relaxed flex gap-2">
                              <span className="font-semibold text-primary shrink-0 w-16">{s.focus}</span>
                              <span className="flex-1">{s.detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom builder */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm text-card-foreground">{t("runningCustomTitle")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("runningCustomDesc")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <Label className="text-[11px]" htmlFor="goalKm">{t("runningCustomGoalKm")}</Label>
            <Input id="goalKm" inputMode="decimal" value={goalKm} onChange={(e) => setGoalKm(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px]" htmlFor="weeks">{t("runningCustomWeeks")}</Label>
            <Input id="weeks" inputMode="numeric" value={weeks} onChange={(e) => setWeeks(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px]" htmlFor="currentKm">{t("runningCustomCurrentKm")}</Label>
            <Input id="currentKm" inputMode="decimal" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-[11px]" htmlFor="goalTime">{t("runningCustomGoalTime")}</Label>
            <Input id="goalTime" inputMode="numeric" placeholder="50:00" value={goalTime} onChange={(e) => setGoalTime(e.target.value)} className="h-9" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("runningGoalTimeHint")}</p>
        <Button onClick={handleBuild} size="sm" className="w-full">{t("runningCustomBuild")}</Button>
      </div>
    </div>
  );
}
