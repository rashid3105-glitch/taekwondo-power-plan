import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

export interface VideoNote {
  id: string;
  user_id: string;
  video_id: string;
  frame_number: number;
  /** Authoritative position. Older rows fall back to frame_number / 30. */
  timestamp_seconds: number;
  tags: string[];
  note_text: string | null;
  created_at: string;
}

/** Legacy rows were written assuming 30 fps. */
const LEGACY_FPS = 30;

const TAG_KEYS = [
  { key: "technique", labelKey: "videoNoteTagTechnique" },
  { key: "kick", labelKey: "videoNoteTagKick" },
  { key: "footwork", labelKey: "videoNoteTagFootwork" },
  { key: "balance", labelKey: "videoNoteTagBalance" },
  { key: "strength", labelKey: "videoNoteTagStrength" },
  { key: "defense", labelKey: "videoNoteTagDefense" },
] as const;

export function noteSeconds(row: { timestamp_seconds?: number | null; frame_number: number }): number {
  const ts = row.timestamp_seconds;
  return typeof ts === "number" && Number.isFinite(ts) ? ts : row.frame_number / LEGACY_FPS;
}

export function useVideoNotes(videoId: string) {
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [loadError, setLoadError] = useState(false);

  const reload = async () => {
    // Load all notes for this video (RLS controls visibility — athlete sees own,
    // coach sees notes on videos belonging to athletes in their club).
    const { data, error } = await (supabase.from as any)("video_notes")
      .select("*")
      .eq("video_id", videoId)
      .order("frame_number", { ascending: true });
    if (error) { setLoadError(true); return; }
    setLoadError(false);
    const rows = ((data ?? []) as any[]).map((r) => ({
      ...r,
      timestamp_seconds: noteSeconds(r),
    })) as VideoNote[];
    rows.sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
    setNotes(rows);
  };

  useEffect(() => { void reload(); }, [videoId]);

  return { notes, reload, setNotes, loadError };
}

// =====================================================
// Note panel — opened by + button
// =====================================================
export function NoteEditor({
  videoId, seconds, fps, onClose, onSaved,
}: {
  videoId: string;
  seconds: number;
  fps: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const frameNumber = Math.round(seconds * fps);

  const toggleTag = (k: string) =>
    setTags((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const save = async () => {
    if (!navigator.onLine) {
      toast({ title: t("matchOfflineNoConnection"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await (supabase.from as any)("video_notes").insert({
      user_id: user.id,
      video_id: videoId,
      frame_number: frameNumber,
      timestamp_seconds: Math.round(seconds * 1000) / 1000,
      tags,
      note_text: text.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className="rounded-lg border border-video-border bg-video-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-video-foreground">
          {t("videoNoteAtFrame").replace("{frame}", String(frameNumber))}
        </div>
        <button onClick={onClose} className="text-video-muted hover:text-video-foreground h-9 w-9 flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TAG_KEYS.map(({ key, labelKey }) => {
          const active = tags.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleTag(key)}
              className={`px-3 h-9 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-video-accent text-video-accent-foreground border-video-accent"
                  : "bg-video-surface text-video-foreground border-video-border hover:bg-video-card"
              }`}
            >
              {t(labelKey as any)}
            </button>
          );
        })}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("videoNotePlaceholder")}
        className="bg-video-input border-video-border text-video-input-foreground placeholder:text-video-muted min-h-[80px]"
      />

      <Button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full h-11 bg-video-accent text-video-accent-foreground hover:brightness-95"
      >
        {t("videoNoteSave")}
      </Button>
    </div>
  );
}

// =====================================================
// Notes list with filter pills
// =====================================================
export function NotesList({
  notes, fps, onJump, onDeleted,
}: {
  notes: VideoNote[];
  fps: number;
  onJump: (seconds: number) => void;
  onDeleted: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? notes.filter((n) => n.tags?.includes(filter)) : notes;

  const del = async (id: string) => {
    const { error } = await (supabase.from as any)("video_notes").delete().eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    onDeleted();
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill active={filter === null} onClick={() => setFilter(null)} label={t("videoNoteAll")} />
        {TAG_KEYS.map(({ key, labelKey }) => (
          <FilterPill
            key={key}
            active={filter === key}
            onClick={() => setFilter(filter === key ? null : key)}
            label={t(labelKey as any)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-4 text-center">
          {t("videoNoteEmpty")}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <div
              key={n.id}
              className="rounded-lg border border-border bg-card p-3 cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onJump(n.timestamp_seconds)}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 h-5 rounded text-[10px] font-mono font-bold inline-flex items-center bg-video-accent text-video-accent-foreground">
                    F{Math.round(n.timestamp_seconds * fps)}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">{fmtTime(n.timestamp_seconds)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void del(n.id); }}
                  className="text-muted-foreground hover:text-destructive h-9 w-9 flex items-center justify-center"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {n.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {n.tags.map((tg) => {
                    const def = TAG_KEYS.find((x) => x.key === tg);
                    return (
                      <span
                        key={tg}
                        className="px-2 h-5 rounded-full text-[10px] font-medium inline-flex items-center bg-video-accent/20 text-video-foreground border border-video-accent/30"
                      >
                        {def ? t(def.labelKey as any) : tg}
                      </span>
                    );
                  })}
                </div>
              )}
              {n.note_text && (
                <div className="text-xs text-card-foreground whitespace-pre-wrap break-words">{n.note_text}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-9 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? "bg-video-accent text-video-accent-foreground border-video-accent"
          : "bg-video-surface text-video-foreground border-video-border hover:bg-video-card"
      }`}
    >
      {label}
    </button>
  );
}
