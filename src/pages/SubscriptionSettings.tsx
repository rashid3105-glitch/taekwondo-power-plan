import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Settings, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PageMeta } from "@/components/PageMeta";
import { isNativeApp } from "@/lib/platform";

export default function SubscriptionSettings() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { subscription, tier, currentPeriodEnd, cancelAtPeriodEnd, refresh } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("check-subscription").then(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setPortalLoading(false); }
  };

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error) throw error;
      toast({ title: t("subscriptionCancelled" as any), description: data?.current_period_end ? new Date(data.current_period_end).toLocaleDateString(locale) : "" });
      await refresh();
    } catch (e: any) {
      toast({ title: t("error"), description: e.message, variant: "destructive" });
    } finally { setCancelLoading(false); setConfirmOpen(false); }
  };

  const periodEndStr = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString(locale) : "—";
  const status = subscription?.status ?? "inactive";

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <PageMeta title="Subscription" description="Manage your subscription" />
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {t("back" as any)}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t("manageSubscription")}</CardTitle>
            <CardDescription>{t("subscriptionSettingsDesc" as any)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">{t("currentPlan" as any)}</span>
              <Badge variant="secondary">{tier}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">{t("status" as any)}</span>
              <Badge variant={status === "active" ? "default" : "outline"}>{status}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">
                {cancelAtPeriodEnd ? t("activeUntil" as any) : t("renewsOn" as any)}
              </span>
              <span className="text-sm font-medium">{periodEndStr}</span>
            </div>

            {cancelAtPeriodEnd && (
              <div className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">
                {t("cancellationScheduled" as any)} {periodEndStr}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button onClick={handlePortal} disabled={portalLoading || !subscription?.stripe_customer_id}>
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
            {t("manageSubscription")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/pricing")}>
            {t("changePlan" as any)}
          </Button>
          {status === "active" && !cancelAtPeriodEnd && (
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmOpen(true)}>
              {t("cancelSubscription" as any)}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirmTitle" as any)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirmBody" as any).replace("{date}", periodEndStr)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelLoading}>
              {cancelLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("confirmCancel" as any)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
