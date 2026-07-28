import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, CopyPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { GENERIC_DEFAULT_SCHEDULE } from "@/components/coach/TeamWeeklyScheduleCard";
import type { DaySchedule } from "@/components/WeekSchedulePicker";
import {
  type ClubSeasonDayTemplate, type SessionType,
  SESSION_TYPES, sessionLabelKey, sessionRowClass,
} from "@/lib/seasonCalendar";
import { cn } from "@/lib/utils";

const DAY_LABELS_LONG = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

interface Props {
  seasonPlanId: string;
  clubId: string | null;
  /** Called with the current rows whenever they change, so the calendar grid stays in sync. */
  onTemplateChange: (rows: ClubSeasonDayTemplate[]) => void;
}

export function WeekTemplateEditor({ seasonPlanId, clubId, onTemplateChange }: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ClubSeasonDayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const publish = useCallback((next: ClubSeasonDayTemplate[]) => {
    setRows(next);
    onTemplateChange(next);
  }, [onTemplateChange]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from as any)("club_season_day_templates")
      .select("*").eq("season_plan_id", seasonPlanId).order("day_of_week");
    publish(((data ?? []) as ClubSeasonDayTemplate[]));
    setLoading(false);
  }, [seasonPlanId, publish]);

  useEffect(() => { load(); }, [load]);

  async function addSession(dow: number) {
    setBusy(true);
    const { data, error } = await (supabase.from as any)("club_season_day_templates")
      .insert({ season_plan_id: seasonPlanId, day_of_week: dow, session_type: "tkd" })
      .select().single();
    setBusy(false);
    if (error) { toast({ title: error.message, variant: "destructive" }); return; }
    publish([...rows, data as ClubSeasonDayTemplate].sort((a, b) => a.day_of_week - b.day_of_week));
  }

  async function updateRow(id: string, patch: Partial<ClubSeasonDayTemplate>) {
    const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
    publish(next);
    const { error } = await (supabase.from as any)("club_season_day_templates").update(patch).eq("id", id);
    if (error) toast({ title: error.message, variant: "destructive" });
  }

  async function deleteRow(id: string) {
    publish(rows.filter((r) => r.id !== id));
    const { error } = await (supabase.from as any)("club_season_day_templates").delete().eq("id", id);
    if (error) { toast({ title: error.message, variant: "destructive" }); load(); }
  }

  async function copyFromClubDefault() {
    if (!clubId) return;
    setBusy(true);
    const { data } = await (supabase.from as any)("clubs")
      .select("default_weekly_schedule").eq("id", clubId).maybeSingle();
    const schedule: DaySchedule[] =
      ((data as any)?.default_weekly_schedule as DaySchedule[] | null) ?? GENERIC_DEFAULT_SCHEDULE;
    const DOW: Record<string, number> = {
      Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6,
    };
    const inserts: { season_plan_id: string; day_of_week: number; session_type: SessionType }[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const entry = schedule.find((s) => DOW[s.day] === dow);
      const sessions = entry?.sessions && entry.sessions.length > 0
        ? entry.sessions
        : [{ type: (entry?.type ?? "rest") as SessionType }];
      for (const sess of sessions) {
        if ((sess.type as SessionType) === "rest") continue;
        inserts.push({ season_plan_id: seasonPlanId, day_of_week: dow, session_type: sess.type as SessionType });
      }
    }
    await (supabase.from as any)("club_season_day_templates").delete().eq("season_plan_id", seasonPlanId);
    if (inserts.length > 0) {
      const { error } = await (supabase.from as any)("club_season_day_templates").insert(inserts);
      if (error) { setBusy(false); toast({ title: error.message, variant: "destructive" }); return; }
    }
    setBusy(false);
    await load();
    toast({ title: t("seasonWeekTemplateCopied") });
  }

  return (
    <Card className="p-3 space-y-3" id="week-template">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("seasonWeekTemplateTitle")}
        </h3>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        {t("seasonWeekTemplateHelp")}
      </p>

      <div className="space-y-2">
        {DAY_LABELS_LONG.map((label, dow) => {
          const dayRows = rows.filter((r) => r.day_of_week === dow);
          return (
            <div key={dow} className="rounded-md border border-border/60 p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{label}</span>
                <Button
                  size="icon" variant="ghost" className="h-6 w-6"
                  disabled={busy}
                  onClick={() => addSession(dow)}
                  aria-label={t("seasonWeekTemplateAddSession")}
                  title={t("seasonWeekTemplateAddSession")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {dayRows.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">{t("sessionTypeRest")}</p>
              ) : (
                <div className="space-y-1.5">
                  {dayRows.map((r) => (
                    <div key={r.id} className={cn("rounded p-1.5 space-y-1", sessionRowClass(r.session_type))}>
                      <div className="flex items-center gap-1">
                        <Select
                          value={r.session_type}
                          onValueChange={(v) => updateRow(r.id, { session_type: v as SessionType })}
                        >
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SESSION_TYPES.map((st) => (
                              <SelectItem key={st} value={st}>{t(sessionLabelKey(st) as any)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                          onClick={() => deleteRow(r.id)}
                          aria-label={t("delete")} title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Input
                        className="h-7 text-xs"
                        placeholder={t("seasonWeekTemplateLocation")}
                        defaultValue={r.location ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (r.location ?? "")) updateRow(r.id, { location: v || null });
                        }}
                      />
                      <Input
                        className="h-7 text-xs"
                        placeholder={t("seasonWeekTemplateNote")}
                        defaultValue={r.notes ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (r.notes ?? "")) updateRow(r.id, { notes: v || null });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button variant="outline" size="sm" className="w-full" disabled={busy || !clubId} onClick={copyFromClubDefault}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CopyPlus className="h-3.5 w-3.5 mr-1" />}
        {t("seasonWeekTemplateCopyFromClub")}
      </Button>
    </Card>
  );
}
