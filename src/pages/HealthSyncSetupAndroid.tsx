import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, Bell, Apple } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

export default function HealthSyncSetupAndroid() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  function notifyMe() {
    haptics.tap();
    toast.success(t("healthAndroidNotifyToast" as any));
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <PageMeta title="Android Health Connect" noindex />

      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white/80 hover:text-white"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-base font-bold">{t("profileHealthAndroidTitle" as any)}</h1>
        </div>
      </header>

      <div className="px-4 py-8 max-w-md mx-auto space-y-6">
        <div className="flex flex-col items-center text-center space-y-4 py-8">
          <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {t("comingSoonBadge" as any)}
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              {t("healthAndroidComingSoonTitle" as any)}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-sm">
              {t("healthAndroidComingSoonBody" as any)}
            </p>
          </div>
        </div>

        <Button
          onClick={notifyMe}
          className="w-full h-12 font-semibold rounded-xl"
        >
          <Bell className="h-4 w-4 mr-2" />
          {t("healthAndroidNotifyMe" as any)}
        </Button>

        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Apple className="h-4 w-4 text-white/80" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{t("healthAndroidHasIphoneTitle" as any)}</p>
              <p className="text-xs text-white/60 mt-0.5">
                {t("healthAndroidHasIphoneBody" as any)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-9 text-xs"
                onClick={() => navigate("/health/sync-setup")}
              >
                {t("healthAndroidOpenIphoneGuide" as any)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
