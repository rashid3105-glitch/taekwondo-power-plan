import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, Building2, Check, Mail, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const tiers = [
  {
    key: "personal" as const,
    icon: Zap,
    priceKey: "pricingPersonalPrice" as const,
    features: ["pricingFeatureAiPlans", "pricingFeatureProgress", "pricingFeatureMental", "pricingFeatureRehab", "pricingFeatureLibrary"] as const,
  },
  {
    key: "coach" as const,
    icon: Users,
    priceKey: "pricingCoachPrice" as const,
    features: ["pricingFeatureAllPersonal", "pricingFeature5Athletes", "pricingFeatureAthleteManagement", "pricingFeatureCoachDashboard"] as const,
  },
  {
    key: "enterprise" as const,
    icon: Building2,
    priceKey: "pricingEnterprisePrice" as const,
    features: ["pricingFeatureAllCoach", "pricingFeatureUnlimitedAthletes", "pricingFeatureCustom"] as const,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
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

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const isEnterprise = tier.key === "enterprise";
            const isCoach = tier.key === "coach";
            const Icon = tier.icon;

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
                    <span className="text-3xl font-extrabold text-foreground">{t(tier.priceKey as any)}</span>
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
                        {t("pricingContactUs")}
                      </a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isCoach ? "default" : "outline"}
                      onClick={() => navigate("/auth")}
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
              <span className="text-lg font-bold text-primary">MP</span>
            </div>
            <h3 className="font-bold text-foreground">{t("pricingPaymentTitle")}</h3>
            <p className="text-sm text-muted-foreground max-w-md">{t("pricingPaymentDesc")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
