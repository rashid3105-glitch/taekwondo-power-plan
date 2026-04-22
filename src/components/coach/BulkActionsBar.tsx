import { useState } from "react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, X, Loader2, Sparkles, FileDown, MessageSquare } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { normalizeDaySessions } from "@/lib/planSessionUtils";
import { SendMessageDialog } from "@/components/coach/SendMessageDialog";

interface Athlete {
  user_id: string;
  display_name: string;
}

interface Props {
  selected: Athlete[];
  onClear: () => void;
  onRefresh?: () => void;
}

const GOAL_OPTIONS = [
  "Faster kicks",
  "More explosive footwork",
  "Competition prep",
  "Build lean muscle",
  "Injury prevention",
  "Stronger hips",
  "Improve flexibility",
  "General fitness",
];

export function BulkActionsBar({ selected, onClear, onRefresh }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [planWeeks, setPlanWeeks] = useState(8);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [exporting, setExporting] = useState(false);

  if (selected.length === 0) return null;

  const sendBulkReminder = async () => {
    if (!title.trim() || !eventDate) {
      toast({ title: t("error"), description: t("reminderTitleRequired"), variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const rows = selected.map((a) => ({
        coach_id: user.id,
        athlete_id: a.user_id,
        title: title.trim(),
        event_date: eventDate,
        message: message.trim(),
      }));
      const { data: insertedRows, error } = await supabase
        .from("event_reminders")
        .insert(rows)
        .select("id");
      if (error) throw error;

      // Fan out emails server-side (best-effort, non-blocking on failures)
      const reminderIds = (insertedRows || []).map((r) => r.id);
      if (reminderIds.length > 0) {
        try {
          await supabase.functions.invoke("send-coach-message", {
            body: { reminderIds },
          });
        } catch (e) {
          // Reminders are still saved in DB even if email fan-out fails
          console.warn("Email fan-out failed", e);
        }
      }

      toast({ title: t("reminderSent"), description: `${selected.length} ${t("athletes")}` });
      setReminderOpen(false);
      setTitle(""); setEventDate(""); setMessage("");
      onClear();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const sendBulkMessage = async () => {
    if (!msgSubject.trim()) {
      toast({ title: t("error"), description: t("messageSubjectRequired"), variant: "destructive" });
      return;
    }
    setMsgSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-coach-message", {
        body: {
          athleteIds: selected.map((a) => a.user_id),
          subject: msgSubject.trim(),
          body: msgBody.trim(),
        },
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      toast({
        title: t("messageSent"),
        description: `${data?.inserted || 0} ${t("delivered")} · ${data?.emailed || 0} ${t("emailed")}`,
      });
      setMessageOpen(false);
      setMsgSubject(""); setMsgBody("");
      onClear();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setMsgSending(false);
    }
  };

  const toggleGoal = (g: string) =>
    setSelectedGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const generateBulkPlans = async () => {
    setGenerating(true);
    setProgress({ done: 0, total: selected.length });
    let success = 0;
    let failed = 0;
    try {
      // Fetch all athlete profiles in one go for the coach
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, age, weight_kg, belt_level, experience_years, tkd_sessions_per_week, current_injury, weekly_schedule, discipline, goals")
        .in("user_id", selected.map((a) => a.user_id));
      if (pErr) throw pErr;

      for (const a of selected) {
        const profile = profiles?.find((p) => p.user_id === a.user_id);
        if (!profile) {
          failed++;
          setProgress({ done: success + failed, total: selected.length });
          continue;
        }
        try {
          const profileWithGoals = {
            ...profile,
            goals: selectedGoals.length > 0 ? selectedGoals : (profile.goals || []),
            program_weeks: planWeeks,
          };
          const { data, error } = await supabase.functions.invoke("generate-plan", {
            body: { profile: profileWithGoals, language: locale },
          });
          if (error || data?.error) throw new Error(error?.message || data?.error);

          await supabase
            .from("training_plans")
            .update({ is_active: false })
            .eq("user_id", a.user_id);

          const { error: insErr } = await supabase.from("training_plans").insert({
            user_id: a.user_id,
            name: data.plan.planName || "Coach Generated Plan",
            plan_data: data.plan,
            is_active: true,
          });
          if (insErr) throw insErr;
          success++;
        } catch (e) {
          failed++;
        }
        setProgress({ done: success + failed, total: selected.length });
      }

      toast({
        title: t("bulkPlansDone"),
        description: `${success} ${t("succeeded")} · ${failed} ${t("failed")}`,
      });
      setPlanOpen(false);
      setSelectedGoals([]);
      onRefresh?.();
      if (failed === 0) onClear();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const exportCombinedPdf = async () => {
    setExporting(true);
    try {
      // Fetch active plans for all selected athletes
      const { data: plans, error } = await supabase
        .from("training_plans")
        .select("user_id, name, plan_data")
        .eq("is_active", true)
        .in("user_id", selected.map((a) => a.user_id));
      if (error) throw error;

      if (!plans || plans.length === 0) {
        toast({ title: t("noPlansToExport"), variant: "destructive" });
        return;
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 36;
      let first = true;

      for (const a of selected) {
        const plan = plans.find((p) => p.user_id === a.user_id);
        if (!plan) continue;

        if (!first) doc.addPage();
        first = false;

        let y = 50;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(a.display_name, margin, y);
        y += 18;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(plan.name || t("trainingPlan"), margin, y);
        y += 14;
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 16;

        const planData: any = plan.plan_data || {};
        const days: any[] = Array.isArray(planData.days) ? planData.days : [];

        for (const day of days) {
          if (y > pageH - 80) {
            doc.addPage();
            y = 50;
          }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.text(`${day.dayOfWeek || day.day || ""}`, margin, y);
          y += 14;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);

          const sessions = normalizeDaySessions(day);
          for (const s of sessions) {
            if (y > pageH - 40) {
              doc.addPage();
              y = 50;
            }
            const label = `${s.label || s.type}${s.focus ? " · " + s.focus : ""}`;
            doc.setFont("helvetica", "bold");
            doc.text(label, margin + 8, y);
            y += 12;
            doc.setFont("helvetica", "normal");
            const exercises = Array.isArray(s.exercises) ? s.exercises : [];
            for (const ex of exercises.slice(0, 8)) {
              if (y > pageH - 40) {
                doc.addPage();
                y = 50;
              }
              const line = `• ${ex.name || ""}  ${ex.sets || ""}x${ex.reps || ""}${ex.tempo ? " @" + ex.tempo : ""}`;
              doc.text(line.slice(0, 90), margin + 16, y);
              y += 11;
            }
            y += 4;
          }
          y += 6;
        }
      }

      doc.save(`squad-plans-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: t("pdfExported") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="sticky bottom-2 z-20 mx-auto max-w-3xl rounded-xl border border-primary/40 bg-card shadow-lg p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-foreground">
          {selected.length} {t("selected")}
        </span>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
          <MessageSquare className="h-3 w-3 mr-1" /> {t("bulkSendMessage")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setReminderOpen(true)}>
          <Bell className="h-3 w-3 mr-1" /> {t("remind")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPlanOpen(true)}>
          <Sparkles className="h-3 w-3 mr-1" /> {t("bulkGeneratePlans")}
        </Button>
        <Button size="sm" variant="outline" onClick={exportCombinedPdf} disabled={exporting}>
          {exporting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileDown className="h-3 w-3 mr-1" />}
          {t("bulkExportPdf")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> {t("bulkSendReminder")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("sendingTo")} {selected.length} {t("athletes")}
            </p>
            <div className="space-y-1">
              <Label className="text-xs">{t("reminderTitleLabel")}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("eventDateLabel")}</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("reminderMessageLabel")}</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={1000} />
            </div>
            <Button onClick={sendBulkReminder} disabled={sending} className="w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("send")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={planOpen} onOpenChange={(v) => !generating && setPlanOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> {t("bulkGeneratePlans")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("bulkPlanDesc")} {selected.length} {t("athletes")}
            </p>
            <div className="space-y-1">
              <Label className="text-xs">{t("programLength")}</Label>
              <Select value={String(planWeeks)} onValueChange={(v) => setPlanWeeks(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 10, 12].map((w) => (
                    <SelectItem key={w} value={String(w)}>{w} {t("weeks")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("sharedGoalsOptional")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGoal(g)}
                    className={`text-[10px] px-2 py-1 rounded-full border ${
                      selectedGoals.includes(g)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {generating && (
              <div className="text-xs text-muted-foreground">
                {progress.done}/{progress.total} {t("athletes")}
              </div>
            )}
            <Button onClick={generateBulkPlans} disabled={generating} className="w-full">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("generate")}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              {t("bulkPlanWarn")}
            </p>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={messageOpen} onOpenChange={(v) => !msgSending && setMessageOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> {t("bulkSendMessage")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t("sendingTo")} {selected.length} {t("athletes")}
            </p>
            <div className="space-y-1">
              <Label className="text-xs">{t("messageSubjectLabel")}</Label>
              <Input
                value={msgSubject}
                onChange={(e) => setMsgSubject(e.target.value)}
                maxLength={200}
                placeholder={t("messageSubjectPlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("messageBodyLabel")}</Label>
              <Textarea
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                rows={5}
                maxLength={5000}
                placeholder={t("messageBodyPlaceholder")}
              />
            </div>
            <Button onClick={sendBulkMessage} disabled={msgSending} className="w-full">
              {msgSending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("send")}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              {t("messageDeliveryNote")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
