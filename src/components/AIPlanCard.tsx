import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Dumbbell, Battery, Download, Loader2, Check, Layers, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWorkoutLogs, type WorkoutLog } from "@/hooks/useWorkoutLogs";
import { PeriodizationView } from "@/components/PeriodizationView";
import { cn } from "@/lib/utils";
import { MuscleGroupBadges } from "@/components/MuscleIcon";

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

const TYPE_BADGES: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  tkd: { label: "Taekwondo", className: "bg-gradient-energy", icon: Shield },
  gym: { label: "Gym Session", className: "bg-gradient-power", icon: Dumbbell },
  recovery: { label: "Recovery", className: "bg-speed/20 text-speed", icon: Battery },
};

interface AIPlanCardProps {
  plan: {
    id: string;
    name: string;
    plan_data: any;
    created_at: string;
  };
}

async function generatePDF(plan: AIPlanCardProps["plan"]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const schedule = plan.plan_data?.weeklySchedule || [];
  const margin = 15;
  const pageW = 210 - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > 280) addPage(); };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(plan.name, margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated ${new Date(plan.created_at).toLocaleDateString()}`, margin, y);
  y += 12;
  doc.setTextColor(0);

  for (const day of schedule) {
    checkSpace(30);
    doc.setFillColor(30, 35, 50);
    doc.roundedRect(margin, y, pageW, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255);
    doc.text(`${day.dayOfWeek} — ${day.label}`, margin + 4, y + 7);
    const typeLabel = TYPE_BADGES[day.type]?.label || day.type;
    doc.setFontSize(8);
    doc.text(typeLabel.toUpperCase(), margin + pageW - 4, y + 7, { align: "right" });
    doc.setTextColor(0);
    y += 14;

    if (day.focus) {
      checkSpace(8);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Focus: ${day.focus}`, margin + 2, y);
      doc.setTextColor(0);
      y += 6;
    }

    if (day.exercises?.length > 0) {
      checkSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("#", margin + 2, y);
      doc.text("Exercise", margin + 10, y);
      doc.text("Sets×Reps", margin + 90, y);
      doc.text("Rest", margin + 120, y);
      doc.text("Tempo", margin + 145, y);
      doc.setTextColor(0);
      y += 2;
      doc.setDrawColor(200);
      doc.line(margin, y, margin + pageW, y);
      y += 4;

      for (let j = 0; j < day.exercises.length; j++) {
        const ex = day.exercises[j];
        checkSpace(20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(String(j + 1).padStart(2, "0"), margin + 2, y);
        doc.setFont("helvetica", "bold");
        doc.text(ex.name || "", margin + 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${ex.sets}×${ex.reps}`, margin + 90, y);
        doc.text(ex.rest || "", margin + 120, y);
        doc.text(ex.tempo || "—", margin + 145, y);
        y += 5;

        if (ex.coachingCue) {
          checkSpace(8);
          doc.setFontSize(8);
          doc.setTextColor(80);
          const cueLines = doc.splitTextToSize(`Coaching: ${ex.coachingCue}`, pageW - 12);
          doc.text(cueLines, margin + 10, y);
          y += cueLines.length * 3.5;
          doc.setTextColor(0);
        }

        if (ex.whyItMatters) {
          checkSpace(8);
          doc.setFontSize(8);
          doc.setTextColor(0, 130, 130);
          const whyLines = doc.splitTextToSize(`Why for TKD: ${ex.whyItMatters}`, pageW - 12);
          doc.text(whyLines, margin + 10, y);
          y += whyLines.length * 3.5;
          doc.setTextColor(0);
        }

        if (ex.alternatives?.length > 0) {
          checkSpace(12);
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100);
          doc.text("Alternatives:", margin + 10, y);
          y += 3.5;
          doc.setFont("helvetica", "normal");
          for (const alt of ex.alternatives) {
            const altLine = doc.splitTextToSize(`• ${alt.name} — ${alt.reason}`, pageW - 14);
            doc.text(altLine, margin + 12, y);
            y += altLine.length * 3.5;
          }
          doc.setTextColor(0);
        }

        y += 3;
      }
    } else {
      checkSpace(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text("Follow your dojang's programming for this session.", margin + 4, y);
      doc.setTextColor(0);
      y += 6;
    }

    y += 6;
  }

  doc.save(`${plan.name.replace(/\s+/g, "_")}.pdf`);
}

export function AIPlanCard({ plan }: AIPlanCardProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "periodization">("schedule");
  const schedule = plan.plan_data?.weeklySchedule || [];
  const periodization = plan.plan_data?.periodization || [];
  const { toast } = useToast();
  const { upsertLog, getLog, today } = useWorkoutLogs(plan.id, selectedDay);

  const handleDownload = async () => {
    setExporting(true);
    try {
      await generatePDF(plan);
      toast({ title: "PDF downloaded!" });
    } catch {
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  // Count completed exercises for each day
  const completedCounts = schedule.map((_: any, i: number) => {
    // We only have logs for the selected day, so show a checkmark logic in the day cards
    return null;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{plan.name}</h2>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(plan.created_at).toLocaleDateString()} · Logging for {new Date(today).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline ml-1">PDF</span>
          </Button>
          <span className="text-xs bg-speed/20 text-speed px-2 py-1 rounded-full font-semibold">Active</span>
        </div>
      </div>

      {/* Tab toggle */}
      {periodization.length > 0 && (
        <div className="flex rounded-lg border border-border bg-secondary/30 p-0.5">
          <button
            onClick={() => setActiveTab("schedule")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "schedule" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Dumbbell className="h-3.5 w-3.5" /> Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab("periodization")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "periodization" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" /> Periodization
          </button>
        </div>
      )}

      {/* Periodization view */}
      {activeTab === "periodization" && periodization.length > 0 && (
        <PeriodizationView periodization={periodization} programWeeks={plan.plan_data?.programWeeks} />
      )}

      {/* Week overview */}
      {activeTab === "schedule" && (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {schedule.map((day: any, i: number) => {
              const config = TYPE_BADGES[day.type] || TYPE_BADGES.gym;
              const Icon = config.icon;
              const isSelected = selectedDay === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : i)}
                  className={`group flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg border-2 p-2 sm:p-2.5 transition-all cursor-pointer hover:bg-secondary/50 ${
                    isSelected ? "border-primary bg-secondary shadow-glow" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    isSelected 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(190_95%_50%)]" 
                      : "text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(190_95%_50%/0.5)]"
                  }`}>
                    {day.dayOfWeek?.slice(0, 3)}
                  </span>
                  <Icon className={`h-4 w-4 transition-all ${
                    isSelected 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(190_95%_50%)]" 
                      : "text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(190_95%_50%/0.5)]"
                  }`} />
                  <span className={`text-[8px] sm:text-[9px] font-medium text-center leading-tight transition-all ${
                    isSelected 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(190_95%_50%/0.8)]" 
                      : "text-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(190_95%_50%/0.5)]"
                  }`}>
                    {day.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Day detail */}
          {selectedDay !== null && schedule[selectedDay] && (
            <div className="animate-slide-up rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card">
              <div className="mb-4">
                <h3 className="font-bold text-foreground">{schedule[selectedDay].dayOfWeek} — {schedule[selectedDay].label}</h3>
                {schedule[selectedDay].focus && (
                  <p className="text-sm text-muted-foreground">{schedule[selectedDay].focus}</p>
                )}
              </div>

              {schedule[selectedDay].exercises?.length > 0 ? (
                <div className="space-y-2">
                  {schedule[selectedDay].exercises.map((ex: any, j: number) => (
                    <AIExerciseRow
                      key={j}
                      exercise={ex}
                      index={j + 1}
                      log={getLog(j)}
                      onToggleComplete={(completed) => upsertLog(j, { completed })}
                      onUpdateSets={(actual_sets) => upsertLog(j, { actual_sets })}
                      onUpdateReps={(actual_reps) => upsertLog(j, { actual_reps })}
                      onUpdateNotes={(notes) => upsertLog(j, { notes })}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Follow your dojang's programming for this session.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface AIExerciseRowProps {
  exercise: any;
  index: number;
  log?: WorkoutLog;
  onToggleComplete: (completed: boolean) => void;
  onUpdateSets: (sets: number | null) => void;
  onUpdateReps: (reps: string | null) => void;
  onUpdateNotes: (notes: string | null) => void;
}

function AIExerciseRow({ exercise, index, log, onToggleComplete, onUpdateSets, onUpdateReps, onUpdateNotes }: AIExerciseRowProps) {
  const [open, setOpen] = useState(false);
  const completed = log?.completed ?? false;

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-all",
      completed ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/30"
    )}>
      <div className="flex items-center">
        {/* Checkbox */}
        <div
          className="flex items-center justify-center px-3 py-3 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => onToggleComplete(!!checked)}
            className="h-5 w-5"
          />
        </div>

        {/* Header button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 flex items-center gap-3 px-1 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
        >
          <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[exercise.category] || "bg-muted"}`} />
          <span className={cn(
            "font-semibold text-sm flex-1 text-left",
            completed ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {exercise.name}
          </span>
          {exercise.muscleGroups?.length > 0 && (
            <MuscleGroupBadges muscles={exercise.muscleGroups} size={20} />
          )}
          <span className="text-xs text-muted-foreground mr-2">
            {log?.actual_sets ?? exercise.sets}×{log?.actual_reps ?? exercise.reps}
          </span>
          {completed && <Check className="h-4 w-4 text-primary mr-1" />}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {/* YouTube link - outside button to avoid invalid HTML nesting */}
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise form')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-2 py-3 text-muted-foreground hover:text-destructive transition-colors"
          title="Watch demo on YouTube"
        >
          <Youtube className="h-4 w-4" />
        </a>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-slide-up">
          {/* Logging inputs */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Log Your Workout</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Actual Sets</label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  placeholder={String(exercise.sets)}
                  value={log?.actual_sets ?? ""}
                  onChange={(e) => onUpdateSets(e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Actual Reps</label>
                <Input
                  type="text"
                  placeholder={exercise.reps}
                  value={log?.actual_reps ?? ""}
                  onChange={(e) => onUpdateReps(e.target.value || null)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
                <Input
                  type="text"
                  placeholder="Weight, RPE, etc."
                  value={log?.notes ?? ""}
                  onChange={(e) => onUpdateNotes(e.target.value || null)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Prescribed details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Prescribed Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>
          {exercise.muscleGroups?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Muscles:</span>
              <MuscleGroupBadges muscles={exercise.muscleGroups} size={28} showLabels />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Coaching: </span>
            {exercise.coachingCue}
          </p>
          <p className="text-xs text-primary/80">
            <span className="font-semibold text-primary">Why for TKD: </span>
            {exercise.whyItMatters}
          </p>
          {exercise.alternatives?.length > 0 && (
            <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Alternatives</p>
              {exercise.alternatives.map((alt: any, k: number) => (
                <p key={k} className="text-xs text-foreground">
                  <span className="font-semibold">{alt.name}</span>
                  <span className="text-muted-foreground"> — {alt.reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
