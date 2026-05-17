// Coach-side diary view of a single athlete. Mirrors the athlete Diary page:
// search, type chips, tag chips, date range filter, month grouping, compact
// rows that expand on tap. Read-only — uses DiaryComments for coach feedback.

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiaryComments } from "@/components/DiaryComments";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Search, ChevronDown, ChevronRight, Filter,
  Frown, Meh, Smile, Laugh, BatteryLow, BatteryMedium, BatteryFull,
} from "lucide-react";
import type { DiaryEntryType } from "@/lib/diaryOfflineDB";
import {
  ENTRY_TYPES, typeMeta, computeTypeCounts, computeAvailableTags,
  filterEntries, groupByMonth, currentMonthKey,
  type DateRange, type ViewMode, type DiaryEntryLike,
} from "@/lib/diaryFilters";

const MOOD_ICONS = [Frown, Frown, Meh, Smile, Laugh];
const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
const MOOD_COLORS = ["text-destructive", "text-orange-400", "text-yellow-400", "text-emerald-400", "text-emerald-500"];
const ENERGY_ICONS = [BatteryLow, BatteryLow, BatteryMedium, BatteryFull, BatteryFull];
const ENERGY_LABELS = ["Drained", "Low", "Moderate", "High", "Peak"];

const PAGE_SIZE = 20;

interface Props {
  entries: DiaryEntryLike[];
}

export function CoachDiaryView({ entries }: Props) {
  const { t } = useLanguage();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DiaryEntryType | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(
    () => (localStorage.getItem("coach-diary-range") as DateRange) || "30",
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("coach-diary-view") as ViewMode) || "compact",
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [pageLimit, setPageLimit] = useState(PAGE_SIZE);

  useEffect(() => { localStorage.setItem("coach-diary-view", viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem("coach-diary-range", dateRange); }, [dateRange]);

  const typeCounts = useMemo(() => computeTypeCounts(entries), [entries]);
  const availableTags = useMemo(() => computeAvailableTags(entries), [entries]);
  const filtered = useMemo(
    () => filterEntries(entries, { typeFilter, tagFilter, dateRange, search }),
    [entries, typeFilter, tagFilter, dateRange, search],
  );
  const visible = useMemo(() => filtered.slice(0, pageLimit), [filtered, pageLimit]);
  const grouped = useMemo(() => groupByMonth(visible), [visible]);
  const monthKeyToday = useMemo(() => currentMonthKey(), []);

  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setTagFilter(null);
    setDateRange("30");
  };

  const hasActiveFilters = search || typeFilter !== "all" || tagFilter || dateRange !== "30";

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">{t("diaryEmpty")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("diarySearchPlaceholder")}
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-[11px] shrink-0"
            onClick={() => setViewMode((v) => v === "compact" ? "detailed" : "compact")}
          >
            {viewMode === "compact" ? t("diaryViewCompact") : t("diaryViewDetailed")}
          </Button>
        </div>

        {/* Type chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => setTypeFilter("all")}
            className={`shrink-0 rounded-full px-3 h-8 text-xs font-semibold border transition-colors ${
              typeFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
            }`}
          >
            {t("diaryFilterAll")} ({typeCounts.all || 0})
          </button>
          {ENTRY_TYPES.map((meta) => {
            const Icon = meta.Icon;
            const count = typeCounts[meta.value] || 0;
            if (count === 0) return null;
            const active = typeFilter === meta.value;
            return (
              <button
                key={meta.value}
                onClick={() => setTypeFilter(meta.value)}
                className={`shrink-0 flex items-center gap-1 rounded-full px-3 h-8 text-xs font-semibold border transition-colors ${
                  active ? `${meta.bg} ${meta.border} ${meta.color}` : "border-border text-muted-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {t(meta.i18nKey as any)} ({count})
              </button>
            );
          })}
        </div>

        {/* Tag chips */}
        {availableTags.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {availableTags.map((tag) => {
              const active = tagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setTagFilter(active ? null : tag)}
                  className={`shrink-0 rounded-full px-3 h-7 text-[11px] font-semibold border transition-colors ${
                    active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {(["7", "30", "90", "all"] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`rounded-full px-2.5 h-7 text-[11px] font-semibold border transition-colors ${
                dateRange === r ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {r === "all" ? t("diaryRangeAll") : t(`diaryRange${r}` as any)}
            </button>
          ))}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] ml-auto" onClick={clearFilters}>
              {t("diaryClearFilters")}
            </Button>
          )}
        </div>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("diaryNoMatches")}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
            {t("diaryClearFilters")}
          </Button>
        </div>
      ) : (
        <>
          {grouped.map(([monthKey, items]) => {
            const userToggled = collapsedMonths.has(monthKey);
            const isCollapsed = userToggled
              ? true
              : monthKey !== monthKeyToday;
            const [yearStr, monthStr] = monthKey.split("-");
            const monthDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
            const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
            // re-derive collapse: support reopening older months
            const reallyCollapsed = collapsedMonths.has(monthKey)
              ? !collapsedMonths.has(`__open:${monthKey}`)
              : monthKey !== monthKeyToday && !collapsedMonths.has(`__open:${monthKey}`);
            return (
              <div key={monthKey} className="space-y-2">
                <button
                  onClick={() => {
                    setCollapsedMonths((prev) => {
                      const next = new Set(prev);
                      const openKey = `__open:${monthKey}`;
                      if (next.has(openKey)) {
                        next.delete(openKey);
                        next.add(monthKey);
                      } else if (next.has(monthKey)) {
                        next.delete(monthKey);
                        next.add(openKey);
                      } else if (monthKey === monthKeyToday) {
                        next.add(monthKey);
                      } else {
                        next.add(openKey);
                      }
                      return next;
                    });
                  }}
                  className="w-full flex items-center justify-between px-1 py-1 text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    {reallyCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {monthLabel} ({items.length})
                  </span>
                </button>
                {!reallyCollapsed && items.map((entry) => {
                  const meta = typeMeta(entry.entry_type || "general");
                  const Icon = meta.Icon;
                  const EntryMood = MOOD_ICONS[(entry.mood || 3) - 1] || Meh;
                  const EntryEnergy = ENERGY_ICONS[(entry.energy || 3) - 1] || BatteryMedium;
                  const isExpanded = viewMode === "detailed" || expandedIds.has(entry.id);
                  const dateStr = new Date(entry.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short", day: "numeric", month: "short",
                  });

                  if (!isExpanded) {
                    return (
                      <button
                        key={entry.id}
                        onClick={() => toggleExpand(entry.id)}
                        className={`w-full text-left rounded-xl border ${meta.border} bg-card hover:bg-muted/30 p-3 transition-colors`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                              <span>{dateStr}</span>
                              <span className={MOOD_COLORS[(entry.mood || 3) - 1]}><EntryMood className="h-3 w-3 inline" /></span>
                              <span className="text-primary"><EntryEnergy className="h-3 w-3 inline" /></span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2 mt-0.5 break-words min-w-0">{entry.content}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    );
                  }

                  return (
                    <div key={entry.id} className={`rounded-xl border ${meta.border} bg-card p-3 sm:p-4 space-y-2`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color}`}>
                          <Icon className="h-3 w-3" />
                          {t(meta.i18nKey as any)}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">{dateStr}</span>
                        <span className={MOOD_COLORS[(entry.mood || 3) - 1]} title={MOOD_LABELS[(entry.mood || 3) - 1]}>
                          <EntryMood className="h-4 w-4" />
                        </span>
                        <span className="text-primary" title={ENERGY_LABELS[(entry.energy || 3) - 1]}>
                          <EntryEnergy className="h-4 w-4" />
                        </span>
                        {viewMode === "compact" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => toggleExpand(entry.id)}>
                            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere min-w-0">{entry.content}</p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <DiaryComments entryId={entry.id} canComment={true} />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filtered.length > pageLimit && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setPageLimit((n) => n + PAGE_SIZE)}>
                {t("diaryLoadOlder")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
