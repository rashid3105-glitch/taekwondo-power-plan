import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export const OfflineBanner = () => {
  const { t } = useLanguage();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="h-4 w-4" />
      <span>{t("offlineBanner")}</span>
    </div>
  );
};
