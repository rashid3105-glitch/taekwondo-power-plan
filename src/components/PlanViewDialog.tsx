import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Shield, Dumbbell, Battery, ChevronDown, ChevronUp, Heart, AlertTriangle, ArrowRight } from "lucide-react";
import { MuscleGroupBadges } from "@/components/MuscleIcon";
import { PeriodizationView } from "@/components/PeriodizationView";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { normalizeDaySessions, type PlanSession } from "@/lib/planSessionUtils";

const TYPE_BADGES: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  tkd: { label: "Taekwondo", className: "bg-gradient-energy", icon: Shield },
  gym: { label: "Gym Session", className: "bg-gradient-power", icon: Dumbbell },
  recovery: { label: "Recovery", className: "bg-speed/20 text-speed", icon: Battery },
};

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

interface PlanViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    plan_data: any;
    created_at: string;
  } | null;
  rehabPlan?: {
    id: string;
    name: string;
    plan_data: any;
    created_at: string;
    injury_description?: string;
  } | null;
}

async function generatePDF(plan: PlanViewDialogProps["plan"]) {
  if (!plan) return;
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
    checkSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 35, 50);
    doc.text(day.dayOfWeek, margin, y);
    doc.setTextColor(0);
    y += 8;

    const sessions = normalizeDaySessions(day);
    for (const session of sessions) {
      const typeLabel = TYPE_BADGES[session.type]?.label || session.type;
      checkSpace(30);
      doc.setFillColor(30, 35, 50);
      doc.roundedRect(margin, y, pageW, 10, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255);
      doc.text(session.label || "", margin + 4, y + 7);
      doc.setFontSize(8);
      doc.text(typeLabel.toUpperCase(), margin + pageW - 4, y + 7, { align: "right" });
      doc.setTextColor(0);
      y += 14;

      if (session.focus) {
        checkSpace(8);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Focus: ${session.focus}`, margin + 2, y);
        doc.setTextColor(0);
        y += 6;
      }

      const exercises = session.exercises || [];
      if (exercises.length > 0) {
        for (let j = 0; j < exercises.length; j++) {
          const ex = exercises[j];
          checkSpace(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(`${String(j + 1).padStart(2, "0")}. ${ex.name || ""}`, margin + 2, y);
          doc.setFont("helvetica", "normal");
          doc.text(`${ex.sets}×${ex.reps}  Rest: ${ex.rest || "—"}`, margin + 90, y);
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
          y += 3;
        }
      } else {
        checkSpace(10);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(120);
        doc.text("Follow your dojang's programming.", margin + 4, y);
        doc.setTextColor(0);
        y += 6;
      }
      y += 4;
    }
    y += 4;
  }

  doc.save(`${plan.name.replace(/\s+/g, "_")}.pdf`);
}

const PHASE_COLORS: Record<number, string> = {
  0: "border-destructive/40 bg-destructive/5",
  1: "border-accent/40 bg-accent/5",
  2: "border-primary/40 bg-primary/5",
  3: "border-speed/40 bg-speed/5",
};

const PHASE_DOT: Record<number, string> = {
  0: "bg-destructive",
  1: "bg-accent",
  2: "bg-primary",
  3: "bg-speed",
};

function TrainingPlanContent({ plan }: { plan: NonNullable<PlanViewDialogProps["plan"]> }) {
  const [exporting, setExporting] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const schedule = plan.plan_data?.weeklySchedule || [];
  const periodization = plan.plan_data?.periodization || [];

  const toggleDay = (i: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

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

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold truncate text-foreground">{plan.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={exporting} className="flex-shrink-0">
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="ml-1">PDF</span>
        </Button>
      </div>

      <div className="space-y-2">
        {schedule.map((day: any, i: number) => {
          const config = TYPE_BADGES[day.type] || TYPE_BADGES.gym;
          const Icon = config.icon;
          const isExpanded = expandedDays.has(i);

          return (
            <div key={i} className="rounded-lg border border-border bg-secondary/20 overflow-hidden">
              <button
                onClick={() => toggleDay(i)}
                className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer"
              >
                <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-8">
                  {day.dayOfWeek?.slice(0, 3)}
                </span>
                <span className="text-sm font-semibold text-foreground flex-1 text-left truncate">{day.label}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:inline">
                  {config.label}
                </span>
                {day.exercises?.length > 0 && (
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    {day.exercises.length}
                  </span>
                )}
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border animate-slide-up">
                  {day.focus && (
                    <p className="text-xs text-muted-foreground italic">Focus: {day.focus}</p>
                  )}

                  {day.exercises?.length > 0 ? (
                    day.exercises.map((ex: any, j: number) => (
                      <div key={j} className="rounded-md border border-border bg-card p-2.5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono w-5">{String(j + 1).padStart(2, "0")}</span>
                          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[ex.category] || "bg-muted"}`} />
                          <span className="text-sm font-semibold text-foreground flex-1 truncate">{ex.name}</span>
                          {ex.muscleGroups?.length > 0 && (
                            <MuscleGroupBadges muscles={ex.muscleGroups} size={18} />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-muted-foreground">
                          <span><strong className="text-foreground">{ex.sets}×{ex.reps}</strong></span>
                          <span>Rest: {ex.rest}</span>
                          {ex.tempo && <span>Tempo: {ex.tempo}</span>}
                        </div>
                        {ex.coachingCue && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Coaching:</span> {ex.coachingCue}
                          </p>
                        )}
                        {ex.whyItMatters && (
                          <p className="text-xs text-primary/80">
                            <span className="font-semibold text-primary">Why for TKD:</span> {ex.whyItMatters}
                          </p>
                        )}
                        {ex.alternatives?.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-semibold">Alternatives:</span>{" "}
                            {ex.alternatives.map((alt: any) => alt.name).join(", ")}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">
                      Follow your dojang's programming for this session.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {periodization.length > 0 && (
        <div className="space-y-2 mt-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Periodization</h4>
          <PeriodizationView periodization={periodization} programWeeks={plan.plan_data?.programWeeks} />
        </div>
      )}
    </>
  );
}

function RehabPlanContent({ rehabPlan }: { rehabPlan: NonNullable<PlanViewDialogProps["rehabPlan"]> }) {
  const [openPhase, setOpenPhase] = useState<number | null>(0);
  const planData = rehabPlan.plan_data;

  if (!planData) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-foreground">{planData.rehabPlanName || rehabPlan.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Estimated recovery: ~{planData.estimatedWeeks} weeks
        </p>
        {planData.injurySummary && (
          <p className="text-sm text-muted-foreground mt-2">{planData.injurySummary}</p>
        )}
      </div>

      {/* Safety notes */}
      {planData.importantNotes?.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">Safety Notes</span>
          </div>
          <ul className="space-y-1">
            {planData.importantNotes.map((note: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phases */}
      {planData.phases?.map((phase: any, i: number) => (
        <div key={i} className={cn("rounded-xl border overflow-hidden transition-all", PHASE_COLORS[i] || "border-border bg-card")}>
          <button
            onClick={() => setOpenPhase(openPhase === i ? null : i)}
            className="w-full flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
          >
            <span className={cn("h-3 w-3 rounded-full flex-shrink-0", PHASE_DOT[i] || "bg-muted")} />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{phase.phase}</p>
              <p className="text-xs text-muted-foreground">Weeks {phase.weeks} · {phase.goal}</p>
            </div>
            {openPhase === i ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </button>

          {openPhase === i && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 animate-slide-up">
              {phase.criteria && (
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-0.5">Progress when:</p>
                    <p className="text-xs text-foreground">{phase.criteria}</p>
                  </div>
                </div>
              )}

              {phase.exercises?.map((ex: any, j: number) => (
                <RehabExerciseInline key={j} exercise={ex} index={j + 1} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RehabExerciseInline({ exercise, index }: { exercise: any; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className="font-semibold text-sm flex-1 text-left text-foreground truncate">{exercise.name}</span>
        <span className="text-xs text-muted-foreground flex-shrink-0">{exercise.sets}×{exercise.reps}</span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="rounded-md bg-muted p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>
          {exercise.coachingCue && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Coaching: </span>{exercise.coachingCue}
            </p>
          )}
          {exercise.painGuideline && (
            <div className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{exercise.painGuideline}</span>
            </div>
          )}
          {exercise.progressionTip && (
            <p className="text-xs text-accent">
              <span className="font-semibold">Progression: </span>{exercise.progressionTip}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function PlanViewDialog({ open, onOpenChange, plan, rehabPlan }: PlanViewDialogProps) {
  const isMobile = useIsMobile();

  if (!plan && !rehabPlan) return null;

  const content = (
    <div className="space-y-4">
      {plan && <TrainingPlanContent plan={plan} />}
      {rehabPlan && (
        <>
          {plan && <div className="border-t border-border pt-4" />}
          <RehabPlanContent rehabPlan={rehabPlan} />
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{plan?.name || rehabPlan?.name || "Plan"}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{plan?.name || rehabPlan?.name || "Plan"}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
