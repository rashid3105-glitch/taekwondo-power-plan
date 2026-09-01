import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Lock, Users, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useOfflineDiary } from "@/hooks/useOfflineDiary";
import { cn } from "@/lib/utils";

type Status = "done" | "partial" | "skipped";
type Audience = "coaches" | "me";

interface Props {
  /** Hide on rest days. */
  isRestDay?: boolean;
  /** Optional label for today's session. */
  sessionLabel?: string | null;
  /** Render without the outer card chrome (used on the lab page). */
  bare?: boolean;
}

export function effortWordKey(v: number) {
  if (v <= 2) return "labEffortVeryEasy";
  if (v <= 4) return "labEffortEasy";
  if (v <= 6) return "labEffortModerate";
  if (v <= 8) return "labEffortHard";
  return "labEffortMax";
}

/**
 * Post-training log v2 — audience-first wording ("My coaches" / "Only me")
 * plus a receipt that shows the coach reply when it arrives.
 * Writes through the offline diary so it works with no connection.
 */
export function TrainingLogCard({ isRestDay, sessionLabel, bare }: Props) {
  const { t } = useLanguage();
  const { entries, createEntry } = useOfflineDiary();
  const [status, setStatus] = useState<Status | null>(null);
  const [effort, setEffort] = useState(7);
  const [note, setNote] = useState("");
  const [audience, setAudience] = useState<Audience>("coaches");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<{ id: string; content: string }[]>([]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todaysEntry = entries.find(
    (e) => e.entry_date === today && (e.entry_type === "training" || (e.entry_types || []).includes("training")),
  );
  const entryId = savedId ?? (todaysEntry && !String(todaysEntry.id).startsWith("local-") ? todaysEntry.id : null);
  const hasLogged = Boolean(todaysEntry) || Boolean(savedId);

  // Receipt: pull shared coach replies for today's entry.
  useEffect(() => {
    if (!entryId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("diary_comments" as any)
        .select("id, content, is_shared")
        .eq("diary_entry_id", entryId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setReplies(((data as any[]) || []).filter((c) => c.is_shared !== false).map((c) => ({ id: c.id, content: c.content })));
    })();
    return () => { cancelled = true; };
  }, [entryId, savedId]);

  if (isRestDay) return null;

  const statusLabel: Record<Status, string> = {
    done: t("quickLogDone"),
    partial: t("quickLogPartial"),
    skipped: t("quickLogSkipped"),
  };

  const save = async () => {
    if (!status || saving) return;
    setSaving(true);
    const head = sessionLabel ? `${sessionLabel} — ${statusLabel[status]}` : statusLabel[status];
    const created: any = await createEntry({
      entry_date: today,
      content: note.trim() ? `${head}\n${note.trim()}` : head,
      mood: effort,
      energy: effort,
      tags: [status],
      entry_type: "training",
      entry_types: ["training"],
      is_private: audience === "me",
    });
    setSaving(false);
    setSavedId(created?.id ?? "pending");
  };

  const wrap = (children: React.ReactNode) =>
    bare ? <div className="space-y-3">{children}</div> : (
      <section className="rounded-xl border border-primary/30 bg-card p-4 space-y-3">{children}</section>
    );

  if (hasLogged) {
    const shownAudience = (todaysEntry?.is_private ?? audience === "me") ? t("labAudienceMe") : t("labAudienceCoaches");
    return wrap(
      <>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-card-foreground">{t("quickLogSaved")}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("labSentTo")}: <span className="text-card-foreground font-semibold">{shownAudience}</span>
        </p>
        {replies.length > 0 && (
          <div className="space-y-2 pt-1">
            {replies.map((r) => (
              <div key={r.id} className="flex gap-2 rounded-lg border border-border bg-background/40 p-2.5">
                <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-card-foreground">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </>,
    );
  }

  return wrap(
    <>
      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-tight text-card-foreground">{t("quickLogTitle")}</h3>
        {sessionLabel && (
          <p className="text-[11px] uppercase tracking-widest text-primary/70 mt-0.5">{sessionLabel}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["done", "partial", "skipped"] as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            style={{ minHeight: 44 }}
            className={cn(
              "rounded-lg border px-2 py-2 text-xs font-bold transition-colors",
              status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/40 text-card-foreground hover:border-primary/50",
            )}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("quickLogEffort")}
          </span>
          <span className="text-sm font-bold text-primary">
            {effort} · {t(effortWordKey(effort) as any)}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={effort}
          onChange={(e) => setEffort(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label={t("quickLogEffort")}
        />
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        placeholder={t("labNotePlaceholder")}
        rows={2}
        className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-2">
        {([
          { key: "coaches" as Audience, label: t("labAudienceCoaches"), Icon: Users },
          { key: "me" as Audience, label: t("labAudienceMe"), Icon: Lock },
        ]).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setAudience(key)}
            style={{ minHeight: 44 }}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition-colors",
              audience === key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-background/40 text-muted-foreground hover:border-primary/40",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">{t("labAudienceHint")}</p>

      <button
        type="button"
        disabled={!status || saving}
        onClick={save}
        style={{ minHeight: 44 }}
        className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-extrabold text-primary-foreground disabled:opacity-40"
      >
        {saving ? "…" : t("labSend")}
      </button>
    </>,
  );
}
