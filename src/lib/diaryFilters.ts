// Shared diary filtering, grouping and type metadata.
// Used by both the athlete diary page and the coach's diary view of an athlete.

import {
  Dumbbell, Trophy, Heart, Brain, Bandage, NotebookPen, Footprints,
} from "lucide-react";
import type { DiaryEntryType } from "@/lib/diaryOfflineDB";

export type DateRange = "7" | "30" | "90" | "all";
export type ViewMode = "compact" | "detailed";

export interface DiaryEntryLike {
  id: string;
  entry_date: string;
  content: string;
  mood: number;
  energy: number;
  tags: string[];
  entry_type?: DiaryEntryType | null;
}

export interface TypeMeta {
  value: DiaryEntryType;
  i18nKey: string;
  Icon: typeof Dumbbell;
  color: string;
  bg: string;
  border: string;
}

export const ENTRY_TYPES: TypeMeta[] = [
  { value: "general", i18nKey: "diaryTypeGeneral", Icon: NotebookPen, color: "text-muted-foreground", bg: "bg-muted/40", border: "border-border" },
  { value: "training", i18nKey: "diaryTypeTraining", Icon: Dumbbell, color: "text-primary", bg: "bg-primary/10", border: "border-primary/40" },
  { value: "competition", i18nKey: "diaryTypeCompetition", Icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/40" },
  { value: "recovery", i18nKey: "diaryTypeRecovery", Icon: Heart, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/40" },
  { value: "mental", i18nKey: "diaryTypeMental", Icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/40" },
  { value: "injury", i18nKey: "diaryTypeInjury", Icon: Bandage, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/40" },
  { value: "running", i18nKey: "diaryTypeRunning", Icon: Footprints, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
];

export const typeMeta = (t: DiaryEntryType | null | undefined): TypeMeta =>
  ENTRY_TYPES.find((x) => x.value === (t || "general")) || ENTRY_TYPES[0];

export function computeTypeCounts<E extends DiaryEntryLike>(entries: E[]): Record<string, number> {
  const c: Record<string, number> = { all: entries.length };
  for (const e of entries) {
    const k = e.entry_type || "general";
    c[k] = (c[k] || 0) + 1;
  }
  return c;
}

export function computeAvailableTags<E extends DiaryEntryLike>(entries: E[]): string[] {
  const set = new Set<string>();
  for (const e of entries) for (const t of e.tags || []) set.add(t);
  return Array.from(set).sort();
}

export function filterEntries<E extends DiaryEntryLike>(
  entries: E[],
  opts: {
    typeFilter: DiaryEntryType | "all";
    tagFilter: string | null;
    dateRange: DateRange;
    search: string;
  },
): E[] {
  const now = new Date();
  const cutoff = opts.dateRange === "all" ? null : new Date(now.getTime() - parseInt(opts.dateRange) * 86400000);
  const q = opts.search.trim().toLowerCase();
  return entries.filter((e) => {
    if (opts.typeFilter !== "all" && (e.entry_type || "general") !== opts.typeFilter) return false;
    if (opts.tagFilter && !(e.tags || []).includes(opts.tagFilter)) return false;
    if (cutoff) {
      const d = new Date(e.entry_date + "T00:00:00");
      if (d < cutoff) return false;
    }
    if (q && !e.content.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function groupByMonth<E extends DiaryEntryLike>(entries: E[]): Array<[string, E[]]> {
  const map = new Map<string, E[]>();
  for (const e of entries) {
    const d = new Date(e.entry_date + "T00:00:00");
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const arr = map.get(key) || [];
    arr.push(e);
    map.set(key, arr);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
