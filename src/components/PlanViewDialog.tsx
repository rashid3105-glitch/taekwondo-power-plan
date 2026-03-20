import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Shield, Dumbbell, Battery, ChevronDown, ChevronUp } from "lucide-react";
import { MuscleGroupBadges } from "@/components/MuscleIcon";
import { PeriodizationView } from "@/components/PeriodizationView";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
      for (let j = 0; j < day.exercises.length; j++) {
        const ex = day.exercises[j];
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
    y += 6;
  }

  doc.save(`${plan.name.replace(/\s+/g, "_")}.pdf`);
}

export function PlanViewDialog({ open, onOpenChange, plan }: PlanViewDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  if (!plan) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold truncate">{plan.name}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generated {new Date(plan.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={exporting} className="flex-shrink-0">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="ml-1">PDF</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Weekly Schedule */}
          {schedule.length > 0 && (
            <div className="space-y-2">
              {schedule.map((day: any, i: number) => {
                const config = TYPE_BADGES[day.type] || TYPE_BADGES.gym;
                const Icon = config.icon;
                const isExpanded = expandedDays.has(i);

                return (
                  <div key={i} className="rounded-lg border border-border bg-secondary/20 overflow-hidden">
                    <button
                      onClick={() => toggleDay(i)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground w-8">
                        {day.dayOfWeek?.slice(0, 3)}
                      </span>
                      <span className="text-sm font-semibold text-foreground flex-1 text-left">{day.label}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
                                <span className="text-sm font-semibold text-foreground flex-1">{ex.name}</span>
                                {ex.muscleGroups?.length > 0 && (
                                  <MuscleGroupBadges muscles={ex.muscleGroups} size={18} />
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
          )}

          {/* Periodization */}
          {periodization.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Periodization</h4>
              <PeriodizationView periodization={periodization} programWeeks={plan.plan_data?.programWeeks} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
