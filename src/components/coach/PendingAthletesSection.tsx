import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Clock } from "lucide-react";

interface PendingAthlete {
  user_id: string;
  display_name: string;
  pending_invite_code: string | null;
  updated_at: string;
}

export function PendingAthletesSection({ coachId, refreshKey }: { coachId: string; refreshKey?: number }) {
  const { t } = useLanguage();
  const [pending, setPending] = useState<PendingAthlete[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, pending_invite_code, updated_at")
        .eq("pending_coach_id", coachId)
        .eq("is_approved", false);
      setPending((data as any) || []);
    })();
  }, [coachId, refreshKey]);

  if (pending.length === 0) return null;

  const daysAgo = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

  return (
    <div className="space-y-2 pb-4 border-b border-border">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Clock className="h-4 w-4" /> {t("pendingApprovalSection")} ({pending.length})
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {pending.map((p) => (
          <div key={p.user_id} className="rounded-lg border border-border/50 bg-muted/30 p-3 opacity-70">
            <p className="font-medium text-sm text-foreground">{p.display_name || t("noName")}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("requestedDaysAgo").replace("{days}", String(daysAgo(p.updated_at)))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
