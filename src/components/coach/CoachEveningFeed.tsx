import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Moon, Loader2, Send, ThumbsUp, Check } from "lucide-react";

interface Props {
  coachId: string;
  athletes: { user_id: string; display_name: string }[];
  activeClubId: string | null;
}

interface FeedEntry {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  mood: number | null;
  tags: string[] | null;
}

/** Evening feed: today's diary entries across the squad with one-tap reply. */
export function CoachEveningFeed({ coachId, athletes, activeClubId }: Props) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<FeedEntry[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const names = new Map(athletes.map((a) => [a.user_id, a.display_name]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = athletes.map((a) => a.user_id);
      if (!ids.length) { setEntries([]); return; }
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("diary_entries")
        .select("id, user_id, content, created_at, mood, tags, is_private")
        .eq("entry_date", today)
        .in("user_id", ids)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setEntries((((data as any[]) || []).filter((e) => e.is_private !== true)) as FeedEntry[]);
    })();
    return () => { cancelled = true; };
  }, [athletes]);

  const reply = async (entryId: string, content: string) => {
    if (!content.trim()) return;
    await supabase.from("diary_comments").insert({
      diary_entry_id: entryId,
      coach_id: coachId,
      content: content.trim(),
      is_shared: true,
      ...(activeClubId ? { club_id: activeClubId } : {}),
    } as any);
    setSent((s) => ({ ...s, [entryId]: true }));
    setOpenId(null);
    setDraft("");
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-extrabold uppercase tracking-tight text-card-foreground">
          {t("coachEveningFeed")}
        </h2>
        {entries && entries.length > 0 && (
          <span className="ml-auto text-xs font-bold text-primary">
            {entries.length} {t("coachEveningFeedNew")}
          </span>
        )}
      </div>

      {!entries ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("coachEveningFeedEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-foreground truncate">
                  {names.get(e.user_id) || "—"}
                </span>
                {typeof e.mood === "number" && (
                  <span className="text-[11px] text-muted-foreground">
                    {t("quickLogEffort")} {e.mood}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                  {new Date(e.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">{e.content}</p>

              {sent[e.id] ? (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary">
                  <Check className="h-3.5 w-3.5" /> {t("coachQuickReply")}
                </p>
              ) : openId === e.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(ev) => setDraft(ev.target.value)}
                    onKeyDown={(ev) => { if (ev.key === "Enter") void reply(e.id, draft); }}
                    className="flex-1 h-11 rounded-lg border border-input bg-background px-3 text-sm"
                    placeholder={t("coachQuickReply")}
                  />
                  <button
                    type="button"
                    onClick={() => void reply(e.id, draft)}
                    aria-label={t("coachQuickReply")}
                    title={t("coachQuickReply")}
                    className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void reply(e.id, "👍")}
                    aria-label="👍"
                    title="👍"
                    className="h-9 px-3 rounded-lg border border-border text-sm hover:border-primary/40 transition-colors flex items-center"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpenId(e.id); setDraft(""); }}
                    className="h-9 px-3 rounded-lg border border-border text-sm font-semibold hover:border-primary/40 transition-colors"
                  >
                    {t("coachQuickReply")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
