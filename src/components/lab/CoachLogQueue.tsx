import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Users, Lock, ShieldAlert, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { effortWordKey } from "@/components/lab/TrainingLogCard";
import { fetchClubStaffIds } from "@/lib/clubStaff";


interface Athlete {
  user_id: string;
  display_name: string;
  birth_date?: string | null;
}

interface Props {
  athletes: Athlete[];
  bare?: boolean;
}

interface QueueRow {
  id: string;
  user_id: string;
  name: string;
  content: string;
  effort: number | null;
  isMinor: boolean;
  handledBy: string | null;
}

const QUICK_REPLIES_KEYS = ["labQuickReplyGood", "labQuickReplyNoted"] as const;

/**
 * Shared post-training queue: every coach in the club sees the same rows,
 * and the first reply clears the row for everyone.
 */
export function CoachLogQueue({ athletes, bare }: Props) {
  const { t } = useLanguage();
  const { activeClubId, primaryClubId } = useActiveClub();
  const { toast } = useToast();
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [shared, setShared] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const clubId = activeClubId ?? primaryClubId ?? null;
    const staff = await fetchClubStaffIds(clubId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) staff.add(user.id);

    const roster = athletes.filter((a) => !staff.has(a.user_id));
    const ids = roster.map((a) => a.user_id);
    if (ids.length === 0) { setRows([]); return; }
    const today = new Date().toISOString().slice(0, 10);

    const { data: entries } = await supabase
      .from("diary_entries")
      .select("id, user_id, content, mood, energy, entry_date, is_private, entry_type, entry_types")
      .eq("entry_date", today)
      .in("user_id", ids)
      .order("created_at", { ascending: true });

    const list = ((entries as any[]) || []).filter(
      (e) => e.is_private !== true &&
        (e.entry_type === "training" || ((e.entry_types as string[]) || []).includes("training")),
    );
    if (list.length === 0) { setRows([]); return; }


    const { data: comments } = await supabase
      .from("diary_comments" as any)
      .select("diary_entry_id, coach_id")
      .in("diary_entry_id", list.map((e) => e.id));

    const handled = new Map<string, string>();
    for (const c of ((comments as any[]) || [])) handled.set(c.diary_entry_id, c.coach_id);

    const byId = new Map(athletes.map((a) => [a.user_id, a]));
    const now = Date.now();

    setRows(list.map((e) => {
      const a = byId.get(e.user_id);
      const bd = a?.birth_date ? new Date(a.birth_date).getTime() : null;
      const isMinor = bd ? (now - bd) / (365.25 * 86400000) < 18 : false;
      return {
        id: e.id,
        user_id: e.user_id,
        name: a?.display_name || "—",
        content: (e.content || "").slice(0, 600),
        effort: e.mood ?? e.energy ?? null,
        isMinor,
        handledBy: handled.get(e.id) ?? null,
      };
    }));
  }, [athletes]);

  useEffect(() => { void load(); }, [load]);

  const send = async (row: QueueRow, text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const clubId = activeClubId ?? primaryClubId ?? null;
    const { error } = await supabase.from("diary_comments" as any).insert({
      diary_entry_id: row.id,
      coach_id: user.id,
      content: text.trim().slice(0, 2000),
      is_shared: shared,
      ...(clubId ? { club_id: clubId } : {}),
    } as any);
    setSending(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setDraft("");
    setOpenId(null);
    setShared(true);
    await load();
  };

  const pending = (rows || []).filter((r) => !r.handledBy);
  const done = (rows || []).filter((r) => r.handledBy);

  const body = (
    <>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-extrabold uppercase tracking-tight text-card-foreground">{t("labQueueTitle")}</h2>
        {rows && pending.length > 0 && (
          <span className="ml-auto text-xs font-bold text-primary">{pending.length}</span>
        )}
      </div>

      {!rows ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : pending.length === 0 && done.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("labQueueEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-card-foreground">{r.name}</span>
                {r.effort != null && (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    {r.effort} · {t(effortWordKey(r.effort) as any)}
                  </span>
                )}
                {r.isMinor && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <ShieldAlert className="h-3 w-3" /> {t("labMinorTag")}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{r.content}</p>

              {openId === r.id ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REPLIES_KEYS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDraft(t(k as any))}
                        className="rounded-full border border-border px-3 py-1.5 text-xs text-card-foreground hover:border-primary/50"
                      >
                        {t(k as any)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
                    rows={2}
                    placeholder={t("labReplyPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { v: true, label: t("labReplyToAthlete"), Icon: Users },
                      { v: false, label: t("labReplyCoachesOnly"), Icon: Lock },
                    ]).map(({ v, label, Icon }) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setShared(v)}
                        style={{ minHeight: 44 }}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition-colors",
                          shared === v
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  {r.isMinor && <p className="text-[11px] text-muted-foreground">{t("labMinorNotice")}</p>}
                  <button
                    type="button"
                    disabled={sending || !draft.trim()}
                    onClick={() => send(r, draft)}
                    style={{ minHeight: 44 }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" /> {t("labSend")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOpenId(r.id); setDraft(""); setShared(true); }}
                  style={{ minHeight: 44 }}
                  className="w-full rounded-lg border border-primary/40 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10"
                >
                  {t("labReply")}
                </button>
              )}
            </li>
          ))}

          {done.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 opacity-60">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-card-foreground">{r.name}</span>
              <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {t("labHandled")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return bare ? <div className="space-y-3">{body}</div> : (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">{body}</section>
  );
}
