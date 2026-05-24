import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppFooter } from "@/components/AppFooter";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Zap, ArrowLeft, Plus, Trash2, Edit2, Save, X, SmilePlus,
  Frown, Meh, Smile, Laugh, BatteryLow, BatteryMedium, BatteryFull,
  Search, ChevronDown, ChevronRight, Filter, Mic, MicOff, Footprints,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Watermark } from "@/components/Watermark";
import { DiaryComments } from "@/components/DiaryComments";
import { useOfflineDiary } from "@/hooks/useOfflineDiary";
import type { CachedDiaryEntry, DiaryEntryType } from "@/lib/diaryOfflineDB";
import {
  ENTRY_TYPES, typeMeta, computeTypeCounts, computeAvailableTags,
  filterEntries, groupByMonth, currentMonthKey,
  type DateRange, type ViewMode,
} from "@/lib/diaryFilters";

type DiaryEntry = CachedDiaryEntry;

const MOOD_ICONS = [Frown, Frown, Meh, Smile, Laugh];
const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
const MOOD_COLORS = ["text-destructive", "text-orange-400", "text-yellow-400", "text-emerald-400", "text-emerald-500"];

const ENERGY_ICONS = [BatteryLow, BatteryLow, BatteryMedium, BatteryFull, BatteryFull];
const ENERGY_LABELS = ["Drained", "Low", "Moderate", "High", "Peak"];

const PRESET_TAGS = ["competition", "recovery", "technique", "sparring", "strength", "cardio", "flexibility", "mindset"];

// Pure pace formatter: seconds/km -> "m:ss"
function formatPace(secondsPerKm: number): string {
  const m = Math.floor(secondsPerKm / 60);
  const s = secondsPerKm % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// MET-based calorie estimator
function calcCalories(distKm: number, durationSec: number, weightKg: number): number {
  if (distKm <= 0 || durationSec <= 0) return 0;
  const speedKmh = distKm / (durationSec / 3600);
  let met = 8;
  if (speedKmh < 7) met = 7;
  else if (speedKmh < 9) met = 8;
  else if (speedKmh < 11) met = 10;
  else if (speedKmh < 13) met = 11.5;
  else met = 13.5;
  return Math.round(met * weightKg * (durationSec / 3600));
}

function calcPace(distKm: number, durationSec: number): number {
  if (distKm <= 0) return 0;
  return Math.round(durationSec / distKm);
}

export default function Diary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const { entries, loading, createEntry, updateEntry, removeEntry } = useOfflineDiary();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [entryType, setEntryType] = useState<DiaryEntryType>("general");

  // Running entry state
  const [runDistanceKm, setRunDistanceKm] = useState<string>("");
  const [runDurationMin, setRunDurationMin] = useState<string>("");
  const [runDurationSec, setRunDurationSec] = useState<string>("");
  const [athleteWeight, setAthleteWeight] = useState<number>(70);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DiaryEntryType | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => (localStorage.getItem("diary-range") as DateRange) || "30");
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem("diary-view") as ViewMode) || "compact");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  useEffect(() => { localStorage.setItem("diary-view", viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem("diary-range", dateRange); }, [dateRange]);

  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t("diaryRecordNotSupported"), variant: "destructive" });
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "da-DK";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setContent((prev) => (prev ? prev + " " + transcript : transcript).trim());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("weight_kg")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((data as any)?.weight_kg) setAthleteWeight(Number((data as any).weight_kg));
    })();
  }, [navigate]);

  // Derived running calcs
  const runDistNum = parseFloat(runDistanceKm) || 0;
  const runTotalSec = (parseInt(runDurationMin) || 0) * 60 + (parseInt(runDurationSec) || 0);
  const runPace = runDistNum > 0 && runTotalSec > 0 ? calcPace(runDistNum, runTotalSec) : 0;
  const runCalories = runDistNum > 0 && runTotalSec > 0 ? calcCalories(runDistNum, runTotalSec, athleteWeight) : 0;

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setContent("");
    setMood(3);
    setEnergy(3);
    setTags([]);
    setEntryType("general");
    setRunDistanceKm("");
    setRunDurationMin("");
    setRunDurationSec("");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (entry: DiaryEntry) => {
    setDate(entry.entry_date);
    setContent(entry.content);
    setMood(entry.mood);
    setEnergy(entry.energy);
    setTags(entry.tags || []);
    setEntryType(entry.entry_type || "general");
    if (entry.entry_type === "running") {
      setRunDistanceKm(entry.run_distance_km?.toString() ?? "");
      const dur = entry.run_duration_seconds ?? 0;
      setRunDurationMin(Math.floor(dur / 60).toString());
      setRunDurationSec((dur % 60).toString());
    } else {
      setRunDistanceKm("");
      setRunDurationMin("");
      setRunDurationSec("");
    }
    setEditingId(entry.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: t("error"), description: t("diaryContentRequired"), variant: "destructive" });
      return;
    }
    const payload = {
      entry_date: date,
      content: content.trim().slice(0, 5000),
      mood,
      energy,
      tags,
      entry_type: entryType,
      run_distance_km: entryType === "running" && runDistNum > 0 ? runDistNum : null,
      run_duration_seconds: entryType === "running" && runTotalSec > 0 ? runTotalSec : null,
      run_pace_seconds_per_km: entryType === "running" && runPace > 0 ? runPace : null,
      run_calories: entryType === "running" && runCalories > 0 ? runCalories : null,
    };
    try {
      if (editingId) await updateEntry(editingId, payload);
      else await createEntry(payload);
      toast({ title: t("diarySaved") });
      resetForm();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeEntry(deleteConfirmId);
      toast({ title: t("diaryDeleted") });
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  // ----- Derived: counts, available tags, filtered+grouped entries -----

  const typeCounts = useMemo(() => computeTypeCounts(entries), [entries]);
  const availableTags = useMemo(() => computeAvailableTags(entries), [entries]);
  const filtered = useMemo(
    () => filterEntries(entries, { typeFilter, tagFilter, dateRange, search }),
    [entries, typeFilter, tagFilter, dateRange, search],
  );
  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);
  const monthKeyToday = useMemo(() => currentMonthKey(), []);

  useEffect(() => {
    if (autoCollapsed || grouped.length === 0) return;
    const initial = new Set(
      grouped
        .map(([key]) => key)
        .filter((key) => key !== monthKeyToday)
    );
    setCollapsedMonths(initial);
    setAutoCollapsed(true);
  }, [grouped, autoCollapsed, monthKeyToday]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative">
        <Watermark />
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
          <div className="container max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
          </div>
        </header>
        <main className="container max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  const TypeIcon = typeMeta(entryType).Icon;

  return (
    <div className="min-h-screen bg-background relative">
      <Watermark />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-sm font-extrabold text-foreground truncate">{t("diary")}</h1>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-xs"
              onClick={() => setViewMode((v) => v === "compact" ? "detailed" : "compact")}
              title={viewMode === "compact" ? t("diaryViewDetailed") : t("diaryViewCompact")}
            >
              {viewMode === "compact" ? t("diaryViewCompact") : t("diaryViewDetailed")}
            </Button>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-1" /> {t("diaryNewEntry")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Entry form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-sm">
                {editingId ? t("diaryEditEntry") : t("diaryNewEntry")}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Entry type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("diaryTypeLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_TYPES.map((meta) => {
                  const Icon = meta.Icon;
                  const active = entryType === meta.value;
                  return (
                    <button
                      key={meta.value}
                      onClick={() => setEntryType(meta.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 h-9 text-xs font-semibold border transition-colors cursor-pointer ${
                        active ? `${meta.bg} ${meta.border} ${meta.color}` : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t(meta.i18nKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto h-11" />

            {entryType === "running" && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-2">
                  <Footprints className="h-3.5 w-3.5" /> {t("runDetails")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t("runDistance")}</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.1"
                      value={runDistanceKm}
                      onChange={(e) => setRunDistanceKm(e.target.value)}
                      placeholder="5.0"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">{t("runDuration")}</label>
                    <div className="flex gap-1 items-center">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="300"
                        value={runDurationMin}
                        onChange={(e) => setRunDurationMin(e.target.value)}
                        placeholder="25"
                        className="h-10 w-16 text-center"
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="59"
                        value={runDurationSec}
                        onChange={(e) => setRunDurationSec(e.target.value)}
                        placeholder="00"
                        className="h-10 w-14 text-center"
                      />
                      <span className="text-xs text-muted-foreground">sek</span>
                    </div>
                  </div>
                </div>
                {runPace > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded-lg bg-card border border-border p-2.5 text-center">
                      <div className="text-lg font-bold text-foreground">{formatPace(runPace)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runPace")}</div>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-2.5 text-center">
                      <div className="text-lg font-bold text-foreground">{runDistNum.toFixed(1)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runDistanceKm")}</div>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-2.5 text-center">
                      <div className="text-lg font-bold text-emerald-500">{runCalories}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("runCalories")}</div>
                    </div>
                  </div>
                )}
                {athleteWeight === 70 && (
                  <p className="text-[10px] text-muted-foreground italic">{t("runCaloriesNote")}</p>
                )}
              </div>
            )}

            <div className="relative">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("diaryPlaceholder")}
                rows={4}
                maxLength={5000}
                className="resize-none pr-12"
              />
              <button
                type="button"
                onClick={toggleRecording}
                className={cn(
                  "absolute bottom-2 right-2 h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                  recording
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={recording ? t("diaryRecording") : t("diaryRecordNote")}
              >
                {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("diaryMood")} — {MOOD_LABELS[mood - 1]}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const Icon = MOOD_ICONS[v - 1];
                  return (
                    <button
                      key={v}
                      onClick={() => setMood(v)}
                      className={`h-11 w-11 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        mood === v ? `border-primary bg-primary/10 ${MOOD_COLORS[v - 1]}` : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("diaryEnergy")} — {ENERGY_LABELS[energy - 1]}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const Icon = ENERGY_ICONS[v - 1];
                  return (
                    <button
                      key={v}
                      onClick={() => setEnergy(v)}
                      className={`h-11 w-11 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        energy === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("diaryTags")}</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                      tags.includes(tag) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto h-11">
              <Save className="h-4 w-4 mr-1" /> {t("save")}
            </Button>
          </div>
        )}

        {/* Filter bar */}
        {entries.length > 0 && !showForm && (
          <div className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("diarySearchPlaceholder")}
                className="pl-9 h-11"
              />
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
                    {t(meta.i18nKey)} ({count})
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
                  {r === "all" ? t("diaryRangeAll") : t(`diaryRange${r}`)}
                </button>
              ))}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] ml-auto" onClick={clearFilters}>
                  {t("diaryClearFilters")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Entries */}
        {entries.length === 0 && !showForm ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <SmilePlus className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">{t("diaryEmpty")}</h3>
            <p className="text-sm text-muted-foreground">{t("diaryEmptyDesc")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">{t("diaryNoMatches")}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
              {t("diaryClearFilters")}
            </Button>
          </div>
        ) : (
          grouped.map(([monthKey, items]) => {
            const isCollapsed = collapsedMonths.has(monthKey);
            const [yearStr, monthStr] = monthKey.split("-");
            const monthDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
            const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
            return (
              <div key={monthKey} className="space-y-2">
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full flex items-center justify-between px-1 py-1 text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {monthLabel} ({items.length})
                  </span>
                </button>
                {!isCollapsed && items.map((entry) => {
                  const meta = typeMeta(entry.entry_type || "general");
                  const Icon = meta.Icon;
                  const EntryMood = MOOD_ICONS[(entry.mood || 3) - 1] || Meh;
                  const EntryEnergy = ENERGY_ICONS[(entry.energy || 3) - 1] || BatteryMedium;
                  const isExpanded = viewMode === "detailed" || expandedIds.has(entry.id);
                  const dateStr = new Date(entry.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short", day: "numeric", month: "short",
                  });

                  if (!isExpanded) {
                    // Compact row
                    return (
                      <button
                        key={entry.id}
                        onClick={() => toggleExpand(entry.id)}
                        className={`w-full text-left rounded-xl border ${meta.border} bg-card hover:bg-muted/30 p-3 shadow-card transition-colors`}
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
                              {entry.pending && (
                                <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-500 px-1 py-0">
                                  {t("workoutLogPending")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground line-clamp-1 mt-0.5">{entry.content}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </button>
                    );
                  }

                  return (
                    <div key={entry.id} className={`rounded-xl border ${meta.border} bg-card p-4 sm:p-5 shadow-card space-y-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.color}`}>
                            <Icon className="h-3 w-3" />
                            {t(meta.i18nKey)}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">
                            {new Date(entry.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                              weekday: "short", day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          <span className={MOOD_COLORS[(entry.mood || 3) - 1]} title={MOOD_LABELS[(entry.mood || 3) - 1]}>
                            <EntryMood className="h-4 w-4" />
                          </span>
                          <span className="text-primary" title={ENERGY_LABELS[(entry.energy || 3) - 1]}>
                            <EntryEnergy className="h-4 w-4" />
                          </span>
                          {entry.pending && (
                            <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-500">
                              {t("workoutLogPending")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {viewMode === "compact" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(entry.id)}>
                              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirmId(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      <DiaryComments entryId={entry.id} />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </main>
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("diaryDeleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("diaryDeleteConfirmDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AppFooter />
    </div>
  );
}
