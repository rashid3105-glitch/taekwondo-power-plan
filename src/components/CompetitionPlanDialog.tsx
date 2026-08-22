import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, Download, Droplet, Flame, Loader2, Target, Trophy, Utensils } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { isNativeApp } from "@/lib/platform";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { AssistantDisclosure } from "@/components/AssistantDisclosure";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  competitionName: string;
  plan: any;
}

export function CompetitionPlanDialog({ open, onOpenChange, competitionName, plan }: Props) {
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  if (!plan || Object.keys(plan).length === 0) return null;
  const { warnings = [], taperSummary, weeklyTaper = [], weightCut = [], nutritionAdjustments, peakDayProtocol, meta } = plan;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const margin = 15;
      const maxW = 210 - margin * 2;
      let y = margin;

      const ensure = (needed: number) => {
        if (y + needed > 280) { doc.addPage(); y = margin; }
      };
      const heading = (text: string) => {
        ensure(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(text, margin, y);
        y += 6;
      };
      const body = (text: string, indent = 0) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60);
        const lines = doc.splitTextToSize(text, maxW - indent);
        ensure(lines.length * 4.4 + 2);
        doc.text(lines, margin + indent, y);
        y += lines.length * 4.4;
      };

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`${competitionName} — ${t("compPlanTitle")}`, margin, y);
      y += 9;

      if (meta) {
        body(
          `${t("compPlanCurrent")} ${meta.currentKg} kg   |   ${t("compPlanTargetBadge")} ${meta.targetKg} kg   |   ` +
          `${t("compPlanCut")} ${meta.cutKg} kg   |   ${meta.daysToEvent} ${t("compPlanDays")}`,
        );
        y += 3;
      }

      if (warnings.length > 0) {
        heading(t("compPlanWarningsTitle"));
        warnings.forEach((w: string) => body(`• ${w}`, 3));
        y += 3;
      }

      if (taperSummary) {
        heading(t("compPlanSummary"));
        body(taperSummary);
        y += 3;
      }

      if (weeklyTaper.length > 0) {
        heading(t("compPlanWeeklyTaper"));
        weeklyTaper.forEach((w: any) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0);
          ensure(10);
          doc.text(`${t("compPlanWeek")} ${w.week} — ${w.intensity} ${t("compPlanIntensity")}`, margin, y);
          y += 5;
          if (w.focus) body(w.focus, 3);
          if (w.volumeChange) body(`${t("compPlanVolume")} ${w.volumeChange}`, 3);
          y += 2;
        });
        y += 2;
      }

      if (weightCut.length > 0) {
        heading(t("compPlanWeightCutSchedule"));
        weightCut.forEach((d: any) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(0);
          ensure(10);
          doc.text(`${t("compPlanDay")} -${d.day} — ${d.targetKg} ${t("compPlanKgTarget")}`, margin, y);
          y += 5;
          if (d.calorieAdjustment) body(`${t("compPlanCalories")} ${d.calorieAdjustment}`, 3);
          if (d.fluid) body(`${t("compPlanFluid")} ${d.fluid}`, 3);
          y += 2;
        });
        y += 2;
      }

      if (nutritionAdjustments) {
        heading(t("compPlanNutrition"));
        if (nutritionAdjustments.dailyCalories) body(`${t("compPlanDailyCalories")} ${nutritionAdjustments.dailyCalories} kcal`, 3);
        if (nutritionAdjustments.carbCycling) body(`${t("compPlanCarbCycling")} ${nutritionAdjustments.carbCycling}`, 3);
        if (nutritionAdjustments.hydration) body(`${t("compPlanHydration")} ${nutritionAdjustments.hydration}`, 3);
        y += 3;
      }

      if (peakDayProtocol) {
        heading(t("compPlanPeakDay"));
        body(peakDayProtocol);
      }

      const safeName = (competitionName || "competition").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const filename = `${safeName || "competition"}-plan.pdf`;

      if (isNativeApp()) {
        const dataUri = doc.output("datauristring");
        const base64 = dataUri.substring(dataUri.indexOf(",") + 1);
        const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
        try {
          await Share.share({ title: `${competitionName} — ${t("compPlanTitle")}`, url: written.uri });
        } catch {
          // user cancelled the share sheet
        }
      } else {
        doc.save(filename);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-10">
            <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="min-w-0 flex-1 truncate">{competitionName} — {t("compPlanTitle")}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-9 flex-shrink-0 gap-1.5"
              onClick={handleDownload}
              disabled={downloading}
              aria-label={t("compPlanDownloadPdf")}
              title={t("compPlanDownloadPdf")}
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline text-xs">PDF</span>
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {meta && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{t("compPlanCurrent")} {meta.currentKg} kg</Badge>
              <Badge variant="outline">{t("compPlanTargetBadge")} {meta.targetKg} kg</Badge>
              <Badge variant="outline">{t("compPlanCut")} {meta.cutKg} kg</Badge>
              <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{meta.daysToEvent} {t("compPlanDays")}</Badge>
            </div>
          )}

          {warnings.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-4 space-y-1">
                {warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-destructive text-xs">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {taperSummary && (
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-1"><Target className="h-4 w-4 text-primary" /> {t("compPlanSummary")}</h3>
              <p className="text-muted-foreground">{taperSummary}</p>
            </div>
          )}

          {weeklyTaper.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Flame className="h-4 w-4 text-primary" /> {t("compPlanWeeklyTaper")}</h3>
              <div className="space-y-2">
                {weeklyTaper.map((w: any, i: number) => (
                  <Card key={i}><CardContent className="pt-3 pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t("compPlanWeek")} {w.week}</span>
                      <Badge variant="outline" className="text-xs">{w.intensity} {t("compPlanIntensity")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{w.focus}</p>
                    <p className="text-xs"><span className="text-muted-foreground">{t("compPlanVolume")}</span> {w.volumeChange}</p>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {weightCut.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Droplet className="h-4 w-4 text-primary" /> {t("compPlanWeightCutSchedule")}</h3>
              <div className="space-y-2">
                {weightCut.map((d: any, i: number) => (
                  <Card key={i}><CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{t("compPlanDay")} -{d.day}</span>
                      <Badge variant="secondary" className="text-xs">{d.targetKg} {t("compPlanKgTarget")}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div><span className="font-medium text-foreground">{t("compPlanCalories")}</span> {d.calorieAdjustment}</div>
                      <div><span className="font-medium text-foreground">{t("compPlanFluid")}</span> {d.fluid}</div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {nutritionAdjustments && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Utensils className="h-4 w-4 text-primary" /> {t("compPlanNutrition")}</h3>
              <Card><CardContent className="pt-3 pb-3 text-xs space-y-1">
                {nutritionAdjustments.dailyCalories && <div><span className="font-medium">{t("compPlanDailyCalories")}</span> {nutritionAdjustments.dailyCalories} kcal</div>}
                {nutritionAdjustments.carbCycling && <div><span className="font-medium">{t("compPlanCarbCycling")}</span> {nutritionAdjustments.carbCycling}</div>}
                {nutritionAdjustments.hydration && <div><span className="font-medium">{t("compPlanHydration")}</span> {nutritionAdjustments.hydration}</div>}
              </CardContent></Card>
            </div>
          )}

          {peakDayProtocol && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Trophy className="h-4 w-4 text-primary" /> {t("compPlanPeakDay")}</h3>
              <Card><CardContent className="pt-3 pb-3 text-xs text-muted-foreground">{peakDayProtocol}</CardContent></Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
