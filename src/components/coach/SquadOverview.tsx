import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImg } from "@/components/AvatarImg";
import { Loader2, AlertTriangle, Heart, Activity, Frown, Meh, Smile, Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SquadRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  belt_level: string;
  athlete_code: string | null;
  tkd_sessions_per_week: number;
  last_seen_at: string | null;
  has_active_injury: boolean;
  has_active_plan: boolean;
  latest_readiness_score: number | null;
  latest_readiness_date: string | null;
  latest_mood: number | null;
  latest_energy: number | null;
  latest_diary_date: string | null;
  sessions_logged_7d: number;
  planned_sessions_7d: number;
}

type SortKey = "attention" | "name" | "belt" | "lastActive";

interface Props {
  coachId: string;
  onSelectAthlete?: (userId: string) => void;
  allowedUserIds?: string[];
}

const BELT_ORDER = ["white", "yellow", "green", "blue", "red", "black"];

function daysSince(date: string | null): number | null {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function rowSeverity(row: SquadRow): { score: number; status: "red" | "amber" | "green" } {
  let score = 0;
  if (row.has_active_injury && !row.has_active_plan) score += 4;
  if (row.has_active_injury) score += 2;
  if (!row.has_active_plan) score += 2;
  if ((row.latest_readiness_score ?? 100) < 50) score += 3;
  if ((row.latest_mood ?? 5) <= 2) score += 2;
  const completion = row.planned_sessions_7d > 0 ? row.sessions_logged_7d / row.planned_sessions_7d : 1;
  if (completion < 0.4) score += 3;
  else if (completion < 0.7) score += 1;
  const days = daysSince(row.last_seen_at);
  if (days !== null && days >= 7) score += 2;

  const status: "red" | "amber" | "green" = score >= 5 ? "red" : score >= 2 ? "amber" : "green";
  return { score, status };
}

export function SquadOverview({ coachId, onSelectAthlete, allowedUserIds }: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<SquadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("attention");

  const allowedKey = (allowedUserIds || []).slice().sort().join(",");

  const load = async () => {
    const { data, error } = await supabase.rpc("get_squad_overview" as any, { _coach_id: coachId });
    if (!error && data) {
      const all = data as unknown as SquadRow[];
      const filtered = allowedUserIds
        ? all.filter((r) => allowedUserIds.includes(r.user_id))
        : all;
      setRows(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId, allowedKey]);

  const sorted = [...rows].sort((a, b) => {
    if (sort === "name") return a.display_name.localeCompare(b.display_name);
    if (sort === "belt") return BELT_ORDER.indexOf(a.belt_level) - BELT_ORDER.indexOf(b.belt_level);
    if (sort === "lastActive") {
      const da = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const db = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      return db - da;
    }
    return rowSeverity(b).score - rowSeverity(a).score;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("squadEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {t("squadOverview")} ({rows.length})
        </h3>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="attention">{t("sortNeedsAttention")}</SelectItem>
            <SelectItem value="name">{t("sortByName")}</SelectItem>
            <SelectItem value="belt">{t("sortByBelt")}</SelectItem>
            <SelectItem value="lastActive">{t("sortLastActive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        {sorted.map((r) => {
          const { status } = rowSeverity(r);
          const days = daysSince(r.last_seen_at);
          const moodIcon = r.latest_mood && r.latest_mood >= 4 ? Smile : r.latest_mood && r.latest_mood >= 3 ? Meh : Frown;
          const MoodIcon = moodIcon;
          const completion = r.planned_sessions_7d > 0 ? r.sessions_logged_7d / r.planned_sessions_7d : 0;
          const borderClass = status === "red" ? "border-l-destructive" : status === "amber" ? "border-l-orange-400" : "border-l-emerald-500";

          return (
            <button
              key={r.user_id}
              onClick={() => onSelectAthlete?.(r.user_id)}
              className={cn(
                "rounded-lg border bg-card p-3 text-left border-l-4 hover:bg-accent/50 transition-colors",
                borderClass,
              )}
            >
              <div className="flex items-center gap-3">
                <AvatarImg avatarUrl={r.avatar_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{r.display_name}</p>
                    {r.has_active_injury && (
                      <Heart className="h-3 w-3 text-destructive flex-shrink-0" />
                    )}
                    {!r.has_active_plan && (
                      <span className="text-[9px] bg-orange-400/10 text-orange-500 px-1.5 py-0.5 rounded-full">
                        {t("noPlan")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {r.latest_readiness_score ?? "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MoodIcon className="h-3 w-3" />
                      {r.latest_mood ?? "—"}/5
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {r.sessions_logged_7d}/{r.planned_sessions_7d || "?"} {t("sessions7d")}
                    </span>
                    {days !== null && days >= 3 && (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {days}d
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground">
                  <div className="capitalize">{r.belt_level}</div>
                  <div>{Math.round(completion * 100)}%</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
