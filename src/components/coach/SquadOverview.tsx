import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImg } from "@/components/AvatarImg";
import {
  Loader2, AlertTriangle, Heart, Activity, Frown, Meh, Smile, Calendar,
  Search, LayoutGrid, List as ListIcon, UserCog, NotebookPen, Trash2, Building, Eye,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { PulseFilter } from "./SquadPulse";

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
  // Locally augmented
  club_name?: string | null;
}

type SortKey = "attention" | "name" | "belt" | "lastActive";
type ViewMode = "compact" | "cards";

interface AthleteMeta {
  user_id: string;
  club_name?: string | null;
}

interface Props {
  coachId: string;
  onSelectAthlete?: (userId: string) => void;
  onDiary?: (userId: string, displayName: string) => void;
  onRemove?: (userId: string) => void;
  onViewPlan?: (userId: string) => void;
  allowedUserIds?: string[];
  athleteMeta?: AthleteMeta[];
  pulseFilter?: PulseFilter;
  onStatsChange?: (stats: { total: number; attention: number; injured: number; noPlan: number; stale: number }) => void;
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

export function SquadOverview({
  coachId,
  onSelectAthlete,
  onDiary,
  onRemove,
  onViewPlan,
  allowedUserIds,
  athleteMeta,
  pulseFilter = "all",
  onStatsChange,
}: Props) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<SquadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("name");
  const [view, setView] = useState<ViewMode>("compact");
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState<string>("all");

  const allowedKey = (allowedUserIds || []).slice().sort().join(",");
  const metaKey = (athleteMeta || []).map((m) => `${m.user_id}:${m.club_name || ""}`).join("|");

  const load = async () => {
    const { data, error } = await supabase.rpc("get_squad_overview" as any, { _coach_id: coachId });
    if (!error && data) {
      const all = data as unknown as SquadRow[];
      const metaMap = new Map((athleteMeta || []).map((m) => [m.user_id, m.club_name || null]));
      const filtered = (allowedUserIds
        ? all.filter((r) => allowedUserIds.includes(r.user_id))
        : all
      ).map((r) => ({ ...r, club_name: metaMap.get(r.user_id) ?? null }));
      setRows(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachId, allowedKey, metaKey]);

  // Stats for parent
  useEffect(() => {
    if (!onStatsChange) return;
    const stats = {
      total: rows.length,
      attention: rows.filter((r) => rowSeverity(r).status !== "green").length,
      injured: rows.filter((r) => r.has_active_injury).length,
      noPlan: rows.filter((r) => !r.has_active_plan).length,
      stale: rows.filter((r) => {
        const d = daysSince(r.last_seen_at);
        return d !== null && d >= 7;
      }).length,
    };
    onStatsChange(stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (pulseFilter === "attention") out = out.filter((r) => rowSeverity(r).status !== "green");
    else if (pulseFilter === "injured") out = out.filter((r) => r.has_active_injury);
    else if (pulseFilter === "noPlan") out = out.filter((r) => !r.has_active_plan);
    else if (pulseFilter === "stale") {
      out = out.filter((r) => {
        const d = daysSince(r.last_seen_at);
        return d !== null && d >= 7;
      });
    }
    if (beltFilter !== "all") out = out.filter((r) => r.belt_level === beltFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          (r.display_name || "").toLowerCase().includes(q) ||
          (r.athlete_code || "").toLowerCase().includes(q) ||
          (r.club_name || "").toLowerCase().includes(q),
      );
    }
    return out;
  }, [rows, pulseFilter, beltFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === "name") {
        const firstA = (a.display_name || "").trim().split(/\s+/)[0] || "";
        const firstB = (b.display_name || "").trim().split(/\s+/)[0] || "";
        return firstA.localeCompare(firstB, undefined, { sensitivity: "base" });
      }
      if (sort === "belt") return BELT_ORDER.indexOf(a.belt_level) - BELT_ORDER.indexOf(b.belt_level);
      if (sort === "lastActive") {
        const da = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const db = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return db - da;
      }
      return rowSeverity(b).score - rowSeverity(a).score;
    });
  }, [filtered, sort]);

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
      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchSquadPlaceholder")}
              className="pl-8 h-9"
            />
          </div>
          <div className="hidden sm:flex items-center rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("compact")}
              className={cn(
                "h-8 px-2 rounded text-xs flex items-center gap-1 transition-colors",
                view === "compact" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
              )}
              aria-label={t("viewCompact")}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("cards")}
              className={cn(
                "h-8 px-2 rounded text-xs flex items-center gap-1 transition-colors",
                view === "cards" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50",
              )}
              aria-label={t("viewCards")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={beltFilter} onValueChange={setBeltFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allBelts")}</SelectItem>
              {BELT_ORDER.map((b) => (
                <SelectItem key={b} value={b}>{t(b)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attention">{t("sortNeedsAttention")}</SelectItem>
              <SelectItem value="name">{t("sortByName")}</SelectItem>
              <SelectItem value="belt">{t("sortByBelt")}</SelectItem>
              <SelectItem value="lastActive">{t("sortLastActive")}</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">
            {sorted.length} / {rows.length}
          </span>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("noMatchingAthletes")}
        </div>
      ) : (
        <div className={cn("grid gap-2", view === "cards" && "sm:grid-cols-2")}>
          {sorted.map((r) => {
            const { status } = rowSeverity(r);
            const days = daysSince(r.last_seen_at);
            const moodIcon = r.latest_mood && r.latest_mood >= 4 ? Smile : r.latest_mood && r.latest_mood >= 3 ? Meh : Frown;
            const MoodIcon = moodIcon;
            const completion = r.planned_sessions_7d > 0 ? r.sessions_logged_7d / r.planned_sessions_7d : 0;
            const borderClass =
              status === "red" ? "border-l-destructive" : status === "amber" ? "border-l-orange-400" : "border-l-emerald-500";

            return (
              <div
                key={r.user_id}
                className={cn(
                  "rounded-lg border bg-card p-3 border-l-4 transition-colors hover:bg-accent/30",
                  borderClass,
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectAthlete?.(r.user_id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <AvatarImg avatarUrl={r.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="flex flex-wrap items-center gap-2.5 mt-1 text-[11px] text-muted-foreground">
                        {r.club_name && (
                          <span className="inline-flex items-center gap-0.5">
                            <Building className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">{r.club_name}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1" title={t("readiness")}>
                          <Activity className="h-3 w-3" />
                          {r.latest_readiness_score ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1" title={t("mood")}>
                          <MoodIcon className="h-3 w-3" />
                          {r.latest_mood ?? "—"}/5
                        </span>
                        <span className="inline-flex items-center gap-1" title={t("sessions7d")}>
                          <Calendar className="h-3 w-3" />
                          {r.sessions_logged_7d}/{r.planned_sessions_7d || "?"}
                        </span>
                        {days !== null && days >= 3 && (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <AlertTriangle className="h-3 w-3" />
                            {days}d
                          </span>
                        )}
                        <span className="capitalize">{r.belt_level}</span>
                        <span>{Math.round(completion * 100)}%</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {onSelectAthlete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => onSelectAthlete(r.user_id)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">{t("manageAthlete")}</TooltipContent>
                      </Tooltip>
                    )}
                    {onViewPlan && r.has_active_plan && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewPlan(r.user_id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">{t("viewPlan")}</TooltipContent>
                      </Tooltip>
                    )}
                    {onDiary && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onDiary(r.user_id, r.display_name)}
                          >
                            <NotebookPen className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">{t("diary")}</TooltipContent>
                      </Tooltip>
                    )}
                    {onRemove && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => onRemove(r.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">{t("remove")}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
