import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImg } from "@/components/AvatarImg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, HeartCrack, Zap, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "injured";
type Ready = "green" | "amber" | "red";
interface Rec { status: Status; ready: Ready | null; notes: string }

interface Props {
  coachId: string;
  athletes: { user_id: string; display_name: string; avatar_url: string | null }[];
  activeClubId?: string | null;
}

const READY_PREFIX = "readiness:";
/** Coach-observed readiness lives in session_attendance.notes as "readiness:<level>". */
export function parseReady(notes: string | null | undefined): Ready | null {
  const m = (notes || "").match(/readiness:(green|amber|red)/);
  return (m?.[1] as Ready) ?? null;
}
function withReady(notes: string, ready: Ready | null) {
  const rest = (notes || "").replace(/readiness:(green|amber|red)\s*/g, "").trim();
  return ready ? `${READY_PREFIX}${ready}${rest ? " " + rest : ""}` : rest;
}

/** Draft: two-tap check-in (attendance → readiness) on the coach Today page. */
export function QuickCheckIn({ coachId, athletes, activeClubId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const date = new Date().toISOString().slice(0, 10);
  const [recs, setRecs] = useState<Map<string, Rec>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let q = supabase.from("session_attendance" as any).select("athlete_id, status, notes").eq("session_date", date);
      q = activeClubId ? q.eq("club_id", activeClubId) : q.eq("coach_id", coachId);
      const { data } = await q;
      const m = new Map<string, Rec>();
      ((data as any[]) || []).forEach((r) => {
        if (["present", "absent", "injured"].includes(r.status))
          m.set(r.athlete_id, { status: r.status, ready: parseReady(r.notes), notes: r.notes || "" });
      });
      setRecs(m);
      setLoading(false);
    })();
  }, [coachId, activeClubId, date]);

  const save = async (rows: { id: string; rec: Rec }[]) => {
    const payload = rows.map(({ id, rec }) => ({
      coach_id: coachId, athlete_id: id, session_date: date, status: rec.status, notes: rec.notes,
      ...(activeClubId ? { club_id: activeClubId } : {}),
    }));
    const { error } = await supabase.from("session_attendance" as any).upsert(payload, { onConflict: "athlete_id,session_date" });
    if (error) toast({ title: t("error"), description: error.message, variant: "destructive" });
  };

  const update = (id: string, patch: Partial<Rec>) => {
    const cur = recs.get(id) ?? { status: "present" as Status, ready: null, notes: "" };
    const next: Rec = { ...cur, ...patch };
    if (next.status !== "present") next.ready = null;
    next.notes = withReady(cur.notes, next.ready);
    setRecs(new Map(recs).set(id, next));
    save([{ id, rec: next }]);
  };

  const allPresent = () => {
    const m = new Map(recs);
    const rows: { id: string; rec: Rec }[] = [];
    athletes.forEach((a) => {
      if (m.has(a.user_id)) return;
      const rec: Rec = { status: "present", ready: null, notes: "" };
      m.set(a.user_id, rec); rows.push({ id: a.user_id, rec });
    });
    setRecs(m);
    if (rows.length) save(rows);
  };

  const done = useMemo(() => athletes.filter((a) => recs.has(a.user_id)).length, [athletes, recs]);

  const statusBtns: { s: Status; icon: typeof Check; label: string; on: string }[] = [
    { s: "present", icon: Check, label: t("qciPresent"), on: "bg-primary text-primary-foreground" },
    { s: "injured", icon: HeartCrack, label: t("qciInjured"), on: "bg-secondary text-secondary-foreground" },
    { s: "absent", icon: X, label: t("qciAbsent"), on: "bg-destructive text-destructive-foreground" },
  ];
  const readyBtns: { r: Ready; label: string; on: string }[] = [
    { r: "green", label: t("qciReady"), on: "bg-primary text-primary-foreground border-primary" },
    { r: "amber", label: t("qciModerate"), on: "bg-secondary text-secondary-foreground border-secondary" },
    { r: "red", label: t("qciLow"), on: "bg-destructive text-destructive-foreground border-destructive" },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card/60 overflow-hidden">
      <div className="p-4 border-b border-border/60 flex items-start gap-3">
        <Zap className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-card-foreground">{t("qciTitle")}</h3>
            <Badge variant="outline">{t("qciDraft")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("qciHint")}</p>
          <p className="text-xs font-semibold text-card-foreground mt-1">
            {t("qciProgress").replace("{n}", String(done)).replace("{m}", String(athletes.length))}
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-11 sm:h-10 rounded-2xl" onClick={allPresent} disabled={loading || done === athletes.length}>
          {t("qciAllPresent")}
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : athletes.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">{t("noAthletes")}</div>
      ) : (
        <ul>
          {athletes.map((a) => {
            const rec = recs.get(a.user_id);
            return (
              <li key={a.user_id} className="px-4 py-3 border-b border-border/40 last:border-b-0">
                <div className="flex items-center gap-3">
                  <AvatarImg avatarUrl={a.avatar_url} className="h-10 w-10 rounded-xl" />
                  <span className={cn("flex-1 min-w-0 truncate font-semibold text-sm", !rec && "text-muted-foreground")}>{a.display_name}</span>
                  <div className="flex gap-1">
                    {statusBtns.map(({ s, icon: Icon, label, on }) => (
                      <button key={s} type="button" aria-label={label} title={label} aria-pressed={rec?.status === s}
                        onClick={() => update(a.user_id, { status: s })}
                        className={cn("h-11 w-11 rounded-xl flex items-center justify-center border border-border transition active:scale-90",
                          rec?.status === s ? on : "text-muted-foreground bg-background")}>
                        <Icon className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
                {rec?.status === "present" && (
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    {readyBtns.map(({ r, label, on }) => (
                      <button key={r} type="button" aria-pressed={rec.ready === r}
                        onClick={() => update(a.user_id, { ready: rec.ready === r ? null : r })}
                        className={cn("h-11 rounded-xl text-xs font-semibold border transition active:scale-95",
                          rec.ready === r ? on : "border-border bg-background text-muted-foreground")}>
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
