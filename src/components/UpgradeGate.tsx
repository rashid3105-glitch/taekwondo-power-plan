import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEntitlements } from "@/hooks/useEntitlements";
import { LockedModule } from "@/lib/entitlements";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  module: LockedModule;
  children: ReactNode;
}

export function UpgradeGate({ module, children }: Props) {
  const { isLocked, loading } = useEntitlements();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (loading) return null;
  if (!isLocked(module)) return <>{children}</>;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-primary/20 bg-card shadow-lg">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("moduleLockedTitle")}</h2>
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
