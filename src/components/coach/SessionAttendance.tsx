import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImg } from "@/components/AvatarImg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, X, Clock, HeartCrack, BarChart3 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Athlete {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}
type Status = "present" | "absent" | "late" | "injured";
interface AttRecord {
  athlete_id: string;
  status: Status;
  rpe: number | null;
}

interface Props {
  coachId: string;
  athletes: Athlete[];
  activeClubId?: string | null;
  onOpenStats?: () => void;
}

const STATUS_TONE: { [K in Status]: { dot: string; text: string; chip: string; active: string; hover: string; ring: string } } = {
  present: {
    dot: "bg-emerald-500",
    text: "text-emerald-500",
    chip: "bg-emerald-500/10 border-emerald-500/25 text-emerald-500",
    active: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
    hover: "hover:text-emerald-500",
    ring: "border-emerald-500/40",
  },
  late: {
    dot: "bg-amber-500",
    text: "text-amber-500",
    chip: "bg-amber-500/10 border-amber-500/25 text-amber-500",
    active: "bg-amber-500 text-white shadow-lg shadow-amber-500/20",
    hover: "hover:text-amber-500",
    ring: "border-amber-500/40",
  },
  absent: {
    dot: "bg-rose-500",
    text: "text-rose-500",
    chip: "bg-rose-500/10 border-rose-500/25 text-rose-500",
    active: "bg-rose-500 text-white shadow-lg shadow-rose-500/20",
    hover: "hover:text-rose-500",
    ring: "border-rose-500/40",
  },
  injured: {
    dot: "bg-fuchsia-500",
    text: "text-fuchsia-500",
    chip: "bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-500",
    active: "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20",
    hover: "hover:text-fuchsia-500",
    ring: "border-fuchsia-500/40",
  },
};

const STATUS_ORDER: Status[] = ["present", "late", "absent", "injured"];
const STATUS_ICON: { [K in Status]: typeof Check } = {
  present: Check,
  late: Clock,
  absent: X,
  injured: HeartCrack,
};

export function SessionAttendance({ coachId, athletes, activeClubId, onOpenStats }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Map<string, AttRecord>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("session_attendance" as any)
        .select("athlete_id, status, rpe")
        .eq("session_date", date);
      if (activeClubId) q = q.eq("club_id", activeClubId);
      else q = q.eq("coach_id", coachId);
      const { data } = await q;
      const map = new Map<string, AttRecord>();
      ((data as any[]) || []).forEach((r) => map.set(r.athlete_id, r as Record));
      setRecords(map);
      setLoading(false);
    })();
  }, [coachId, date, activeClubId]);

  const setStatus = async (athleteId: string, status: Status) => {
    const existing = records.get(athleteId);
    const next: AttRecord = { athlete_id: athleteId, status, rpe: existing?.rpe ?? null };
    setRecords(new Map(records).set(athleteId, next));
    const payload: any = { coach_id: coachId, athlete_id: athleteId, session_date: date, status, rpe: next.rpe };
    if (activeClubId) payload.club_id = activeClubId;
    const { error } = await supabase
      .from("session_attendance" as any)
      .upsert(payload, { onConflict: "athlete_id,session_date" });
    if (error) toast({ title: t("error"), description: error.message, variant: "destructive" });
  };

  const setRpe = async (athleteId: string, rpe: number) => {
    const existing = records.get(athleteId);
    if (!existing) return;
    const next = { ...existing, rpe };
    setRecords(new Map(records).set(athleteId, next));
    const payload: any = { coach_id: coachId, athlete_id: athleteId, session_date: date, status: existing.status, rpe };
    if (activeClubId) payload.club_id = activeClubId;
    await supabase
      .from("session_attendance" as any)
      .upsert(payload, { onConflict: "athlete_id,session_date" });
  };

  const summary = useMemo(() => {
    const known = athletes.filter((a) => records.has(a.user_id));
    const present = known.filter((a) => {
      const s = records.get(a.user_id)!.status;
      return s === "present" || s === "late";
    });
    const rpes = present.map((a) => records.get(a.user_id)!.rpe).filter((v): v is number => typeof v === "number");
    const avgRpe = rpes.length ? (rpes.reduce((s, v) => s + v, 0) / rpes.length) : null;
    return { registered: known.length, presentCount: present.length, total: athletes.length, avgRpe };
  }, [athletes, records]);

  return (
    <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border/60 bg-gradient-to-b from-muted/20 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-[10px] font-black tracking-[0.25em] text-muted-foreground uppercase">
                {t("attendanceLive")}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-card-foreground">{t("todaysSession")}</h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenStats && (
              <Button
                variant="outline"
                size="sm"
                className="h-11 sm:h-10 rounded-2xl gap-2 px-4 font-bold"
                onClick={onOpenStats}
                aria-label={t("attendanceStats")}
                title={t("attendanceStats")}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{t("attendanceStats")}</span>
              </Button>
            )}
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[150px] h-11 sm:h-10 rounded-2xl text-xs font-bold"
            />
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {STATUS_ORDER.map((s) => (
            <span
              key={s}
              className={cn(
                "py-1.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest",
                STATUS_TONE[s].chip,
              )}
            >
              {t(s === "present" ? "present" : s === "late" ? "late" : s === "absent" ? "absent" : "injured")}
            </span>
          ))}
        </div>
      </div>

      {/* Roster */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : athletes.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">{t("noAthletes")}</div>
      ) : (
        <div className="flex flex-col">
          {athletes.map((a) => {
            const rec = records.get(a.user_id);
            const tone = rec ? STATUS_TONE[rec.status] : null;
            const showRpe = rec && (rec.status === "present" || rec.status === "late");
            const StatusIcon = rec ? STATUS_ICON[rec.status] : null;
            return (
              <div
                key={a.user_id}
                className={cn(
                  "p-4 sm:p-6 border-b border-border/40 last:border-b-0 transition-colors",
                  rec ? "bg-muted/10" : "hover:bg-muted/5",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn("relative flex-shrink-0", !rec && "opacity-60")}>
                      <div className={cn("rounded-2xl overflow-hidden border-2", tone ? tone.ring : "border-border")}>
                        <AvatarImg avatarUrl={a.avatar_url} className="h-14 w-14 rounded-2xl" />
                      </div>
                      {rec && StatusIcon && (
                        <span
                          className={cn(
                            "absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-lg border-4 border-card flex items-center justify-center",
                            tone!.dot,
                          )}
                        >
                          <StatusIcon className="h-3 w-3 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className={cn("font-black text-base sm:text-lg tracking-tight truncate", !rec && "text-muted-foreground")}>
                        {a.display_name}
                      </h4>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", tone ? tone.text : "text-muted-foreground/60")}>
                        {rec
                          ? rec.status === "present"
                            ? t("attendanceSessionActive")
                            : rec.status === "late"
                              ? t("late")
                              : rec.status === "absent"
                                ? t("absent")
                                : t("injured")
                          : t("attendanceAwaiting")}
                      </span>
                    </div>
                  </div>

                  {/* Status segment */}
                  <div className="flex gap-1.5 p-1.5 rounded-2xl bg-background/60 border border-border/60 self-start sm:self-auto">
                    {STATUS_ORDER.map((s) => {
                      const Icon = STATUS_ICON[s];
                      const isActive = rec?.status === s;
                      const label = s === "present" ? t("present") : s === "late" ? t("late") : s === "absent" ? t("absent") : t("injured");
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(a.user_id, s)}
                          aria-label={label}
                          title={label}
                          aria-pressed={isActive}
                          className={cn(
                            "h-11 w-11 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-all active:scale-90",
                            isActive ? STATUS_TONE[s].active : cn("text-muted-foreground/40", STATUS_TONE[s].hover),
                          )}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intensity module */}
                {showRpe && (
                  <div className="mt-5 rounded-3xl border border-border/60 bg-background/40 p-4 sm:p-5">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                          {t("trainingIntensity")} (RPE)
                        </span>
                      </div>
                      <div className="text-3xl font-black tracking-tighter tabular-nums text-card-foreground">
                        {rec!.rpe ?? "—"}
                        <span className="text-muted-foreground/50 text-base ml-1 font-medium">/10</span>
                      </div>
                    </div>
                    <Slider
                      value={[rec!.rpe ?? 5]}
                      onValueChange={([v]) => setRpe(a.user_id, v)}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70">{t("attendanceRpeLow")}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/70">{t("attendanceRpeModerate")}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/70">{t("attendanceRpeMax")}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary bar */}
      {!loading && athletes.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-border/60 bg-background/40 flex flex-wrap gap-6 sm:gap-12">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-1">
              {t("attendanceParticipation")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-card-foreground">{summary.presentCount}</span>
              <span className="text-muted-foreground/60 font-black text-xs uppercase">/ {summary.total}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-1">
              {t("attendanceTeamRpe")}
            </span>
            <span className="text-2xl font-black tabular-nums tracking-tighter text-primary">
              {summary.avgRpe !== null ? summary.avgRpe.toFixed(1) : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
