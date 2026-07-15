import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { AvatarImg } from "@/components/AvatarImg";
import { ChevronDown, ClipboardList, Loader2, Sparkles } from "lucide-react";

interface AthleteLite {
  user_id: string;
  display_name: string | null;
  avatar_url?: string | null;
}

interface Props {
  athletes: AthleteLite[];
}

const MONTH_LABEL_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril",
  "monthMay", "monthJune", "monthJuly", "monthAugust",
  "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const;

export function BulkMonthlyReportsCard({ athletes }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const [selMonth, setSelMonth] = useState<number>(prev.getUTCMonth() + 1);
  const [selYear, setSelYear] = useState<number>(prev.getUTCFullYear());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; ok: number } | null>(null);
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () => [...athletes].sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "")),
    [athletes],
  );

  const allSelected = selected.size > 0 && selected.size === sorted.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map((a) => a.user_id)));
  }

  async function runBulk() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setRunning(true);
    setProgress({ done: 0, total: ids.length, ok: 0 });
    let ok = 0;
    let done = 0;
    // Sequential to avoid overloading the AI gateway and to keep progress simple.
    for (const athleteId of ids) {
      try {
        const { error } = await supabase.functions.invoke("generate-monthly-report", {
          body: { athlete_user_id: athleteId, year: selYear, month: selMonth, force: true },
        });
        if (!error) ok++;
      } catch {
        /* swallow — surfaced in totals */
      }
      done++;
      setProgress({ done, total: ids.length, ok });
    }
    setRunning(false);
    toast({
      title: t("monthlyDevReportBulkDone"),
      description: `${ok}/${ids.length}`,
    });
  }

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h4 className="font-semibold text-sm flex items-center gap-2 text-card-foreground">
            <ClipboardList className="h-4 w-4 text-primary" /> {t("monthlyDevReportBulkTitle")}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{t("monthlyDevReportBulkDesc")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <select
            className="h-8 text-xs rounded-md border border-input bg-background px-2"
            value={selMonth}
            onChange={(e) => setSelMonth(Number(e.target.value))}
            aria-label={t("monthLabel")}
            disabled={running}
          >
            {MONTH_LABEL_KEYS.map((k, i) => (
              <option key={k} value={i + 1}>{t(k)}</option>
            ))}
          </select>
          <select
            className="h-8 text-xs rounded-md border border-input bg-background px-2"
            value={selYear}
            onChange={(e) => setSelYear(Number(e.target.value))}
            aria-label={t("yearLabel")}
            disabled={running}
          >
            {Array.from({ length: 4 }).map((_, i) => {
              const y = new Date().getUTCFullYear() - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-primary hover:underline"
          disabled={running}
        >
          {allSelected ? t("deselectAll") : t("selectAll")}
        </button>
        <span className="text-xs text-muted-foreground">
          {selected.size}/{sorted.length}
        </span>
      </div>

      <ul className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {sorted.map((a) => {
          const isSel = selected.has(a.user_id);
          return (
            <li key={a.user_id}>
              <label
                className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-2.5 py-1.5 cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <Checkbox
                  checked={isSel}
                  onCheckedChange={() => toggle(a.user_id)}
                  disabled={running}
                />
                <AvatarImg avatarUrl={a.avatar_url ?? null} className="h-6 w-6 rounded-full object-cover" />
                <span className="text-xs text-card-foreground truncate flex-1">
                  {a.display_name || "—"}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-muted-foreground">
          {progress ? `${progress.done}/${progress.total} — ${progress.ok} ✓` : ""}
        </span>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={runBulk}
          disabled={running || selected.size === 0}
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1" />
          )}
          {running ? t("monthlyDevReportBulkProgress") : t("monthlyDevReportGenerateFor")}
        </Button>
      </div>
    </div>
  );
}
