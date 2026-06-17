import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AvatarImg } from "@/components/AvatarImg";
import { ChevronLeft, ChevronRight, Loader2, Check, Clock, X, FileDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import jsPDF from "jspdf";

interface Athlete {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachId: string;
  athletes: Athlete[];
  activeClubId?: string | null;
}

interface Row {
  athlete_id: string;
  session_date: string;
  status: "present" | "absent" | "late";
  rpe: number | null;
}

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export function AttendanceStatsDialog({ open, onOpenChange, coachId, athletes, activeClubId }: Props) {
  const { t, locale } = useLanguage();
  const [cursor, setCursor] = useState(() => new Date());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("all");

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const { start, end } = monthBounds(cursor);
      let query = supabase
        .from("session_attendance" as any)
        .select("athlete_id, session_date, status, rpe")
        .gte("session_date", start)
        .lte("session_date", end);
      if (activeClubId) query = query.eq("club_id", activeClubId);
      else query = query.eq("coach_id", coachId);
      const { data } = await query;
      setRows(((data as any[]) || []) as Row[]);
      setLoading(false);
    })();
  }, [open, coachId, cursor, activeClubId]);

  const monthLabel = useMemo(
    () => cursor.toLocaleDateString(locale, { month: "long", year: "numeric" }),
    [cursor, locale],
  );

  const { sessionsHeld, teamRate, perAthlete } = useMemo(() => {
    const dates = new Set(rows.map((r) => r.session_date));
    const sessionsHeld = dates.size;
    const per = new Map<string, { present: number; late: number; absent: number; rpeSum: number; rpeN: number }>();
    rows.forEach((r) => {
      const cur = per.get(r.athlete_id) || { present: 0, late: 0, absent: 0, rpeSum: 0, rpeN: 0 };
      cur[r.status] += 1;
      if (r.rpe != null && r.status !== "absent") {
        cur.rpeSum += r.rpe;
        cur.rpeN += 1;
      }
      per.set(r.athlete_id, cur);
    });
    let totalAttended = 0;
    let totalSlots = 0;
    const perAthlete = athletes
      .map((a) => {
        const s = per.get(a.user_id) || { present: 0, late: 0, absent: 0, rpeSum: 0, rpeN: 0 };
        const attended = s.present + s.late;
        const pct = sessionsHeld > 0 ? Math.round((attended / sessionsHeld) * 100) : 0;
        const avgRpe = s.rpeN > 0 ? Math.round((s.rpeSum / s.rpeN) * 10) / 10 : null;
        totalAttended += attended;
        totalSlots += sessionsHeld;
        return { athlete: a, ...s, pct, avgRpe };
      })
      .sort((a, b) => (a.athlete.display_name || "").localeCompare(b.athlete.display_name || ""));
    const teamRate = totalSlots > 0 ? Math.round((totalAttended / totalSlots) * 100) : 0;
    return { sessionsHeld, teamRate, perAthlete };
  }, [rows, athletes]);

  const filteredPerAthlete = useMemo(
    () => selectedAthleteId === "all" ? perAthlete : perAthlete.filter((p) => p.athlete.user_id === selectedAthleteId),
    [perAthlete, selectedAthleteId],
  );

  const sessionDatesSorted = useMemo(
    () => Array.from(new Set(rows.map((r) => r.session_date))).sort(),
    [rows],
  );

  const exportPdf = () => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(t("monthlyAttendance"), margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(monthLabel, margin, y);
    y += 6;
    const scope = selectedAthleteId === "all"
      ? t("wholeTeam")
      : (athletes.find((a) => a.user_id === selectedAthleteId)?.display_name || "");
    doc.text(scope, margin, y);
    y += 6;
    doc.text(`${t("sessionsHeld")}: ${sessionsHeld}   ${t("teamAttendanceRate")}: ${teamRate}%`, margin, y);
    y += 8;

    if (selectedAthleteId === "all") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Athlete", margin, y);
      doc.text(t("present"), margin + 80, y);
      doc.text(t("late"), margin + 110, y);
      doc.text(t("absent"), margin + 130, y);
      doc.text(t("attendanceRate"), margin + 155, y);
      y += 5;
      doc.setLineWidth(0.2);
      doc.line(margin, y, 200, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      filteredPerAthlete.forEach((row) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(String(row.athlete.display_name || "").slice(0, 40), margin, y);
        doc.text(String(row.present), margin + 80, y);
        doc.text(String(row.late), margin + 110, y);
        doc.text(String(row.absent), margin + 130, y);
        doc.text(`${row.pct}%`, margin + 155, y);
        y += 6;
      });
    } else {
      const row = filteredPerAthlete[0];
      if (row) {
        doc.setFont("helvetica", "bold");
        doc.text(`${t("present")}: ${row.present}   ${t("late")}: ${row.late}   ${t("absent")}: ${row.absent}`, margin, y);
        y += 6;
        doc.text(`${t("attendanceRate")}: ${row.pct}%${row.avgRpe != null ? `   ${t("avgRpe")}: ${row.avgRpe}` : ""}`, margin, y);
        y += 8;
        doc.setFontSize(10);
        doc.text("Date", margin, y);
        doc.text("Status", margin + 60, y);
        doc.text(t("trainingIntensity"), margin + 110, y);
        y += 5;
        doc.line(margin, y, 200, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        sessionDatesSorted.forEach((d) => {
          if (y > 280) { doc.addPage(); y = 20; }
          const r = rows.find((rr) => rr.session_date === d && rr.athlete_id === selectedAthleteId);
          const statusKey = r?.status;
          const statusLabel = statusKey === "present" ? t("present") : statusKey === "late" ? t("late") : statusKey === "absent" ? t("absent") : "—";
          doc.text(d, margin, y);
          doc.text(statusLabel, margin + 60, y);
          doc.text(r?.rpe != null ? String(r.rpe) : "—", margin + 110, y);
          y += 6;
        });
      }
    }

    const fname = `attendance_${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}_${selectedAthleteId === "all" ? "team" : selectedAthleteId.slice(0, 6)}.pdf`;
    doc.save(fname);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("monthlyAttendance")}</DialogTitle>
        </DialogHeader>

        {/* Month picker */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold capitalize">{monthLabel}</div>
          <Button variant="outline" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Athlete selector + PDF export */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("wholeTeam")}</SelectItem>
              {athletes
                .slice()
                .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""))
                .map((a) => (
                  <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportPdf} disabled={sessionsHeld === 0} className="gap-2">
            <FileDown className="h-4 w-4" />
            {t("exportPdf")}
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground border-y border-border py-2">
          <span className="font-semibold uppercase tracking-wider">{t("legend")}:</span>
          <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" />{t("present")}</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-orange-500" />{t("late")}</span>
          <span className="inline-flex items-center gap-1"><X className="h-3.5 w-3.5 text-destructive" />{t("absent")}</span>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("sessionsHeld")}</div>
            <div className="text-xl font-bold">{sessionsHeld}</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("teamAttendanceRate")}</div>
            <div className="text-xl font-bold">{teamRate}%</div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : sessionsHeld === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("noSessionsThisMonth")}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPerAthlete.map((row) => (
              <div key={row.athlete.user_id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <AvatarImg avatarUrl={row.athlete.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{row.athlete.display_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5"><Check className="h-3 w-3 text-emerald-500" />{row.present}</span>
                      <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3 text-orange-500" />{row.late}</span>
                      <span className="inline-flex items-center gap-0.5"><X className="h-3 w-3 text-destructive" />{row.absent}</span>
                      {row.avgRpe != null && <span>· {t("avgRpe")} {row.avgRpe}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{row.pct}%</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{t("attendanceRate")}</div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
