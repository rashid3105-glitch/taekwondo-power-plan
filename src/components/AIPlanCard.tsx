import { useState } from "react";
import { ChevronDown, ChevronUp, Shield, Dumbbell, Battery, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

  // Title
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

    // Day header
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
      // Table header
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
  const schedule = plan.plan_data?.weeklySchedule || [];
  const { toast } = useToast();

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{plan.name}</h2>
          <p className="text-xs text-muted-foreground">Generated {new Date(plan.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline ml-1">PDF</span>
          </Button>
          <span className="text-xs bg-speed/20 text-speed px-2 py-1 rounded-full font-semibold">Active</span>
        </div>
      </div>

      {/* Week overview */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
        {schedule.map((day: any, i: number) => {
          const config = TYPE_BADGES[day.type] || TYPE_BADGES.gym;
          const Icon = config.icon;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(selectedDay === i ? null : i)}
              className={`flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg border-2 p-2 sm:p-2.5 transition-all cursor-pointer hover:bg-secondary/50 ${
                selectedDay === i ? "border-primary bg-secondary" : "border-border bg-card"
              }`}
            >
              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {day.dayOfWeek?.slice(0, 3)}
              </span>
              <Icon className={`h-4 w-4 ${selectedDay === i ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[8px] sm:text-[9px] font-medium text-foreground text-center leading-tight">
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
                <AIExerciseRow key={j} exercise={ex} index={j + 1} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Follow your dojang's programming for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function AIExerciseRow({ exercise, index }: { exercise: any; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors cursor-pointer"
      >
        <span className="mono text-xs text-muted-foreground w-5">{String(index).padStart(2, "0")}</span>
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[exercise.category] || "bg-muted"}`} />
        <span className="font-semibold text-sm text-foreground flex-1 text-left">{exercise.name}</span>
        <span className="text-xs text-muted-foreground mr-2">
          {exercise.sets}×{exercise.reps}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Sets × Reps</p>
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
