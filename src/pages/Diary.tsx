import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Zap, ArrowLeft, Plus, Trash2, Edit2, Save, X, SmilePlus,
  Frown, Meh, Smile, Laugh, Battery, BatteryLow, BatteryMedium, BatteryFull,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DiaryEntry {
  id: string;
  entry_date: string;
  content: string;
  mood: number;
  energy: number;
  tags: string[];
  created_at: string;
}

const MOOD_ICONS = [Frown, Frown, Meh, Smile, Laugh];
const MOOD_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
const MOOD_COLORS = ["text-destructive", "text-orange-400", "text-yellow-400", "text-emerald-400", "text-emerald-500"];

const ENERGY_ICONS = [BatteryLow, BatteryLow, BatteryMedium, BatteryFull, BatteryFull];
const ENERGY_LABELS = ["Drained", "Low", "Moderate", "High", "Peak"];

const PRESET_TAGS = ["competition", "recovery", "technique", "sparring", "strength", "cardio", "flexibility", "mindset"];

export default function Diary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }

    const { data, error } = await supabase
      .from("diary_entries" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      setEntries((data as any) || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setContent("");
    setMood(3);
    setEnergy(3);
    setTags([]);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (entry: DiaryEntry) => {
    setDate(entry.entry_date);
    setContent(entry.content);
    setMood(entry.mood);
    setEnergy(entry.energy);
    setTags(entry.tags || []);
    setEditingId(entry.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: t("error"), description: t("diaryContentRequired" as any), variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      entry_date: date,
      content: content.trim().slice(0, 5000),
      mood,
      energy,
      tags,
    };

    if (editingId) {
      const { error } = await supabase.from("diary_entries" as any).update(payload as any).eq("id", editingId);
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
      toast({ title: t("diarySaved" as any) });
    } else {
      const { error } = await supabase.from("diary_entries" as any).insert(payload as any);
      if (error) { toast({ title: t("error"), description: error.message, variant: "destructive" }); return; }
      toast({ title: t("diarySaved" as any) });
    }

    resetForm();
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("diary_entries" as any).delete().eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("diaryDeleted" as any) });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const MoodIcon = MOOD_ICONS[mood - 1] || Meh;
  const EnergyIcon = ENERGY_ICONS[energy - 1] || BatteryMedium;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-energy flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-sm font-extrabold text-foreground">{t("diary" as any)}</h1>
          </div>
          {!showForm && (
            <Button size="sm" className="ml-auto" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t("diaryNewEntry" as any)}
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Entry form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-sm">
                {editingId ? t("diaryEditEntry" as any) : t("diaryNewEntry" as any)}
              </h2>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("diaryPlaceholder" as any)}
              rows={4}
              maxLength={5000}
              className="resize-none"
            />

            {/* Mood */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("diaryMood" as any)} — {MOOD_LABELS[mood - 1]}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const Icon = MOOD_ICONS[v - 1];
                  return (
                    <button
                      key={v}
                      onClick={() => setMood(v)}
                      className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        mood === v
                          ? `border-primary bg-primary/10 ${MOOD_COLORS[v - 1]}`
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("diaryEnergy" as any)} — {ENERGY_LABELS[energy - 1]}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const Icon = ENERGY_ICONS[v - 1];
                  return (
                    <button
                      key={v}
                      onClick={() => setEnergy(v)}
                      className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        energy === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("diaryTags" as any)}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors cursor-pointer ${
                      tags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-1" /> {t("save")}
            </Button>
          </div>
        )}

        {/* Entries list */}
        {entries.length === 0 && !showForm ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
            <SmilePlus className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">{t("diaryEmpty" as any)}</h3>
            <p className="text-sm text-muted-foreground">{t("diaryEmptyDesc" as any)}</p>
          </div>
        ) : (
          entries.map((entry) => {
            const EntryMood = MOOD_ICONS[(entry.mood || 3) - 1] || Meh;
            const EntryEnergy = ENERGY_ICONS[(entry.energy || 3) - 1] || BatteryMedium;
            return (
              <div key={entry.id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground">
                      {new Date(entry.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                        weekday: "short", day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span className={`${MOOD_COLORS[(entry.mood || 3) - 1]}`} title={MOOD_LABELS[(entry.mood || 3) - 1]}>
                      <EntryMood className="h-4 w-4" />
                    </span>
                    <span className="text-primary" title={ENERGY_LABELS[(entry.energy || 3) - 1]}>
                      <EntryEnergy className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
      <AppFooter />
    </div>
  );
}
