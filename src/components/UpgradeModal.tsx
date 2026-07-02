import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { isNativeApp } from "@/lib/platform";

export type UpgradeReason = "module-locked" | "plan-limit" | "athlete-limit" | "subscription-required";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reason?: UpgradeReason;
}

export function UpgradeModal({ open, onOpenChange, reason = "subscription-required" }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const native = isNativeApp();

  const titleKey =
    reason === "plan-limit" ? "planLimitReached" :
    reason === "athlete-limit" ? "athleteLimitReached" :
    reason === "module-locked" ? "moduleLocked" :
    "subscriptionRequired";

  // Native builds must not surface purchase/upgrade CTAs or link to pricing.
  if (native) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <DialogTitle className="text-center">{t("nativePlanManagedTitle")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("nativeFeatureUnavailable")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{t(titleKey as any)}</DialogTitle>
          <DialogDescription className="text-center">
            {t("upgradeModalDescription" as any)}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={() => { onOpenChange(false); navigate("/pricing"); }}>
            {t("seePlans" as any)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
