import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, NotebookPen, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useActiveClub } from "@/contexts/ActiveClubContext";

interface Props {
  athleteId: string;
}

interface SharedNote {
  id: string;
  coach_id: string;
  content: string;
  updated_at: string;
  coach_name: string;
}

export function CoachNotes({ athleteId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCoachId(user.id);

      // 1. Own note
      const { data: own } = await supabase
        .from("coach_athlete_notes" as any)
        .select("content")
        .eq("coach_id", user.id)
        .eq("athlete_id", athleteId)
        .maybeSingle();
      setContent(((own as any)?.content as string) || "");

      // 2. Check if this coach's club has sharing enabled
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("club_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const myClubId = (myProfile as any)?.club_id as string | null;

      if (myClubId) {
        const { data: club } = await supabase
          .from("clubs" as any)
          .select("share_coach_notes")
          .eq("id", myClubId)
          .maybeSingle();
        const enabled = !!(club as any)?.share_coach_notes;
        setSharingEnabled(enabled);

        if (enabled) {
          // RLS will filter to only readable rows (other club coaches, same club).
          const { data: others } = await supabase
            .from("coach_athlete_notes" as any)
            .select("id, coach_id, content, updated_at")
            .eq("athlete_id", athleteId)
            .neq("coach_id", user.id);

          const rows = ((others as any[]) ?? []).filter(r => (r.content || "").trim().length > 0);
          if (rows.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("user_id, display_name")
              .in("user_id", rows.map(r => r.coach_id));
            const nameMap = new Map(((profs as any[]) ?? []).map(p => [p.user_id, p.display_name]));
            setSharedNotes(rows.map(r => ({
              id: r.id,
              coach_id: r.coach_id,
              content: r.content,
              updated_at: r.updated_at,
              coach_name: nameMap.get(r.coach_id) || "Coach",
            })));
          }
        }
      }

      setLoading(false);
    })();
  }, [athleteId]);

  const save = async () => {
    if (!coachId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("coach_athlete_notes" as any)
        .upsert(
          { coach_id: coachId, athlete_id: athleteId, content: content.slice(0, 5000) },
          { onConflict: "coach_id,athlete_id" },
        );
      if (error) throw error;
      toast({ title: t("notesSaved") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <NotebookPen className="h-4 w-4" /> {t("privateCoachNotes")}
        </h4>
        <div className="flex items-center gap-2">
          {sharingEnabled && (
            <span className="text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 flex items-center gap-1">
              <Users className="h-3 w-3" /> {t("sharedInClub")}
            </span>
          )}
          {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {sharingEnabled ? t("shareCoachNotesHint") : t("privateCoachNotesDesc")}
      </p>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={save}
          placeholder={t("privateCoachNotesPlaceholder")}
          rows={4}
          maxLength={5000}
          className="text-sm"
        />
      )}

      {sharingEnabled && !loading && (
        <div className="pt-3 border-t border-border space-y-2">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {t("notesByOtherCoaches")}
          </div>
          {sharedNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{t("noOtherCoachNotes")}</p>
          ) : (
            <div className="space-y-2">
              {sharedNotes.map(n => (
                <div key={n.id} className="rounded-lg border border-border bg-background/50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{n.coach_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(n.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
