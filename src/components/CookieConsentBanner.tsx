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
      role="dialog"
      aria-live="polite"
      aria-label={t("privacyCookies")}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(11,12,20,0.98)",
        borderTop: "0.5px solid rgba(212,175,55,0.25)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            width: "100%",
          }}
        >
          <Cookie
            size={20}
            style={{
              color: GOLD,
              marginTop: 2,
              flexShrink: 0,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.55,
              color: "rgba(255,255,255,0.85)",
              flex: 1,
            }}
          >
            {t("cookieBannerText")}{" "}
            <Link
              to="/privacy"
              style={{
                color: GOLD,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {t("cookieBannerPrivacy")}
            </Link>
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={accept}
            style={{
              background: GOLD,
              color: "#0B0C14",
              border: "none",
              borderRadius: 8,
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t("cookieBannerAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
