import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

interface Athlete {
  user_id: string;
  display_name: string;
  athlete_code: string | null;
  belt_level: string;
  weekly_schedule: any;
}

interface Props {
  athletes: Athlete[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WeeklySquadExport({ athletes }: Props) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 30;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(t("weeklySquadOverview") || "Weekly squad overview", margin, 40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString(), margin, 58);

      const colWidth = (pageWidth - margin * 2 - 140) / 7;
      let y = 90;

      // Header row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(t("athlete") || "Athlete", margin, y);
      DAYS.forEach((d, i) => {
        const label = t(d as any);
        doc.text(label && label !== d ? label : d.slice(0, 3), margin + 140 + i * colWidth, y);
      });
      doc.setLineWidth(0.5);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      athletes.forEach((a) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.text((a.display_name || "—").slice(0, 22), margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`${a.belt_level || ""} · ${a.athlete_code || ""}`, margin, y + 10);
        doc.setFontSize(8);

        const schedule = Array.isArray(a.weekly_schedule) ? a.weekly_schedule : [];
        DAYS.forEach((d, i) => {
          const item = schedule.find(
            (s: any) => s?.day === d || s?.dayOfWeek === d || s?.day?.toLowerCase?.() === d.toLowerCase(),
          );
          const type = item?.type || (Array.isArray(item?.sessions) ? item.sessions[0]?.type : undefined) || "—";
          const label =
            type === "tkd" ? "TKD" :
            type === "gym" ? (t("gym") || "Gym") :
            type === "rest" ? (t("rest") || "Rest") :
            type === "recovery" ? (t("rest") || "Rest") :
            "—";
          doc.text(String(label), margin + 140 + i * colWidth, y);
        });

        y += 24;
        doc.setDrawColor(220);
        doc.line(margin, y - 6, pageWidth - margin, y - 6);
      });

      const filename = `squad-week-${new Date().toISOString().slice(0, 10)}.pdf`;

      // Use blob + anchor for cross-browser reliability (Safari/iOS friendly)
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.success(t("pdfExported") || "PDF exported");
    } catch (err: any) {
      console.error("[WeeklySquadExport] failed", err);
      toast.error(err?.message || "Export failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleExport} disabled={busy || athletes.length === 0}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" /> {t("exportSquadPdf")}</>}
    </Button>
  );
}
