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
  tags: string[];
  note_text: string | null;
  created_at: string;
}

const ACCENT = "#F5A623";
const FPS = 30;

const TAG_KEYS = [
  { key: "technique", labelKey: "videoNoteTagTechnique" },
  { key: "kick", labelKey: "videoNoteTagKick" },
  { key: "footwork", labelKey: "videoNoteTagFootwork" },
  { key: "balance", labelKey: "videoNoteTagBalance" },
  { key: "strength", labelKey: "videoNoteTagStrength" },
  { key: "defense", labelKey: "videoNoteTagDefense" },
] as const;

export function useVideoNotes(videoId: string) {
  const [notes, setNotes] = useState<VideoNote[]>([]);

  const reload = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase.from as any)("video_notes")
      .select("*")
      .eq("video_id", videoId)
      .eq("user_id", user.id)
      .order("frame_number", { ascending: true });
    setNotes((data ?? []) as VideoNote[]);
  };

  useEffect(() => { void reload(); }, [videoId]);

  return { notes, reload, setNotes };
}

// =====================================================
// Note panel — opened by + button
// =====================================================
export function NoteEditor({
  videoId, frameNumber, onClose, onSaved,
}: {
  videoId: string;
  frameNumber: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleTag = (k: string) =>
    setTags((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const { error } = await (supabase.from as any)("video_notes").insert({
      user_id: user.id,
      video_id: videoId,
      frame_number: frameNumber,
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
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">
          {t("videoNoteAtFrame").replace("{frame}", String(frameNumber))}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
              className="px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors"
              style={{
                background: active ? ACCENT : "transparent",
                color: active ? "#000" : "hsl(var(--foreground))",
                borderColor: active ? ACCENT : "hsl(var(--border))",
              }}
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
        className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[80px]"
      />

      <Button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full text-black"
        style={{ background: ACCENT }}
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
  notes, onJump, onDeleted,
}: {
  notes: VideoNote[];
  onJump: (frame: number) => void;
  onDeleted: () => void;
}) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? notes.filter((n) => n.tags?.includes(filter)) : notes;

  const del = async (id: string) => {
    await (supabase.from as any)("video_notes").delete().eq("id", id);
    onDeleted();
  };

  const fmtTime = (frame: number) => {
    const s = frame / FPS;
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
              onClick={() => onJump(n.frame_number)}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 h-5 rounded text-[10px] font-mono font-bold inline-flex items-center text-black"
                    style={{ background: ACCENT }}
                  >
                    F{n.frame_number}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">{fmtTime(n.frame_number)}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void del(n.id); }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {n.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {n.tags.map((tg) => {
                    const def = TAG_KEYS.find((x) => x.key === tg);
                    return (
                      <span
                        key={tg}
                        className="px-2 h-5 rounded-full text-[10px] inline-flex items-center"
                        style={{ background: `${ACCENT}22`, color: "#8a5a00" }}
                      >
                        {def ? t(def.labelKey as any) : tg}
                      </span>
                    );
                  })}
                </div>
              )}
              {n.note_text && (
                <div className="text-xs text-foreground whitespace-pre-wrap break-words">{n.note_text}</div>
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
      className="px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors"
      style={{
        background: active ? ACCENT : "transparent",
        color: active ? "#000" : "hsl(var(--foreground))",
        borderColor: active ? ACCENT : "hsl(var(--border))",
      }}
    >
      {label}
    </button>
  );
}

// =====================================================
// Overlay markers on the video element (numbered circles)
// =====================================================
export function NoteOverlayMarkers({
  notes, totalFrames, onJump,
}: {
  notes: VideoNote[];
  totalFrames: number;
  onJump: (frame: number) => void;
}) {
  if (!totalFrames || totalFrames <= 0) return null;
  return (
    <>
      {notes.map((n, idx) => {
        const left = Math.min(100, Math.max(0, (n.frame_number / totalFrames) * 100));
        return (
          <button
            key={n.id}
            type="button"
            onClick={(e) => { e.stopPropagation(); onJump(n.frame_number); }}
            className="absolute top-2 -translate-x-1/2 h-6 w-6 rounded-full text-[10px] font-bold text-black flex items-center justify-center shadow-md pointer-events-auto"
            style={{ left: `${left}%`, background: ACCENT }}
            title={`F${n.frame_number}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </>
  );
}
