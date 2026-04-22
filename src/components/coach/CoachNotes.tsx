import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, NotebookPen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  athleteId: string;
}

export function CoachNotes({ athleteId }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCoachId(user.id);
      const { data } = await supabase
        .from("coach_athlete_notes" as any)
        .select("content")
        .eq("coach_id", user.id)
        .eq("athlete_id", athleteId)
        .maybeSingle();
      setContent(((data as any)?.content as string) || "");
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
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <NotebookPen className="h-4 w-4" /> {t("privateCoachNotes")}
        </h4>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground">{t("privateCoachNotesDesc")}</p>
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
    </div>
  );
}
