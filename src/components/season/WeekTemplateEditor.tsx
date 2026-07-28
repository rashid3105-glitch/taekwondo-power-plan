import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, CopyPlus, Shield, Dumbbell, User, Battery, Trophy, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { GENERIC_DEFAULT_SCHEDULE } from "@/components/coach/TeamWeeklyScheduleCard";
import type { DaySchedule } from "@/components/WeekSchedulePicker";
import {
  type ClubSeasonDayTemplate, type SessionType,
  SESSION_TYPES, sessionLabelKey,
} from "@/lib/seasonCalendar";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

const SESSION_ICON: Record<SessionType, typeof Shield> = {
  tkd: Shield,
  gym: Dumbbell,
  styrke: Dumbbell,
  selftraining: User,
  "stævne": Trophy,
  rest: Battery,
};

/** Solid-ish tint + text color per session type (design tokens only). */
function chipClass(t: SessionType, active: boolean): string {
  const base: Record<SessionType, string> = {
    tkd: "border-primary/50 bg-primary/10 text-primary",
    gym: "border-accent/50 bg-accent/10 text-accent",
    styrke: "border-accent/50 bg-accent/10 text-accent",
    selftraining: "border-self/50 bg-self/10 text-self",
    "stævne": "border-destructive/50 bg-destructive/10 text-destructive",
    rest: "border-border bg-muted text-muted-foreground",
  };
  return cn(base[t], active && "ring-2 ring-offset-1 ring-offset-background ring-current");
}

interface Props {
  seasonPlanId: string;
  clubId: string | null;
  onTemplateChange: (rows: ClubSeasonDayTemplate[]) => void;
}

export function WeekTemplateEditor({ seasonPlanId, clubId, onTemplateChange }: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ClubSeasonDayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);

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
    setOpenDay(dow);
  }

  async function updateRow(id: string, patch: Partial<ClubSeasonDayTemplate>) {
    publish(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
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

      {/* Week overview: 7 compact day columns, tap to edit */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, dow) => {
          const dayRows = rows.filter((r) => r.day_of_week === dow);
          const isOpen = openDay === dow;
          return (
            <button
              key={dow}
              type="button"
              onClick={() => setOpenDay(isOpen ? null : dow)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-1.5 min-h-[62px] transition-colors",
                isOpen ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/50",
              )}
            >
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>
              {dayRows.length === 0 ? (
                <span className="text-[10px] text-muted-foreground/60">–</span>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  {dayRows.map((r) => {
                    const Icon = SESSION_ICON[r.session_type] ?? Shield;
                    return (
                      <span
                        key={r.id}
                        className={cn("rounded p-0.5 border", chipClass(r.session_type, false))}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Editor for the selected day */}
      {openDay !== null && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">{DAY_LABELS[openDay]}</span>
            <button
              type="button"
              onClick={() => setOpenDay(null)}
              className="text-muted-foreground p-1"
              aria-label={t("close")}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {rows.filter((r) => r.day_of_week === openDay).map((r) => (
            <div key={r.id} className="rounded-md border border-border/60 bg-background p-2 space-y-2">
              <div className="flex flex-wrap gap-1">
                {SESSION_TYPES.map((st) => {
                  const Icon = SESSION_ICON[st] ?? Shield;
                  const active = r.session_type === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateRow(r.id, { session_type: st })}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold min-h-8",
                        chipClass(st, active),
                        !active && "opacity-70",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {t(sessionLabelKey(st) as any)}
                    </button>
                  );
                })}
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 ml-auto shrink-0"
                  onClick={() => deleteRow(r.id)}
                  aria-label={t("delete")} title={t("delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <Input
                  className="h-9 text-sm"
                  placeholder={t("seasonWeekTemplateLocation")}
                  defaultValue={r.location ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (r.location ?? "")) updateRow(r.id, { location: v || null });
                  }}
                />
                <Input
                  className="h-9 text-sm"
                  placeholder={t("seasonWeekTemplateNote")}
                  defaultValue={r.notes ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (r.notes ?? "")) updateRow(r.id, { notes: v || null });
                  }}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline" size="sm" className="w-full h-9"
            disabled={busy}
            onClick={() => addSession(openDay)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("seasonWeekTemplateAddSession")}
          </Button>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full h-9" disabled={busy || !clubId} onClick={copyFromClubDefault}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CopyPlus className="h-3.5 w-3.5 mr-1" />}
        {t("seasonWeekTemplateCopyFromClub")}
      </Button>
    </Card>
  );
}
