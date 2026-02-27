import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Zap, Shield, Dumbbell, Battery } from "lucide-react";

interface PeriodizationPhase {
  phase: string;
  weeks: string;
  startWeek: number;
  endWeek: number;
  focus: string;
  volumePercent: number;
  intensityPercent: number;
  keyChanges: string;
}

interface PeriodizationViewProps {
  periodization: PeriodizationPhase[];
  programWeeks?: number;
}

const PHASE_COLORS: Record<string, string> = {
  "anatomical adaptation": "bg-muted text-muted-foreground border-muted",
  "accumulation": "bg-primary/15 text-primary border-primary/30",
  "intensification": "bg-accent/15 text-accent border-accent/30",
  "peaking": "bg-explosive/15 text-explosive border-explosive/30",
  "deload": "bg-speed/15 text-speed border-speed/30",
  "competition": "bg-explosive/15 text-explosive border-explosive/30",
  "recovery": "bg-speed/15 text-speed border-speed/30",
};

function getPhaseColor(phase: string) {
  const key = phase.toLowerCase();
  for (const [k, v] of Object.entries(PHASE_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "bg-primary/15 text-primary border-primary/30";
}

function getPhaseIcon(phase: string) {
  const key = phase.toLowerCase();
  if (key.includes("deload") || key.includes("recovery")) return Battery;
  if (key.includes("peak") || key.includes("competition")) return Zap;
  if (key.includes("intensif")) return TrendingUp;
  if (key.includes("adaptation")) return Shield;
  return Dumbbell;
}

export function PeriodizationView({ periodization, programWeeks }: PeriodizationViewProps) {
  if (!periodization?.length) return null;

  const totalWeeks = programWeeks || periodization[periodization.length - 1]?.endWeek || 8;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Program Periodization</h3>
        <p className="text-xs text-muted-foreground">{totalWeeks}-week progression overview</p>
      </div>

      {/* Timeline bar */}
      <div className="space-y-2">
        <div className="flex rounded-lg overflow-hidden h-8 border border-border">
          {periodization.map((phase, i) => {
            const span = phase.endWeek - phase.startWeek + 1;
            const widthPercent = (span / totalWeeks) * 100;
            const colorClass = getPhaseColor(phase.phase);

            return (
              <div
                key={i}
                className={cn("flex items-center justify-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all", colorClass)}
                style={{ width: `${widthPercent}%` }}
                title={`${phase.phase}: Weeks ${phase.weeks}`}
              >
                {span >= 2 && (
                  <span className="truncate px-1">{phase.phase}</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Week markers */}
        <div className="flex justify-between px-0.5">
          {Array.from({ length: totalWeeks }, (_, i) => (
            <span key={i} className="text-[8px] text-muted-foreground font-mono w-0 text-center">
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-3">
        {periodization.map((phase, i) => {
          const Icon = getPhaseIcon(phase.phase);
          const colorClass = getPhaseColor(phase.phase);

          return (
            <div key={i} className={cn("rounded-lg border p-3 sm:p-4 space-y-3", colorClass)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{phase.phase}</p>
                    <p className="text-[10px] opacity-70 font-semibold">Weeks {phase.weeks}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs opacity-80">{phase.focus}</p>

              {/* Volume & Intensity bars */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Volume</span>
                    <span className="text-[10px] font-bold">{phase.volumePercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-background/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${phase.volumePercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-60">Intensity</span>
                    <span className="text-[10px] font-bold">{phase.intensityPercent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-background/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${phase.intensityPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key changes */}
              <p className="text-[10px] opacity-70 leading-relaxed">
                <span className="font-bold uppercase tracking-wider">Key changes: </span>
                {phase.keyChanges}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
