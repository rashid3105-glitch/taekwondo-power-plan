import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";

interface DiaryComment {
  id: string;
  diary_entry_id: string;
  coach_id: string;
  content: string;
  created_at: string;
  coach_name?: string;
}

interface DiaryCommentsProps {
  entryId: string;
  /** If true, show comment input (coach mode) */
  canComment?: boolean;
}

export function DiaryComments({ entryId, canComment = false }: DiaryCommentsProps) {
  const [comments, setComments] = useState<DiaryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadComments();
  }, [entryId]);

  const loadComments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("diary_comments" as any)
      .select("*")
      .eq("diary_entry_id", entryId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Fetch coach names
      const coachIds = [...new Set((data as any[]).map((c: any) => c.coach_id))];
      let coachNames: Record<string, string> = {};
      if (coachIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", coachIds);
        if (profiles) {
          coachNames = Object.fromEntries(profiles.map((p: any) => [p.user_id, p.display_name]));
        }
      }

      setComments((data as any[]).map((c: any) => ({
        ...c,
        coach_name: coachNames[c.coach_id] || t("coach" as any),
      })));
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    const { error } = await supabase.from("diary_comments" as any).insert({
      diary_entry_id: entryId,
      coach_id: user.id,
      content: newComment.trim().slice(0, 2000),
    } as any);

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      await loadComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("diary_comments" as any).delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 py-1">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0 && !canComment) return null;

  return (
    <div className="space-y-2">
      {comments.length > 0 && (
        <div className="space-y-1.5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 rounded-md bg-accent/50 px-2.5 py-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-primary">{comment.coach_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString(undefined, {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                  {currentUserId === comment.coach_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("coachCommentPlaceholder" as any) || "Write a comment..."}
            rows={1}
            maxLength={2000}
            className="resize-none text-xs min-h-[36px] py-2"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={submitting || !newComment.trim()}
            className="shrink-0 h-9 w-9"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
