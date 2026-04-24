import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, AlertTriangle, Flame, RotateCcw, MessageSquare, X, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertFeedback, deleteFeedback, type ExerciseFeedback } from "@/hooks/useExerciseFeedback";
import { useToast } from "@/hooks/use-toast";
import { haptics } from "@/lib/haptics";

const REACTIONS = [
  { value: "thumbs_up", icon: ThumbsUp, label: "Good", className: "bg-primary/15 text-primary border-primary/30" },
  { value: "fire", icon: Flame, label: "Fire", className: "bg-explosive/15 text-explosive border-explosive/30" },
  { value: "check_form", icon: AlertTriangle, label: "Check form", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { value: "redo", icon: RotateCcw, label: "Redo", className: "bg-destructive/15 text-destructive border-destructive/30" },
] as const;

interface Props {
  workoutLogId: string;
  athleteId: string;
  existing?: ExerciseFeedback;
  onSaved: () => void;
}

/** Coach-side editor for a single exercise's feedback */
export function ExerciseFeedbackPanel({ workoutLogId, athleteId, existing, onSaved }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reaction, setReaction] = useState<string>(existing?.reaction ?? "none");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (reaction === "none" && !comment.trim()) {
      toast({ title: "Add a reaction or comment first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await upsertFeedback({ id: existing?.id, workout_log_id: workoutLogId, athlete_id: athleteId, comment: comment.trim(), reaction });
      haptics.success();
      onSaved();
      setOpen(false);
      toast({ title: existing ? "Feedback updated" : "Feedback sent" });
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!existing) return;
    if (!confirm("Delete feedback?")) return;
    await deleteFeedback(existing.id);
    onSaved();
    setOpen(false);
  }

  if (!open) {
    const reactionItem = REACTIONS.find((r) => r.value === existing?.reaction);
    return (
      <button
        onClick={() => { haptics.tap(); setOpen(true); }}
        className={cn(
          "w-full flex items-center gap-2 rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary/40 transition",
          existing && "border-solid border-primary/30 bg-primary/5 text-foreground"
        )}
      >
        <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
        {existing ? (
          <span className="flex-1 text-left flex items-center gap-1.5 min-w-0">
            {reactionItem && <reactionItem.icon className="h-3 w-3 flex-shrink-0" />}
            <span className="truncate">{existing.comment || reactionItem?.label || "Edit feedback"}</span>
          </span>
        ) : (
          <span className="flex-1 text-left">Leave feedback</span>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Coach feedback</span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {REACTIONS.map((r) => {
          const active = reaction === r.value;
          return (
            <button
              key={r.value}
              onClick={() => { haptics.tap(); setReaction(active ? "none" : r.value); }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold transition",
                active ? r.className : "border-border bg-background text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <r.icon className="h-3 w-3" />
              {r.label}
            </button>
          );
        })}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 280))}
        placeholder="Short note for the athlete (optional)…"
        rows={2}
        className="text-sm resize-none"
        maxLength={280}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{comment.length}/280</span>
        <div className="flex items-center gap-1.5">
          {existing && (
            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={remove}>
              Delete
            </Button>
          )}
          <Button size="sm" className="h-7 text-xs" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Athlete-side read-only display for a single exercise's feedback list */
export function ExerciseFeedbackView({ feedback, onMarkRead }: { feedback: ExerciseFeedback[]; onMarkRead?: (id: string) => void }) {
  if (feedback.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {feedback.map((f) => {
        const r = REACTIONS.find((x) => x.value === f.reaction);
        return (
          <div
            key={f.id}
            onClick={() => !f.is_read && onMarkRead?.(f.id)}
            className={cn(
              "rounded-md border p-2 text-xs cursor-pointer transition",
              f.is_read ? "border-border bg-secondary/40" : "border-primary/40 bg-primary/10 shadow-sm"
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              {r && (
                <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] gap-1", r.className)}>
                  <r.icon className="h-3 w-3" />
                  {r.label}
                </Badge>
              )}
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Coach</span>
              {!f.is_read && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
            {f.comment && <p className="text-foreground">{f.comment}</p>}
          </div>
        );
      })}
    </div>
  );
}
