import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Athlete {
  user_id: string;
  display_name: string;
  athlete_code: string | null;
  belt_level: string;
  weekly_schedule: any;
  weight_category?: string;
}

interface Props {
  athletes: Athlete[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function WeeklySquadExport({ athletes }: Props) {
  const { t, locale } = useLanguage();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);

    // Step 1 — week bounds (Mon..Sun)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const weekStart = monday.toISOString().slice(0, 10);
    const weekEnd = sunday.toISOString().slice(0, 10);

    const loadingId = toast.loading(t("weeklyReportGenerating") || "Generating AI summaries…");

    try {
      // Step 2 — fetch each athlete's weekly data in parallel
      const athleteData = await Promise.all(
        athletes.map(async (a) => {
          const [diaryRes, readinessRes, workoutRes] = await Promise.all([
            supabase
              .from("diary_entries")
              .select("entry_date, content, mood, energy, entry_type, tags")
              .eq("user_id", a.user_id)
              .gte("entry_date", weekStart)
              .lte("entry_date", weekEnd)
              .order("entry_date"),
            supabase
              .from("readiness_checkins")
              .select("checkin_date, mood, motivation, sleep_hours")
              .eq("user_id", a.user_id)
              .gte("checkin_date", weekStart)
              .lte("checkin_date", weekEnd)
              .order("checkin_date"),
            supabase
              .from("workout_logs")
              .select("logged_date, completed")
              .eq("user_id", a.user_id)
              .gte("logged_date", weekStart)
              .lte("logged_date", weekEnd)
              .order("logged_date"),
          ]);

          // Aggregate workouts per date
          const byDate = new Map<string, { completed: number; total: number }>();
          for (const w of workoutRes.data || []) {
            const k = w.logged_date as string;
            const cur = byDate.get(k) || { completed: 0, total: 0 };
            cur.total += 1;
            if (w.completed) cur.completed += 1;
            byDate.set(k, cur);
          }
          const workouts = Array.from(byDate.entries()).map(([date, v]) => ({
            date, session_type: "", completed: v.completed, total: v.total,
          }));

          return {
            athlete: a,
            diary: diaryRes.data || [],
            readiness: (readinessRes.data || []).map((r: any) => ({
              date: r.checkin_date, mood: r.mood, energy: r.motivation, sleep_hours: r.sleep_hours,
            })),
            workouts,
          };
        }),
      );

      // Step 3 — generate AI summaries (max 3 in flight)
      const summaries = new Map<string, string>();
      for (let i = 0; i < athleteData.length; i += 3) {
        const batch = athleteData.slice(i, i + 3);
        await Promise.all(
          batch.map(async ({ athlete, diary, readiness, workouts }) => {
            try {
              const { data, error } = await supabase.functions.invoke("generate-weekly-athlete-summary", {
                body: {
                  athlete: {
                    display_name: athlete.display_name,
                    belt_level: athlete.belt_level,
                    weight_category: athlete.weight_category,
                  },
                  week: { start: weekStart, end: weekEnd },
                  diary: diary.map((d: any) => ({
                    entry_date: d.entry_date, content: d.content, mood: d.mood,
                    energy: d.energy, entry_type: d.entry_type, tags: d.tags || [],
                  })),
                  readiness,
                  workoutCompletion: workouts,
                  language: locale,
                },
              });
              summaries.set(athlete.user_id, !error && data?.summary ? data.summary : "");
            } catch {
              summaries.set(athlete.user_id, "");
            }
          }),
        );
      }

      // Step 4 — build PDF
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      const fmt = (d: Date) =>
        d.toLocaleDateString(locale === "en" ? "en-GB" : locale, { day: "2-digit", month: "short" });
      const weekLabel = `${fmt(monday)} – ${fmt(sunday)}`;
      const noDataMsg = t("weeklyReportNoData") ||
        (locale === "da" ? "Ikke nok data til at generere en opsummering denne uge."
          : "Insufficient data to generate a summary this week.");

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("SPORTSTALENT.DK — " + (t("weeklyAthleteReport") || "Weekly Athlete Report"), margin, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110);
      doc.text(new Date().toLocaleString(), margin, 56);
      doc.setTextColor(0);

      let y = 80;

      athleteData.forEach(({ athlete }, idx) => {
        const summary = summaries.get(athlete.user_id) || "";
        // Estimate block height (rough)
        if (y > pageHeight - 160) {
          doc.addPage();
          y = 60;
        }

        // Title row
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${athlete.display_name} — ${athlete.belt_level || ""}`, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90);
        const wlw = doc.getTextWidth(weekLabel);
        doc.text(weekLabel, pageWidth - margin - wlw, y);
        doc.setTextColor(0);
        y += 16;

        // Weekly schedule
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(t("weeklySquadOverview") ? "Schedule:" : "Schedule:", margin, y);
        doc.setFont("helvetica", "normal");
        const schedule = Array.isArray(athlete.weekly_schedule) ? athlete.weekly_schedule : [];
        const scheduleStr = DAYS.map((d) => {
          const item = schedule.find(
            (s: any) => s?.day === d || s?.dayOfWeek === d || s?.day?.toLowerCase?.() === d.toLowerCase(),
          );
          const type = item?.type || (Array.isArray(item?.sessions) ? item.sessions[0]?.type : undefined) || "—";
          const label =
            type === "tkd" ? "TKD" :
            type === "gym" ? (t("gym") || "Gym") :
            type === "selftraining" ? "Self" :
            type === "rest" || type === "recovery" ? (t("rest") || "Rest") : "—";
          return `${d.slice(0, 3)}: ${label}`;
        }).join("  ");
        const scheduleLines = doc.splitTextToSize(scheduleStr, contentWidth - 60);
        doc.text(scheduleLines, margin + 60, y);
        y += scheduleLines.length * 11 + 8;

        // AI summary box
        const text = summary || noDataMsg;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(text, contentWidth - 20);
        const boxH = lines.length * 13 + 22;
        if (y + boxH > pageHeight - 50) {
          doc.addPage();
          y = 60;
        }
        doc.setFillColor(240, 247, 255);
        doc.rect(margin, y, contentWidth, boxH, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(60, 90, 150);
        doc.text("AI SUMMARY", margin + 10, y + 12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(lines, margin + 10, y + 26);
        y += boxH + 12;

        // Divider
        if (idx < athleteData.length - 1) {
          doc.setDrawColor(220);
          doc.line(margin, y, pageWidth - margin, y);
          y += 14;
        }
      });

      // Footer on last page
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      const footer = t("weeklyReportFooter") || "Generated by Sportstalent.dk · Coach-only document";
      doc.text(footer, margin, pageHeight - 24);
      doc.setTextColor(0);

      const filename = `athlete-report-week-${weekStart}.pdf`;
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast.dismiss(loadingId);
      toast.success(t("pdfExported") || "PDF exported");
    } catch (err: any) {
      console.error("[WeeklySquadExport] failed", err);
      toast.dismiss(loadingId);
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
