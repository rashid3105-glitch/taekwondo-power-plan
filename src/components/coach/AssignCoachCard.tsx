import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from "lucide-react";
import { useActiveClub } from "@/contexts/ActiveClubContext";

interface Coach {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  athleteId: string;
  onChanged?: () => void | Promise<void>;
}

export function AssignCoachCard({ athleteId, onChanged }: Props) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { activeClubId } = useActiveClub();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [currentCoachId, setCurrentCoachId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("reassign-athlete-coach", {
      body: { action: "list_coaches", athlete_id: athleteId, club_id: activeClubId },
    });
    if (error || (data as any)?.error) {
      setError((data as any)?.error || error?.message || "error");
    } else {
      setCoaches(((data as any).coaches as Coach[]) || []);
      setCurrentCoachId((data as any).current_coach_id ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId, activeClubId]);

  const handleChange = async (val: string) => {
    setSaving(true);
    const newCoachId = val === "none" ? null : val;
    const { data, error } = await supabase.functions.invoke("reassign-athlete-coach", {
      body: { action: "reassign", athlete_id: athleteId, coach_id: newCoachId, club_id: activeClubId },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({
        title: t("error"),
        description: (data as any)?.error || error?.message,
        variant: "destructive",
      });
      return;
    }
    setCurrentCoachId(newCoachId);
    toast({ title: t("athleteReassigned") });
    await onChanged?.();
  };

  if (error === "forbidden") return null;

  const currentCoach = coaches.find((c) => c.user_id === currentCoachId);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Users className="h-4 w-4" /> {t("assignToCoach")}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> …
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">{t("currentCoach")}:</span>{" "}
            {currentCoach?.display_name || t("noCoach")}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={currentCoachId || "none"}
              onValueChange={handleChange}
              disabled={saving}
            >
              <SelectTrigger className="h-9 text-sm flex-1">
                <SelectValue placeholder={t("selectCoach")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noCoach")}</SelectItem>
                {coaches.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.display_name || t("noName")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        </>
      )}
    </div>
  );
}
