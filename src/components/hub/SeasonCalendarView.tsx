import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  type ClubSeasonPlan, type ClubSeasonPhase, type ClubSeasonDayTemplate,
  PHASE_FOCUS_TAGS,
  dayOfWeekMon0, phaseForWeek, seasonWeekNumber,
  resolveSessionForDate, sessionLabelKey, sessionRowClass,
} from "@/lib/seasonCalendar";
import { cn } from "@/lib/utils";

interface Props {
  seasonPlan: ClubSeasonPlan;
  phases: ClubSeasonPhase[];
  template: ClubSeasonDayTemplate[];
}

const DAY_LABELS_SHORT = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const MONTH_NAMES = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];

export function SeasonCalendarView({ seasonPlan, phases, template }: Props) {
  const { t } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);

  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const daysInMonth = useMemo(() => {
    const days: string[] = [];
    const d = new Date(viewYear, viewMonth, 1);
    while (d.getMonth() === viewMonth) {
      days.push(d.toISOString().slice(0, 10));
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
            const s = inSeason ? resolveSessionForDate(iso, template, [], new Set()) : null;
            const wkNum = inSeason ? seasonWeekNumber(seasonPlan.start_date, iso) : null;
            const phase = wkNum ? phaseForWeek(phases, wkNum) : null;

            return (
              <div
                key={iso}
                className={cn(
                  "min-h-14 border-b border-r border-border/30 p-1.5 flex flex-col",
                  !inSeason && "opacity-30",
                  s ? sessionRowClass(s.type) : "",
                )}
                style={phase && inSeason ? { borderBottom: `2px solid ${phase.color}40` } : undefined}
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold self-start rounded-full w-5 h-5 flex items-center justify-center",
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {new Date(iso + "T00:00:00").getDate()}
                </span>
                {s && s.type !== "rest" && (
                  <span className="text-[10px] font-semibold mt-auto leading-tight">
                    {t(sessionLabelKey(s.type) as any)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 px-1">
        {[
          { type: "tkd", color: "#3b82f6", bgClass: "bg-primary/10" },
          { type: "gym", color: "#10b981", bgClass: "bg-emerald-500/10" },
          { type: "stævne", color: "#ef4444", bgClass: "bg-destructive/15" },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-sm", item.bgClass)} style={{ border: `1px solid ${item.color}` }} />
            <span className="text-xs text-muted-foreground">{t(sessionLabelKey(item.type as any) as any)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
