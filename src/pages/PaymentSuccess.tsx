import { useNavigate } from "react-router-dom";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { Check, ArrowLeft, Rocket } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background px-4 py-8 relative flex flex-col items-center justify-center">
      <PageMeta title="Payment Success" description="Your payment was successful" />
      <Watermark />
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("paymentSuccessTitle")}</h1>
          <p className="text-muted-foreground">{t("paymentSuccessDesc")}</p>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate("/pricing")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("pricingTitle")}
            </Button>
            <Button onClick={() => navigate("/dashboard")}>
              <Rocket className="h-4 w-4 mr-1" /> {t("goToDashboard")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
