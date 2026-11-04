import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dumbbell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildStrengthTemplatePlan, type Locale, type TemplateWeeks } from "@/lib/strengthTemplate";

interface Props {
  athleteUserId: string;
  clubId?: string | null;
  athleteName?: string;
  onAssigned?: () => void | Promise<void>;
}

export function StrengthTemplateAssign({ athleteUserId, clubId, athleteName, onAssigned }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [weeks, setWeeks] = useState<TemplateWeeks>(6);
  const [saving, setSaving] = useState(false);

  const assign = async () => {
    setSaving(true);
    try {
      const plan = buildStrengthTemplatePlan(weeks, locale as Locale);
      await supabase.from("training_plans").update({ is_active: false }).eq("user_id", athleteUserId);
      const { error } = await supabase.from("training_plans").insert({
        user_id: athleteUserId,
        name: plan.planName,
        plan_data: plan as any,
        is_active: true,
        ...(clubId ? { club_id: clubId } : {}),
      } as any);
      if (error) throw error;
      toast({ title: t("strTplAssigned"), description: athleteName });
      await onAssigned?.();
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-start gap-2">
        <Dumbbell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-foreground">{t("strTplTitle")}</p>
          <p className="text-xs text-muted-foreground">{t("strTplDesc")}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{t("strTplWeeks")}</span>
        {([4, 5, 6] as TemplateWeeks[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWeeks(w)}
            className={cn(
              "h-11 min-w-11 px-3 rounded-md border text-sm font-semibold",
              weeks === w ? "border-primary bg-primary/15 text-primary" : "border-border text-foreground",
            )}
          >
            {w}
          </button>
        ))}
        <Button onClick={assign} disabled={saving} size="sm" className="ml-auto h-11">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("strTplAssign")}
        </Button>
      </div>
    </div>
  );
}
