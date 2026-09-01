import { useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useOfflineDiary } from "@/hooks/useOfflineDiary";
import { cn } from "@/lib/utils";

type Status = "done" | "partial" | "skipped";

interface Props {
  /** Hide the card on rest days. */
  isRestDay?: boolean;
  /** Optional label for today's session, e.g. "Taekwondo". */
  sessionLabel?: string | null;
}

/**
 * One-tap post-training log shown on the athlete hub on training days
 * until an entry exists for today. Writes through the offline diary,
 * so it works with no connection.
 */
export function QuickTrainingLog({ isRestDay, sessionLabel }: Props) {
  const { t } = useLanguage();
  const { entries, createEntry } = useOfflineDiary();
  const [status, setStatus] = useState<Status | null>(null);
  const [effort, setEffort] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const alreadyLogged = entries.some(
    (e) => e.entry_date === today && (e.entry_type === "training" || (e.entry_types || []).includes("training")),
  );

  if (isRestDay || dismissed || (alreadyLogged && !saved)) return null;

  const statusLabel: Record<Status, string> = {
    done: t("quickLogDone"),
    partial: t("quickLogPartial"),
    skipped: t("quickLogSkipped"),
  };

  const save = async () => {
    if (!status || saving) return;
    setSaving(true);
    const head = sessionLabel ? `${sessionLabel} — ${statusLabel[status]}` : statusLabel[status];
    await createEntry({
      entry_date: today,
      content: note.trim() ? `${head}\n${note.trim()}` : head,
      mood: effort,
      energy: effort,
      tags: [status],
      entry_type: "training",
      entry_types: ["training"],
      is_private: false,
    });
    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <section className="rounded-xl border border-[#c9a84c]/30 bg-[#111] p-4 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#c9a84c]" />
        <p className="text-sm font-semibold text-white">{t("quickLogSaved")}</p>
      </section>
    );
  }

  return (
    <section className="relative rounded-xl border border-[#c9a84c]/30 bg-[#111] p-4 space-y-3">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("close") || "Luk"}
        className="absolute right-3 top-3 text-white/40 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div>
        <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-tight text-white">
          {t("quickLogTitle")}
        </h3>
        {sessionLabel && (
          <p className="text-[11px] uppercase tracking-widest text-[#c9a84c]/70 mt-0.5">{sessionLabel}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["done", "partial", "skipped"] as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-lg border px-2 py-2 text-xs font-bold transition-colors",
              status === s
                ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d0d0d]"
                : "border-white/15 bg-white/5 text-white/80 hover:border-[#c9a84c]/50",
            )}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">
            {t("quickLogEffort")}
          </span>
          <span className="text-sm font-bold text-[#c9a84c]">{effort}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={effort}
          onChange={(e) => setEffort(Number(e.target.value))}
          aria-label={t("quickLogEffort")}
          className="w-full accent-[#c9a84c]"
        />
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("quickLogNote")}
        className="w-full h-11 rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c9a84c]/60"
      />

      <button
        type="button"
        disabled={!status || saving}
        onClick={save}
        className="w-full h-11 rounded-lg bg-[#c9a84c] text-[#0d0d0d] text-sm font-bold disabled:opacity-40 transition-colors hover:bg-[#f0d78c]"
      >
        {t("quickLogSave")}
      </button>
      <p className="text-[11px] text-white/45 text-center">{t("quickLogAudience")}</p>
    </section>
  );
}
