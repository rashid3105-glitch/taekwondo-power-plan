import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Users2, Building2, Check, Mail, FlaskConical, Loader2, Settings, Trophy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PublicNav } from "@/components/PublicNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { TranslationKey } from "@/i18n/translations";
import { detectCurrency, formatPrice, getTierPrice } from "@/lib/currency";
import { isNativeApp } from "@/lib/platform";

type Tier = {
  key: "team_small" | "team_medium" | "team_large";
  icon: typeof Users;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  features: TranslationKey[];
  popular?: boolean;
};


const teamTiers: Tier[] = [
  {
    key: "team_small",
    icon: Users,
    nameKey: "pricingTierTeamSmall",
    descKey: "pricingTierTeamSmallDesc",
    features: [
      "pricingFeature5Athletes",
      "pricingFeatureAllModules",
      "pricingFeatureUnlimitedPlans",
      "pricingFeatureBulkPlans",
      "pricingFeatureSquadOverview",
    ],
  },
  {
    key: "team_medium",
    icon: Users2,
    nameKey: "pricingTierTeamMedium",
    descKey: "pricingTierTeamMediumDesc",
    popular: true,
    features: [
      "pricingFeature15Athletes",
      "pricingFeatureAllModules",
      "pricingFeatureUnlimitedPlans",
      "pricingFeatureBulkPlans",
      "pricingFeatureSquadOverview",
      "pricingFeatureOnboarding",
    ],
  },
  {
    key: "team_large",
    icon: Building2,
    nameKey: "pricingTierTeamLarge",
    descKey: "pricingTierTeamLargeDesc",
    features: [
      "pricingFeature25Athletes",
      "pricingFeatureAllModules",
      "pricingFeatureUnlimitedPlans",
      "pricingFeatureBulkPlans",
      "pricingFeatureSquadOverview",
      "pricingFeatureOnboarding",
      "pricingFeaturePrioritySupport",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPaidOrDemo, setIsPaidOrDemo] = useState(false);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const currency = useMemo(() => detectCurrency(), []);
  const showWelcome = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("welcome") === "1";
  // Native (iOS/Android via Capacitor) MUST NOT expose any purchase UI,
  // pricing, external payment links, or upgrade/demo CTAs. The web version
  // stays 100% unchanged. See src/lib/platform.ts.
  const native = isNativeApp();

  useEffect(() => {
    if (native) return;
    checkSubscription();
  }, [native]);

  // Inject Product JSON-LD for subscription tiers (rich pricing results).
  // Skipped in native — no pricing surface allowed at all.
  useEffect(() => {
    if (native) return;
    const currencyCode = currency.toUpperCase();
    const allTiers = [...teamTiers];
    const products = allTiers.map((tier) => {
      const monthly = getTierPrice(tier.key, currency, "monthly");
      const yearly = getTierPrice(tier.key, currency, "yearly");
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `Sportstalent — ${t(tier.nameKey)}`,
        description: t(tier.descKey),
        brand: { "@type": "Brand", name: "Sportstalent" },
        offers: [
          monthly != null && {
            "@type": "Offer",
            price: monthly,
            priceCurrency: currencyCode,
            url: "https://sportstalent.dk/pricing",
            availability: "https://schema.org/InStock",
            category: "Monthly subscription",
          },
          yearly != null && {
            "@type": "Offer",
            price: yearly,
            priceCurrency: currencyCode,
            url: "https://sportstalent.dk/pricing",
            availability: "https://schema.org/InStock",
            category: "Yearly subscription",
          },
        ].filter(Boolean),
      };
    });

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.pricingProducts = "true";
    script.textContent = JSON.stringify(products);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [currency, locale, t]);

  const checkSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { data: protectedFields } = await supabase.rpc("get_profile_protected_fields", {
        _user_id: session.user.id,
      });
      if (protectedFields && protectedFields.length > 0) {
        const pf = protectedFields[0];
        if (pf.payment_status === "paid" || pf.is_demo || pf.demo_full_access) {
          setIsPaidOrDemo(true);
        }
      }
    } catch {
      // ignore
    }

    try {
      const { data } = await supabase.functions.invoke("check-subscription");
      if (data?.subscribed) {
        setIsSubscribed(true);
        setIsPaidOrDemo(true);
        if (data?.tier) setCurrentTier(data.tier);
      }
    } catch {
      // silently ignore
    }
  };

  const handleCheckout = async (tierKey: string) => {
    if (isPaidOrDemo) {
      navigate("/dashboard");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=/pricing");
      return;
    }

    setLoadingTier(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { tier: tierKey, billingCycle, currency },
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

  const renderTierCard = (tier: Tier) => {
    const Icon = tier.icon;
    const amount = getTierPrice(tier.key, currency, billingCycle);
    const priceDisplay = amount != null ? formatPrice(amount, currency, billingCycle, locale) : "";
    const isLoading = loadingTier === tier.key;
    const isCurrent = currentTier === tier.key;

    return (
      <Card
        key={tier.key}
        className={`relative flex flex-col bg-card shadow-sm ${
          isCurrent ? "border-emerald-500 shadow-lg ring-2 ring-emerald-500/30" :
          tier.popular ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border"
        }`}
      >
        {isCurrent && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-bold text-white">
            {t("currentPlan")}
          </div>
        )}
        {!isCurrent && tier.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
            {t("pricingPopular")}
          </div>
        )}
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-2">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">{t(tier.nameKey)}</CardTitle>
          <CardDescription>{t(tier.descKey)}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="text-center">
            <span className="text-3xl font-extrabold text-card-foreground">{priceDisplay}</span>
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
          {isCurrent ? (
            <Button className="w-full" variant="outline" onClick={() => navigate("/settings/subscription")}>
              {t("manageSubscription")}
            </Button>
          ) : isPaidOrDemo && isSubscribed ? (
            <Button
              className="w-full"
              variant={tier.popular ? "default" : "outline"}
              disabled={isLoading}
              onClick={() => handleCheckout(tier.key)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("switchToThisPlan")}
            </Button>
          ) : isPaidOrDemo ? (
            <Button className="w-full" variant="outline" onClick={() => navigate("/dashboard")}>
              {t("backToDashboard")}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant={tier.popular ? "default" : "outline"}
              disabled={isLoading}
              onClick={() => handleCheckout(tier.key)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("getStarted")}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  // App Store / Google Play compliance: in native builds we render a neutral
  // informational screen only — no prices, no CTAs, no external payment links.
  if (native) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <PageMeta title="Account" description="Manage your account" />
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
          <h1 className="text-xl font-bold text-foreground">{t("nativePlanManagedTitle")}</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            {t("backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <PageMeta
        title="Pricing"
        description="Choose the right Sportstalent plan for athletes, coaches, and teams."
        canonical="https://sportstalent.dk/pricing"
      />
      <Watermark />

      <PublicNav />

      <div className="px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {showWelcome && !isPaidOrDemo && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-center text-sm text-foreground">
              {t("chooseSubscriptionToStart")}
            </div>
          )}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground">{t("pricingTitle")}</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">{t("pricingSubtitle")}</p>
          </div>
        </div>
      </div>

      <div className="h-16 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

      <div className="theme-light-section px-4 pb-12">
        <div className="mx-auto max-w-6xl space-y-10">
          {/* Billing toggle */}
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
              <Badge
                variant="secondary"
                className="absolute -top-2.5 -right-3 text-[9px] px-1.5 py-0 bg-emerald-500 text-white border-0"
              >
                {t("pricingYearlySave")}
              </Badge>
            </button>
          </div>

          {/* Clubs & organisations */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center">
              {t("pricingForTeams")}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {teamTiers.map(renderTierCard)}
            </div>
          </section>


          {/* Federation */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="flex flex-col md:flex-row items-center gap-4 py-6 px-6 text-center md:text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary shrink-0">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-card-foreground">{t("pricingTierFederation")}</h3>
                <p className="text-sm text-muted-foreground">{t("pricingTierFederationDesc")}</p>
              </div>
              <Button variant="outline" asChild>
                <a href="mailto:info@sportstalent.dk">
                  <Mail className="h-4 w-4 mr-2" />
                  {t("pricingContactUs")}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Demo request */}
          <Card className="border-dashed border-border bg-card shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold text-card-foreground">{t("requestDemo")}</h3>
              <p className="text-sm text-muted-foreground max-w-md">{t("requestDemoDesc")}</p>
              <Button variant="outline" onClick={() => navigate("/auth?mode=signup&demo=true")}>
                {t("requestDemo")}
              </Button>
            </CardContent>
          </Card>

          {/* Manage subscription */}
          {isSubscribed && (
            <div className="flex justify-center">
              <Button variant="outline" disabled={managingPortal} onClick={handleManageSubscription}>
                {managingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                {t("manageSubscription")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
