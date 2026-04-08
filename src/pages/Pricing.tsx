import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Building2, Check, Mail, ArrowLeft, FlaskConical, Loader2, Settings } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const tiers = [
  {
    key: "personal" as const,
    icon: Zap,
    monthlyPriceKey: "pricingPersonalPrice" as const,
    yearlyPriceKey: "pricingPersonalYearlyPrice" as const,
    features: ["pricingFeatureAiPlans", "pricingFeatureProgress", "pricingFeatureMental", "pricingFeatureRehab", "pricingFeatureLibrary"] as const,
  },
  {
    key: "coach" as const,
    icon: Users,
    monthlyPriceKey: "pricingCoachPrice" as const,
    yearlyPriceKey: "pricingCoachYearlyPrice" as const,
    features: ["pricingFeatureAllPersonal", "pricingFeature5Athletes", "pricingFeatureAthleteManagement", "pricingFeatureCoachDashboard"] as const,
  },
  {
    key: "enterprise" as const,
    icon: Building2,
    monthlyPriceKey: "pricingEnterprisePrice" as const,
    yearlyPriceKey: "pricingEnterprisePrice" as const,
    features: ["pricingFeatureAllCoach", "pricingFeatureUnlimitedAthletes", "pricingFeatureCustom"] as const,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const { data } = await supabase.functions.invoke("check-subscription");
      if (data?.subscribed) setIsSubscribed(true);
    } catch {
      // silently ignore
    }
  };

  const handleCheckout = async (tierKey: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setLoadingTier(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { tier: tierKey, billingCycle },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message || "Checkout failed", variant: "destructive" });
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: t("error"), description: err.message || "Portal failed", variant: "destructive" });
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative">
      <PageMeta title="Pricing" description="Choose the right Sportstalent plan for athletes, coaches, and teams." canonical="https://sportstalent.dk/pricing" />
      <Watermark />
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
          <LanguageSwitcher />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{t("pricingTitle")}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("pricingSubtitle")}</p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            className={`px-4 py-2 rounded-l-lg text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingCycle("monthly")}
          >
            {t("pricingMonthly")}
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg text-sm font-medium transition-colors relative ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingCycle("yearly")}
          >
            {t("pricingYearly")}
            <Badge variant="secondary" className="absolute -top-2.5 -right-3 text-[9px] px-1.5 py-0 bg-emerald-500 text-white border-0">
              {t("pricingYearlySave")}
            </Badge>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const isEnterprise = tier.key === "enterprise";
            const isCoach = tier.key === "coach";
            const Icon = tier.icon;
            const priceKey = billingCycle === "yearly" ? tier.yearlyPriceKey : tier.monthlyPriceKey;
            const isLoading = loadingTier === tier.key;

            return (
              <Card
                key={tier.key}
                className={`relative flex flex-col ${isCoach ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
              >
                {isCoach && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    {t("pricingPopular")}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(`pricingTier${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}`)}
                  </CardTitle>
                  <CardDescription>{t(`pricingTier${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}Desc`)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-foreground">{t(priceKey)}</span>
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((featureKey) => (
                      <li key={featureKey} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isEnterprise ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:info@sportstalent.dk">
                        <Mail className="h-4 w-4 mr-2" />
                        {t("pricingContactUs")}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCoach ? "default" : "outline"}
                      disabled={isLoading}
                      onClick={() => handleCheckout(tier.key)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t("getStarted")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Demo request */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">{t("requestDemo")}</h3>
            <p className="text-sm text-muted-foreground max-w-md">{t("requestDemoDesc")}</p>
            <Button
              variant="outline"
              onClick={() => navigate("/auth?mode=signup&demo=true")}
            >
              {t("requestDemo")}
            </Button>
          </CardContent>
        </Card>

        {/* Manage subscription */}
        {isSubscribed && (
          <div className="flex justify-center">
            <Button variant="outline" disabled={managingPortal} onClick={handleManageSubscription}>
              {managingPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
              {t("manageSubscription")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
