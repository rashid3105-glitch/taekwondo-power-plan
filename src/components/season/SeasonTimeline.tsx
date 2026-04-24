import { PHASE_META, daysBetween, type SeasonPhase, type SeasonMilestone } from "@/lib/seasonPlan";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  seasonStart: string;
  seasonEnd: string;
  phases: SeasonPhase[];
  milestones?: SeasonMilestone[];
  onPhaseClick?: (phaseId: string) => void;
  selectedPhaseId?: string | null;
}

export function SeasonTimeline({ seasonStart, seasonEnd, phases, milestones = [], onPhaseClick, selectedPhaseId }: Props) {
  const { t } = useLanguage();
  const totalDays = Math.max(1, daysBetween(seasonStart, seasonEnd) + 1);
  const today = new Date().toISOString().slice(0, 10);
  const todayOffset = (daysBetween(seasonStart, today) / totalDays) * 100;
  const inSeason = today >= seasonStart && today <= seasonEnd;

  // Month markers
  const months: { label: string; offsetPct: number }[] = [];
  const start = new Date(seasonStart);
  const end = new Date(seasonEnd);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    if (cursor >= start) {
      const offset = (daysBetween(seasonStart, cursor.toISOString().slice(0, 10)) / totalDays) * 100;
      months.push({
        label: cursor.toLocaleDateString(undefined, { month: "short" }),
        offsetPct: Math.max(0, Math.min(100, offset)),
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="space-y-2">
      {/* Phase bars */}
      <div className="relative h-12 rounded-lg overflow-hidden border border-border bg-secondary/20">
        {phases.map((p) => {
          const offset = Math.max(0, daysBetween(seasonStart, p.start_date) / totalDays) * 100;
          const width = ((daysBetween(p.start_date, p.end_date) + 1) / totalDays) * 100;
          const meta = PHASE_META[p.type];
          const isSelected = selectedPhaseId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPhaseClick?.(p.id)}
              className={cn(
                "absolute top-0 h-full border-r border-background/40 flex items-center justify-center transition-all",
                meta.colorClass,
                isSelected && "ring-2 ring-foreground ring-inset z-10"
              )}
              style={{ left: `${offset}%`, width: `${width}%` }}
              title={`${p.label || t(meta.labelKey)}: ${p.start_date} → ${p.end_date}`}
            >
              {width > 6 && (
                <span className="text-[9px] font-bold uppercase tracking-wider truncate px-1">
                  {meta.short}
                </span>
              )}
            </button>
          );
        })}

        {/* Today marker */}
        {inSeason && (
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground z-20 pointer-events-none"
            style={{ left: `${todayOffset}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-foreground" />
          </div>
        )}

        {/* Milestones (competition pins) */}
        {milestones.map((m) => {
          const offset = (daysBetween(seasonStart, m.date) / totalDays) * 100;
          if (offset < 0 || offset > 100) return null;
          return (
            <div
              key={m.id}
              className="absolute -top-1 z-30 -translate-x-1/2"
              style={{ left: `${offset}%` }}
              title={`${m.label} · ${m.date}`}
            >
              <Trophy className={cn(
                "h-3 w-3 drop-shadow",
                m.priority === "A" ? "text-explosive fill-explosive/60" :
                m.priority === "B" ? "text-accent fill-accent/40" : "text-muted-foreground"
              )} />
            </div>
          );
        })}
      </div>

      {/* Month axis */}
      <div className="relative h-3 text-[9px] text-muted-foreground font-mono">
        {months.map((m, i) => (
          <span key={i} className="absolute -translate-x-1/2" style={{ left: `${m.offsetPct}%` }}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
