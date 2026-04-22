import { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

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
    setBusy(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 30;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(t("weeklySquadOverview"), margin, 40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString(), margin, 58);

      const colWidth = (pageWidth - margin * 2 - 140) / 7;
      let y = 90;

      // Header row
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(t("athlete"), margin, y);
      DAYS.forEach((d, i) => {
        doc.text(t(d) || d, margin + 140 + i * colWidth, y);
      });
      doc.setLineWidth(0.5);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      athletes.forEach((a) => {
        if (y > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          y = 50;
        }
        doc.setFont("helvetica", "bold");
        doc.text(a.display_name.slice(0, 22), margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`${a.belt_level} · ${a.athlete_code || ""}`, margin, y + 10);
        doc.setFontSize(8);

        const schedule = Array.isArray(a.weekly_schedule) ? a.weekly_schedule : [];
        DAYS.forEach((d, i) => {
          const item = schedule.find((s: any) => s.day === d);
          const type = item?.type || "—";
          const label = type === "tkd" ? "TKD" : type === "gym" ? t("gym") : type === "rest" ? t("rest") : "—";
          doc.text(label, margin + 140 + i * colWidth, y);
        });

        y += 24;
        doc.setDrawColor(220);
        doc.line(margin, y - 6, pageWidth - margin, y - 6);
      });

      doc.save(`squad-week-${new Date().toISOString().slice(0, 10)}.pdf`);
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
