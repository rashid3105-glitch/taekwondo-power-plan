import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share, Plus, Smartphone, MonitorSmartphone, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageMeta } from "@/components/PageMeta";
import { Watermark } from "@/components/Watermark";
import logo from "@/assets/logo.png";

type Platform = "ios" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as any).standalone === true
  );
}

export default function Install() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <PageMeta
        title={t("installTitle")}
        description={t("installSubtitle")}
        canonical="https://sportstalent.dk/install"
        noindex
      />
      <Watermark />

      <div className="px-4 py-6 max-w-xl mx-auto space-y-6 relative z-10 pt-safe pb-safe">
        <Button variant="ghost" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>

        <div className="text-center space-y-3">
          <img src={logo} alt="Sportstalent" className="h-20 w-20 mx-auto rounded-2xl" />
          <h1 className="text-3xl font-extrabold tracking-tight">{t("installTitle")}</h1>
          <p className="text-muted-foreground">{t("installSubtitle")}</p>
        </div>

        {installed && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
            <div>
              <div className="font-semibold">{t("installAlreadyTitle")}</div>
              <div className="text-sm text-muted-foreground">{t("installAlreadyDesc")}</div>
            </div>
          </div>
        )}

        {/* iOS instructions */}
        {platform === "ios" && !installed && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">{t("installIosTitle")}</h2>
            </div>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                <span className="flex items-center gap-2 flex-wrap">
                  {t("installIosStep1")} <Share className="h-4 w-4 inline text-primary" />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                <span className="flex items-center gap-2 flex-wrap">
                  {t("installIosStep2")} <Plus className="h-4 w-4 inline text-primary" />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
                <span>{t("installIosStep3")}</span>
              </li>
            </ol>
          </div>
        )}

        {/* Android instructions */}
        {platform === "android" && !installed && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">{t("installAndroidTitle")}</h2>
            </div>
            {deferredPrompt ? (
              <Button onClick={handleAndroidInstall} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                {t("installAndroidButton")}
              </Button>
            ) : (
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                  <span>{t("installAndroidStep1")}</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                  <span>{t("installAndroidStep2")}</span>
                </li>
              </ol>
            )}
          </div>
        )}

        {/* Desktop instructions */}
        {platform === "desktop" && !installed && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-lg">{t("installDesktopTitle")}</h2>
            </div>
            {deferredPrompt ? (
              <Button onClick={handleAndroidInstall} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                {t("installDesktopButton")}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("installDesktopHint")}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <strong className="text-foreground">{t("installBenefitsTitle")}</strong>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>{t("installBenefit1")}</li>
            <li>{t("installBenefit2")}</li>
            <li>{t("installBenefit3")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
