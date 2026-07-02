import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImg } from "@/components/AvatarImg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, X, Clock, HeartCrack } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Athlete {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}
interface Record {
  athlete_id: string;
  status: "present" | "absent" | "late" | "injured";
  rpe: number | null;
}

interface Props {
  coachId: string;
  athletes: Athlete[];
  activeClubId?: string | null;
}

export function SessionAttendance({ coachId, athletes, activeClubId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState<Map<string, Record>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("session_attendance" as any)
        .select("athlete_id, status, rpe")
        .eq("session_date", date);
      if (activeClubId) q = q.eq("club_id", activeClubId);
      else q = q.eq("coach_id", coachId);
      const { data } = await q;
      const map = new Map<string, Record>();
      ((data as any[]) || []).forEach((r) => map.set(r.athlete_id, r as Record));
      setRecords(map);
      setLoading(false);
    })();
  }, [coachId, date, activeClubId]);

  const setStatus = async (athleteId: string, status: "present" | "absent" | "late" | "injured") => {
    const existing = records.get(athleteId);
    const next: Record = { athlete_id: athleteId, status, rpe: existing?.rpe ?? null };
    setRecords(new Map(records).set(athleteId, next));
    const payload: any = { coach_id: coachId, athlete_id: athleteId, session_date: date, status, rpe: next.rpe };
    if (activeClubId) payload.club_id = activeClubId;
    const { error } = await supabase
      .from("session_attendance" as any)
      .upsert(payload, { onConflict: "athlete_id,session_date" });
    if (error) toast({ title: t("error"), description: error.message, variant: "destructive" });
  };

  const setRpe = async (athleteId: string, rpe: number) => {
    const existing = records.get(athleteId);
    if (!existing) return;
    const next = { ...existing, rpe };
    setRecords(new Map(records).set(athleteId, next));
    const payload: any = { coach_id: coachId, athlete_id: athleteId, session_date: date, status: existing.status, rpe };
    if (activeClubId) payload.club_id = activeClubId;
    await supabase
      .from("session_attendance" as any)
      .upsert(payload, { onConflict: "athlete_id,session_date" });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{t("todaysSession")}</h3>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[160px] h-8 text-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : athletes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {t("noAthletes")}
        </div>
      ) : (
        <div className="grid gap-2">
          {athletes.map((a) => {
            const rec = records.get(a.user_id);
            return (
              <div key={a.user_id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <AvatarImg avatarUrl={a.avatar_url} />
                  <p className="flex-1 font-medium text-sm truncate">{a.display_name}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm" variant="outline"
                      className={cn("h-7 px-2", rec?.status === "present" && "bg-emerald-500/15 border-emerald-500/40 text-emerald-600")}
                      onClick={() => setStatus(a.user_id, "present")}
                    ><Check className="h-3 w-3" /></Button>
                    <Button
                      size="sm" variant="outline"
                      className={cn("h-7 px-2", rec?.status === "late" && "bg-orange-400/15 border-orange-400/40 text-orange-500")}
                      onClick={() => setStatus(a.user_id, "late")}
                    ><Clock className="h-3 w-3" /></Button>
                    <Button
                      size="sm" variant="outline"
                      className={cn("h-7 px-2", rec?.status === "absent" && "bg-destructive/15 border-destructive/40 text-destructive")}
                      onClick={() => setStatus(a.user_id, "absent")}
                    ><X className="h-3 w-3" /></Button>
                    <Button
                      size="sm" variant="outline"
                      aria-label={t("injured")}
                      title={t("injured")}
                      className={cn("h-7 px-2", rec?.status === "injured" && "bg-destructive/15 border-destructive/40 text-destructive")}
                      onClick={() => setStatus(a.user_id, "injured")}
                    ><HeartCrack className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
                {rec && rec.status !== "absent" && rec.status !== "injured" && (
                  <div className="flex items-center gap-3 pl-12">
                    <span className="text-[11px] text-muted-foreground w-20">{t("trainingIntensity")}</span>
                    <Slider
                      value={[rec.rpe ?? 5]}
                      onValueChange={([v]) => setRpe(a.user_id, v)}
                      min={1} max={10} step={1}
                      className="flex-1"
                    />
                    <span className="text-xs font-bold w-6 text-right">{rec.rpe ?? "—"}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
