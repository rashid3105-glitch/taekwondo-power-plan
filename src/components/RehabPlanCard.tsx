import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Heart, ArrowRight, Download, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";

type PdfLabels = {
  estimatedRecovery: string;
  weeks: string;
  safetyNotes: string;
  coaching: string;
  progression: string;
  progressWhen: string;
};

async function generateRehabPDF(plan: any, labels: PdfLabels) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const pageW = 210 - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > 280) addPage(); };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(plan.rehabPlanName || "Rehab Plan", margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Estimated recovery: ~${plan.estimatedWeeks} weeks`, margin, y);
  y += 6;
  if (plan.injurySummary) {
    const summaryLines = doc.splitTextToSize(plan.injurySummary, pageW);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4;
  }
  doc.setTextColor(0);
  y += 6;

  // Safety notes
  if (plan.importantNotes?.length > 0) {
    checkSpace(20);
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(margin, y, pageW, 8 + plan.importantNotes.length * 5, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38);
    doc.text("SAFETY NOTES", margin + 4, y + 6);
    doc.setTextColor(0);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const note of plan.importantNotes) {
      const noteLines = doc.splitTextToSize(`• ${note}`, pageW - 8);
      doc.text(noteLines, margin + 4, y);
      y += noteLines.length * 4;
    }
    y += 4;
  }

  // Phases
  const phaseColors: Record<number, [number, number, number]> = {
    0: [220, 38, 38],
    1: [245, 158, 11],
    2: [59, 130, 246],
    3: [34, 197, 94],
  };

  for (let i = 0; i < (plan.phases?.length || 0); i++) {
    const phase = plan.phases[i];
    checkSpace(30);
    const color = phaseColors[i] || [100, 100, 100];
    doc.setFillColor(...color);
    doc.roundedRect(margin, y, pageW, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255);
    doc.text(phase.phase, margin + 4, y + 7);
    doc.setFontSize(8);
    doc.text(`Weeks ${phase.weeks} · ${phase.goal}`, margin + pageW - 4, y + 7, { align: "right" });
    doc.setTextColor(0);
    y += 14;

    if (phase.criteria) {
      checkSpace(10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      const criteriaLines = doc.splitTextToSize(`Progress when: ${phase.criteria}`, pageW - 8);
      doc.text(criteriaLines, margin + 4, y);
      y += criteriaLines.length * 4 + 2;
      doc.setTextColor(0);
    }

    // Exercise table header
    if (phase.exercises?.length > 0) {
      checkSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("#", margin + 2, y);
      doc.text("Exercise", margin + 10, y);
      doc.text("Sets×Reps", margin + 90, y);
      doc.text("Rest", margin + 120, y);
      doc.setTextColor(0);
      y += 2;
      doc.setDrawColor(200);
      doc.line(margin, y, margin + pageW, y);
      y += 4;

      for (let j = 0; j < phase.exercises.length; j++) {
        const ex = phase.exercises[j];
        checkSpace(25);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(String(j + 1).padStart(2, "0"), margin + 2, y);
        doc.text(ex.name || "", margin + 10, y);
        doc.setFont("helvetica", "normal");
        doc.text(`${ex.sets}×${ex.reps}`, margin + 90, y);
        doc.text(ex.rest || "", margin + 120, y);
        y += 5;

        if (ex.coachingCue) {
          doc.setFontSize(8);
          doc.setTextColor(80);
          const cueLines = doc.splitTextToSize(`Coaching: ${ex.coachingCue}`, pageW - 12);
          doc.text(cueLines, margin + 10, y);
          y += cueLines.length * 3.5;
          doc.setTextColor(0);
        }

        if (ex.painGuideline) {
          doc.setFontSize(8);
          doc.setTextColor(220, 38, 38);
          const painLines = doc.splitTextToSize(`⚠ ${ex.painGuideline}`, pageW - 12);
          doc.text(painLines, margin + 10, y);
          y += painLines.length * 3.5;
          doc.setTextColor(0);
        }

        if (ex.progressionTip) {
          doc.setFontSize(8);
          doc.setTextColor(34, 197, 94);
          const progLines = doc.splitTextToSize(`Progression: ${ex.progressionTip}`, pageW - 12);
          doc.text(progLines, margin + 10, y);
          y += progLines.length * 3.5;
          doc.setTextColor(0);
        }

        y += 2;
      }
    }
    y += 6;
  }

  doc.save(`${(plan.rehabPlanName || "rehab-plan").replace(/\s+/g, "-").toLowerCase()}.pdf`);
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

interface RehabPlanCardProps {
  plan: any;
  onDelete?: () => void;
}

export function RehabPlanCard({ plan, onDelete }: RehabPlanCardProps) {
  const [openPhase, setOpenPhase] = useState<number | null>(0);
  const [downloading, setDownloading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try { await generateRehabPDF(plan); } finally { setDownloading(false); }
  };

  if (!plan) return null;

  return (
    <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <CollapsibleTrigger asChild>
            <button className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-destructive/20 transition-colors">
              {collapsed ? <ChevronDown className="h-5 w-5 text-destructive" /> : <Heart className="h-5 w-5 text-destructive" />}
            </button>
          </CollapsibleTrigger>
          <div className="min-w-0 flex-1">
            <CollapsibleTrigger asChild>
              <button className="text-left cursor-pointer">
                <h2 className="text-base font-bold text-foreground">{plan.rehabPlanName}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Estimated recovery: ~{plan.estimatedWeeks} weeks
                </p>
              </button>
            </CollapsibleTrigger>
            {!collapsed && plan.injurySummary && (
              <p className="text-sm text-muted-foreground mt-2">{plan.injurySummary}</p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-auto">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" /> PDF</>}
            </Button>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Rehab Plan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this rehab plan? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <CollapsibleContent className="space-y-4 mt-4">

      {/* Important notes */}
      {plan.importantNotes?.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs font-bold uppercase tracking-wider text-destructive">Safety Notes</span>
          </div>
          <ul className="space-y-1">
            {plan.importantNotes.map((note: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-2">
        {plan.phases?.map((phase: any, i: number) => (
          <div key={i} className={cn("rounded-xl border overflow-hidden transition-all", PHASE_COLORS[i] || "border-border bg-card")}>
            <button
              onClick={() => setOpenPhase(openPhase === i ? null : i)}
              className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              <span className={cn("h-3 w-3 rounded-full flex-shrink-0", PHASE_DOT[i] || "bg-muted")} />
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">{phase.phase}</p>
                <p className="text-xs text-muted-foreground">Weeks {phase.weeks} · {phase.goal}</p>
              </div>
              {openPhase === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {openPhase === i && (
              <div className="px-4 pb-4 space-y-3 animate-slide-up">
                {/* Progression criteria */}
                {phase.criteria && (
                  <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary font-bold mb-0.5">Progress when:</p>
                      <p className="text-xs text-foreground">{phase.criteria}</p>
                    </div>
                  </div>
                )}

                {/* Exercises */}
                {phase.exercises?.map((ex: any, j: number) => (
                  <RehabExerciseRow key={j} exercise={ex} index={j + 1} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RehabExerciseRow({ exercise, index }: { exercise: any; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className="font-semibold text-sm flex-1 text-left text-foreground">{exercise.name}</span>
        <span className="text-xs text-muted-foreground">{exercise.sets}×{exercise.reps}</span>
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
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Coaching: </span>{exercise.coachingCue}
          </p>
          <p className="text-xs text-primary/80">
            <span className="font-semibold text-primary">Why: </span>{exercise.whyItMatters}
          </p>
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
