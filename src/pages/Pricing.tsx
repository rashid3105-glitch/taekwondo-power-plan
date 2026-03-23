import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Building2, Check, Mail, ArrowLeft, FlaskConical } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
  const [showDialog, setShowDialog] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative">
      <PageMeta title="Pricing" description="Choose the right Sportstalent plan for athletes, coaches, and teams." />
      <Watermark />
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
          <LanguageSwitcher />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{t("pricingTitle" as any)}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("pricingSubtitle" as any)}</p>
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
            {t("pricingMonthly" as any)}
          </button>
          <button
            className={`px-4 py-2 rounded-r-lg text-sm font-medium transition-colors relative ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingCycle("yearly")}
          >
            {t("pricingYearly" as any)}
            <Badge variant="secondary" className="absolute -top-2.5 -right-3 text-[9px] px-1.5 py-0 bg-emerald-500 text-white border-0">
              {t("pricingYearlySave" as any)}
            </Badge>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const isEnterprise = tier.key === "enterprise";
            const isCoach = tier.key === "coach";
            const Icon = tier.icon;
            const priceKey = billingCycle === "yearly" ? tier.yearlyPriceKey : tier.monthlyPriceKey;

            return (
              <Card
                key={tier.key}
                className={`relative flex flex-col ${isCoach ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
              >
                {isCoach && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    {t("pricingPopular" as any)}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(`pricingTier${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}` as any)}
                  </CardTitle>
                  <CardDescription>{t(`pricingTier${tier.key.charAt(0).toUpperCase() + tier.key.slice(1)}Desc` as any)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-foreground">{t(priceKey as any)}</span>
                  </div>
                  <ul className="space-y-2">
                    {tier.features.map((featureKey) => (
                      <li key={featureKey} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{t(featureKey as any)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isEnterprise ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href="mailto:info@sportstalent.dk">
                        <Mail className="h-4 w-4 mr-2" />
                        {t("pricingContactUs" as any)}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCoach ? "default" : "outline"}
                      onClick={() => setShowDialog(true)}
                    >
                      {t("getStarted")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <span className="text-lg font-bold text-primary">PP</span>
            </div>
            <h3 className="font-bold text-foreground">{t("pricingPaymentTitle" as any)}</h3>
            <p className="text-sm text-muted-foreground max-w-md">{t("pricingPaymentDesc" as any)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Get Started Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("getStarted")}</DialogTitle>
            <DialogDescription>{t("pricingDialogDesc" as any)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Request Demo */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={() => {
                setShowDialog(false);
                navigate("/auth?mode=signup&demo=true");
              }}
            >
              <FlaskConical className="h-5 w-5 text-primary shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">{t("requestDemo" as any)}</p>
                <p className="text-xs text-muted-foreground">{t("requestDemoDesc" as any)}</p>
              </div>
            </Button>

            {/* PayPal instructions */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">PP</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{t("paypalTitle")}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t("paypalInstruction")}</p>
              <p className="text-lg font-bold text-primary font-mono">rashid3105@gmail.com</p>
              <p className="text-xs text-muted-foreground">{t("paypalReference")}</p>
            </div>

            {/* Sign up button */}
            <Button
              className="w-full"
              onClick={() => {
                setShowDialog(false);
                navigate("/auth");
              }}
            >
              {t("createAccount")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
