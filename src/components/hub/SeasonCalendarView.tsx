import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  type ClubSeasonPlan, type ClubSeasonPhase, type ClubSeasonDayTemplate,
  type AthleteSeasonOverride, type SessionType,
  PHASE_FOCUS_TAGS,
  dayOfWeekMon0, phaseForWeek, seasonWeekNumber,
  resolveSessionForDate, resolveSessionsForDate, sessionDotColor,
  sessionLabelKey, sessionRowClass,
} from "@/lib/seasonCalendar";
import { cn } from "@/lib/utils";

interface Props {
  seasonPlan: ClubSeasonPlan;
  phases: ClubSeasonPhase[];
  template: ClubSeasonDayTemplate[];
}

const DAY_LABELS_SHORT = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];

type WeekFocus = { teamTechIds: string[]; teamNote: string; athleteTechIds: string[] };

export function SeasonCalendarView({ seasonPlan, phases, template }: Props) {
  const { t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);

  const [competitionDates, setCompetitionDates] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<AthleteSeasonOverride[]>([]);
  const [weekFocusMap, setWeekFocusMap] = useState<Map<number, WeekFocus>>(new Map());
  const [techMap, setTechMap] = useState<Map<string, { name: string; category: string }>>(new Map());
  const todayWeekNumInit = seasonWeekNumber(seasonPlan.start_date, today);
  const initialWeek =
    today >= seasonPlan.start_date && today <= seasonPlan.end_date ? todayWeekNumInit : null;
  const [selectedWeek, setSelectedWeek] = useState<number | null>(initialWeek);

  // Re-sync the selected week when the plan changes (e.g. club switch) or the day rolls over,
  // so the highlighted week in the grid matches the "today" banner above.
  useEffect(() => {
    if (today >= seasonPlan.start_date && today <= seasonPlan.end_date) {
      setSelectedWeek(seasonWeekNumber(seasonPlan.start_date, today));
    } else {
      setSelectedWeek(null);
    }
  }, [seasonPlan.start_date, seasonPlan.end_date, today]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [compsRes, ovRes, techFocusRes, athTechRes] = await Promise.all([
        supabase
          .from("competitions")
          .select("event_date")
          .eq("user_id", user.id)
          .gte("event_date", seasonPlan.start_date)
          .lte("event_date", seasonPlan.end_date),
        supabase
          .from("club_athlete_season_overrides")
          .select("*")
          .eq("season_plan_id", seasonPlan.id)
          .eq("athlete_id", user.id),
        (supabase.from as any)("club_week_technique_focus")
          .select("season_week, technique_ids, coach_note")
          .eq("season_plan_id", seasonPlan.id),
        (supabase.from as any)("athlete_week_technique_focus")
          .select("season_week, technique_ids")
          .eq("season_plan_id", seasonPlan.id)
          .eq("athlete_id", user.id),
      ]);
      if (cancelled) return;
      setCompetitionDates(new Set((compsRes.data ?? []).map((c: any) => c.event_date as string)));
      setOverrides(((ovRes.data ?? []) as any[]).map((o) => ({
        ...o,
        session_type: o.session_type as SessionType | null,
      })) as AthleteSeasonOverride[]);

      const allTechIds = [
        ...((techFocusRes.data ?? []) as any[]).flatMap((r: any) => r.technique_ids ?? []),
        ...((athTechRes.data ?? []) as any[]).flatMap((r: any) => r.technique_ids ?? []),
      ];
      const uniqueTechIds = [...new Set(allTechIds)];
      const tm = new Map<string, { name: string; category: string }>();
      if (uniqueTechIds.length > 0) {
        const { data: techs } = await (supabase.from as any)("club_techniques")
          .select("id, name, category").in("id", uniqueTechIds);
        for (const tt of (techs ?? []) as any[]) tm.set(tt.id, { name: tt.name, category: tt.category });
      }

      const wfm = new Map<number, WeekFocus>();
      for (const row of (techFocusRes.data ?? []) as any[]) {
        wfm.set(row.season_week, { teamTechIds: row.technique_ids ?? [], teamNote: row.coach_note ?? "", athleteTechIds: [] });
      }
      for (const row of (athTechRes.data ?? []) as any[]) {
        const existing = wfm.get(row.season_week) ?? { teamTechIds: [], teamNote: "", athleteTechIds: [] };
        wfm.set(row.season_week, { ...existing, athleteTechIds: row.technique_ids ?? [] });
      }

      if (cancelled) return;
      setWeekFocusMap(wfm);
      setTechMap(tm);
    })();
    return () => { cancelled = true; };
  }, [seasonPlan.id, seasonPlan.start_date, seasonPlan.end_date]);


  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const daysInMonth = useMemo(() => {
    const days: string[] = [];
    const d = new Date(viewYear, viewMonth, 1);
    const toLocalIso = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    while (d.getMonth() === viewMonth) {
      days.push(toLocalIso(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [viewYear, viewMonth]);

  const firstDow = dayOfWeekMon0(daysInMonth[0]);
  const paddedDays: (string | null)[] = [
    ...Array(firstDow).fill(null),
    ...daysInMonth,
  ];
  while (paddedDays.length % 7 !== 0) paddedDays.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const todayWeekNum = seasonWeekNumber(seasonPlan.start_date, today);
  const currentPhase = phaseForWeek(phases, todayWeekNum);

  return (
    <div className="space-y-3">
      {currentPhase && (
        <div
          className="rounded-xl px-4 py-2.5 flex items-start gap-3"
          style={{ background: `${currentPhase.color}18`, borderLeft: `4px solid ${currentPhase.color}` }}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold" style={{ color: currentPhase.color }}>
              {t("seasonCurrentPhase")}: {currentPhase.name}
            </p>
            {currentPhase.focus_label && (
              <p className="text-xs text-muted-foreground">{currentPhase.focus_label}</p>
            )}
            {(currentPhase.focus_tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {(currentPhase.focus_tags ?? []).map((tag) => {
                  const meta = PHASE_FOCUS_TAGS.find((m) => m.value === tag);
                  return (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${currentPhase.color}25`, color: currentPhase.color }}>
                      {meta ? t(meta.labelKey as any) : tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {(() => {
        const inSeasonNow = today >= seasonPlan.start_date && today <= seasonPlan.end_date;
        const displayWeek = selectedWeek ?? (inSeasonNow ? todayWeekNum : null);
        if (displayWeek === null) return null;
        const focus = weekFocusMap.get(displayWeek);
        const teamTechs = (focus?.teamTechIds ?? [])
          .map((id) => techMap.get(id))
          .filter(Boolean) as { name: string; category: string }[];
        const teamNote = (focus?.teamNote ?? "").trim();
        const hasAny = teamTechs.length > 0 || teamNote.length > 0;

        const startMs = new Date(seasonPlan.start_date + "T00:00:00").getTime();
        const wkStart = new Date(startMs + (displayWeek - 1) * 7 * 86400000)
          .toISOString().slice(0, 10);
        const wkEnd = new Date(startMs + ((displayWeek - 1) * 7 + 6) * 86400000)
          .toISOString().slice(0, 10);

        return (
          <Card className="p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">
                👥 {t("seasonTeamFocus" as any)?.toString().split("(")[0].trim() || "Team focus"} · {t("seasonWeek")} {displayWeek}
              </span>
              <span className="text-[11px] text-muted-foreground">{wkStart} – {wkEnd}</span>
            </div>
            {hasAny ? (
              <>
                {teamTechs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {teamTechs.map((tech, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-primary"
                      >
                        {tech.name}
                      </span>
                    ))}
                  </div>
                )}
                {teamNote && (
                  <p className="text-xs text-muted-foreground italic whitespace-pre-wrap">
                    "{teamNote}"
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {t("seasonTeamFocusNotSet")}
              </p>
            )}
          </Card>
        );
      })()}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {DAY_LABELS_SHORT.map(d => (
            <div key={d} className="text-center py-1.5 text-[11px] font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {paddedDays.map((iso, i) => {
            if (!iso) return <div key={`empty-${i}`} className="min-h-14 border-b border-r border-border/30 bg-muted/20" />;

            const inSeason = iso >= seasonPlan.start_date && iso <= seasonPlan.end_date;
            const isToday = iso === today;
            const sessions = inSeason
              ? resolveSessionsForDate(iso, template, overrides, competitionDates)
              : [];
            const s = sessions[0] ?? null;
            const isCompetition = sessions.some((ss) => ss.type === "stævne");
            const dotTypes = [...new Set(
              sessions.filter(ss => ss.type !== "rest").map(ss => ss.type)
            )].slice(0, 3);
            const wkNum = inSeason ? seasonWeekNumber(seasonPlan.start_date, iso) : null;
            const phase = wkNum ? phaseForWeek(phases, wkNum) : null;
            const hasTkd = sessions.some((ss) => ss.type === "tkd");
            const hasFocus = wkNum !== null && hasTkd && (weekFocusMap.get(wkNum)?.teamTechIds?.length ?? 0) > 0;
            const isSelected = wkNum !== null && wkNum === selectedWeek;

            const focusTechs = hasFocus
              ? (weekFocusMap.get(wkNum!)?.teamTechIds ?? [])
                  .map(id => techMap.get(id))
                  .filter(Boolean) as { name: string; category: string }[]
              : [];

            return (
              <div
                key={iso}
                onClick={() => {
                  if (!inSeason || !wkNum) return;
                  setSelectedWeek(prev => prev === wkNum ? null : wkNum);
                }}
                title={wkNum !== null ? (weekFocusMap.get(wkNum)?.teamNote || undefined) : undefined}
                className={cn(
                  "min-h-[58px] border-b border-r border-border/30 p-1.5 flex flex-col cursor-pointer transition-colors hover:bg-muted/30",
                  !inSeason && "opacity-30 cursor-default pointer-events-none",
                  isSelected && "ring-2 ring-inset ring-primary",
                  isCompetition ? "bg-destructive/15" : "",
                )}
                style={phase && inSeason ? { borderBottom: `2px solid ${phase.color}40` } : undefined}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold self-start rounded-full w-5 h-5 flex items-center justify-center",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isCompetition
                        ? "bg-destructive/15 text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {new Date(iso + "T00:00:00").getDate()}
                </span>
                {focusTechs.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {focusTechs.slice(0, 2).map((tech, i) => (
                      <span
                        key={i}
                        className="text-[8px] leading-tight px-1 py-0.5 rounded bg-primary/15 text-primary font-medium truncate max-w-full"
                      >
                        {tech.name}
                      </span>
                    ))}
                    {focusTechs.length > 2 && (
                      <span className="text-[8px] leading-tight px-1 py-0.5 rounded bg-primary/15 text-primary font-medium">
                        +{focusTechs.length - 2}
                      </span>
                    )}
                  </div>
                )}
                {dotTypes.length > 0 && (
                  <div className="flex gap-0.5 mt-auto pt-0.5 justify-center">
                    {dotTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded-full flex-shrink-0"
                        style={{
                          width: type === "stævne" ? "7px" : "5px",
                          height: type === "stævne" ? "7px" : "5px",
                          backgroundColor: sessionDotColor(type),
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {selectedWeek !== null && (() => {
        const focus = weekFocusMap.get(selectedWeek);
        const teamTechs = (focus?.teamTechIds ?? []).map(id => techMap.get(id)).filter(Boolean) as { name: string; category: string }[];
        const athTechs = (focus?.athleteTechIds ?? []).map(id => techMap.get(id)).filter(Boolean) as { name: string; category: string }[];
        const startMs = new Date(seasonPlan.start_date + "T00:00:00").getTime();
        const wkStart = new Date(startMs + (selectedWeek - 1) * 7 * 86400000).toISOString().slice(0, 10);
        const wkEnd = new Date(startMs + ((selectedWeek - 1) * 7 + 6) * 86400000).toISOString().slice(0, 10);

        if (!focus || (teamTechs.length === 0 && athTechs.length === 0)) {
          return (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold">🎯 {t("seasonWeek") || "Uge"} {selectedWeek}</span>
                <span className="text-xs text-muted-foreground">{wkStart} – {wkEnd}</span>
              </div>
              <p className="text-xs text-muted-foreground italic">{t("seasonNoTechniquesFocus") || "Ingen teknikfokus sat for denne uge."}</p>
            </Card>
          );
        }

        return (
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold">🎯 {t("seasonWeek") || "Uge"} {selectedWeek}</span>
              <span className="text-xs text-muted-foreground">{wkStart} – {wkEnd}</span>
            </div>

            <div className="p-4 space-y-4">
              {teamTechs.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    👥 {t("seasonTeamFocus") || "Hold-fokus"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {teamTechs.map((tech, i) => (
                      <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary">
                        {tech.name}
                      </span>
                    ))}
                  </div>
                  {focus.teamNote && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{focus.teamNote}"</p>
                  )}
                </div>
              )}

              {athTechs.length > 0 && (
                <>
                  {teamTechs.length > 0 && <div className="h-px bg-border" />}
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      🎯 {t("seasonIndividualFocus") || "Din individuelle fokus"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {athTechs.map((tech, i) => (
                        <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-violet-100 border border-violet-300 text-violet-700">
                          {tech.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      })()}

      <div className="flex flex-wrap gap-3 px-1">
        {[
          { type: "tkd" as SessionType,     size: 5 },
          { type: "gym" as SessionType,     size: 5 },
          { type: "stævne" as SessionType,  size: 7 },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-1.5">
            <span
              className="rounded-full flex-shrink-0"
              style={{
                width: item.size,
                height: item.size,
                backgroundColor: sessionDotColor(item.type),
              }}
            />
            <span className="text-xs text-muted-foreground">{t(sessionLabelKey(item.type) as any)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
