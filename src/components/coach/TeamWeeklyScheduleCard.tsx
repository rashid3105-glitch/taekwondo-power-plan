import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";
import { CalendarRange, Loader2 } from "lucide-react";

export const GENERIC_DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday", type: "tkd" },
  { day: "Tuesday", type: "gym" },
  { day: "Wednesday", type: "tkd" },
  { day: "Thursday", type: "gym" },
  { day: "Friday", type: "tkd" },
  { day: "Saturday", type: "gym" },
  { day: "Sunday", type: "rest" },
];

interface Props {
  clubId: string;
}

export function TeamWeeklyScheduleCard({ clubId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);
  const [draft, setDraft] = useState<DaySchedule[]>(GENERIC_DEFAULT_SCHEDULE);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clubs" as any)
      .select("default_weekly_schedule")
      .eq("id", clubId)
      .maybeSingle();
    const s = (data as any)?.default_weekly_schedule as DaySchedule[] | null;
    setSchedule(s ?? null);
    setDraft(s ?? GENERIC_DEFAULT_SCHEDULE);
    setLoading(false);
  };

  useEffect(() => { if (clubId) load(); /* eslint-disable-next-line */ }, [clubId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.rpc("set_club_default_weekly_schedule" as any, {
      _club_id: clubId,
      _schedule: draft as any,
    });
    setSaving(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("teamScheduleSaved") });
    setEditing(false);
    await load();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-card-foreground flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          {t("teamWeeklyScheduleTitle")}
        </h3>
        {!editing && (
          <Button size="sm" variant={schedule ? "outline" : "default"} onClick={() => setEditing(true)}>
            {schedule ? t("editTeamWeeklySchedule") : t("setTeamWeeklySchedule")}
          </Button>
        )}
      </div>

      {!editing && !schedule && (
        <p className="text-xs text-muted-foreground">{t("teamWeeklySchedulePromptDesc")}</p>
      )}

      {!editing && schedule && (
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {schedule.map((d) => (
            <span
              key={d.day}
              className="rounded-md border border-border bg-muted/30 px-2 py-1 text-muted-foreground"
            >
              <span className="font-semibold text-card-foreground">{d.day.slice(0, 3)}</span>{" "}
              {(d.sessions && d.sessions.length > 0 ? d.sessions.map((s) => s.type) : [d.type]).join(" + ")}
            </span>
          ))}
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("teamScheduleEditorNote")}</p>
          <WeekSchedulePicker schedule={draft} onChange={setDraft} />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditing(false); setDraft(schedule ?? GENERIC_DEFAULT_SCHEDULE); }}
              disabled={saving}
            >
              {t("cancel")}
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
