import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEntitlements, useAthleteModuleAccess } from "@/hooks/useEntitlements";
import { LockedModule } from "@/lib/entitlements";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useClubTrial } from "@/hooks/useClubTrial";

interface Props {
  module: LockedModule;
  children: ReactNode;
}

// Map LockedModule -> athlete_modules module-keys that grant access
const COACH_MODULE_KEYS: Record<LockedModule, string[]> = {
  rehab: ["rehab"],
  testing: ["testing"],
  match_analysis: ["video"],
  competitions: ["compete"],
  season_plan: ["plan"],
  library: ["plan", "library"],
};

export function UpgradeGate({ module, children }: Props) {
  const { isLocked, loading } = useEntitlements();
  const { isModuleEnabled, loading: moduleAccessLoading } = useAthleteModuleAccess();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [coachGranted, setCoachGranted] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setCoachGranted(false); return; }
        const keys = COACH_MODULE_KEYS[module] ?? [];
        if (keys.length === 0) { setCoachGranted(false); return; }
        const { data } = await supabase
          .from("athlete_modules" as any)
          .select("module_key, enabled")
          .eq("athlete_id", user.id)
          .eq("enabled", true)
          .in("module_key", keys);
        setCoachGranted(!!data && (data as any[]).length > 0);
      } catch {
        setCoachGranted(false);
      }
    })();
  }, [module]);

  if (loading || moduleAccessLoading || coachGranted === null) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Club-level grant: if the module is enabled via club_module_defaults or
  // athlete_module_overrides, the athlete has access regardless of personal tier.
  const clubGranted = (COACH_MODULE_KEYS[module] ?? []).some((k) => isModuleEnabled(k));

  if (coachGranted || clubGranted || !isLocked(module)) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-primary/20 bg-card shadow-lg">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground">{t("moduleLockedTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("moduleLockedDesc")}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate("/pricing")} className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("upgradeToUnlock")}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/dashboard")} className="w-full">
              {t("backToDashboard")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
