import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";

const GOLD = "#D4AF37";
const STORAGE_KEY = "st-cookie-consent";

export function CookieConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // Fail open if storage is unavailable
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "granted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={t("privacyCookies")}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(11,12,20,0.97)",
        borderTop: "0.5px solid rgba(212,175,55,0.25)",
        backdropFilter: "blur(10px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Cookie size={16} aria-hidden style={{ color: GOLD, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: "rgba(255,255,255,0.8)", flex: 1 }}>
          {t("cookieBannerText")}{" "}
          <Link to="/privacy" style={{ color: GOLD, textDecoration: "underline", textUnderlineOffset: 2 }}>
            {t("cookieBannerPrivacy")}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          style={{
            background: GOLD,
            color: "#0B0C14",
            border: "none",
            borderRadius: 8,
            padding: "0 16px",
            minHeight: 40,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {t("cookieBannerAccept")}
        </button>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
