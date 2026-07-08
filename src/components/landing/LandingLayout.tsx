import { useNavigate, useLocation } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#F5C842";

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const NAV_LINKS = [
    { label: t("navHome"), href: "/" },
    { label: t("navPlatform"), href: "/platform" },
    { label: t("navFeatures"), href: "/funktioner" },
    { label: t("navPricing"), href: "/priser" },
    { label: t("navAbout"), href: "/about" },
    { label: t("navBlog"), href: "/blog" },
  ];

  return (
    <div style={{ background: "#0B0C14", color: "#fff", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      <nav style={{ background: "rgba(11,12,20,0.97)", borderBottom: "0.5px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, zIndex: 100 }}>
        {/* Row 1: logo + utility */}
        <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo height={40} onClick={() => navigate("/")} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LanguageSwitcher />
            <button
              onClick={() => navigate("/auth")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: `0.5px solid ${GOLD}`,
                background: GOLD,
                color: "#0B0C14",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {t("signIn")}
            </button>
          </div>
        </div>
        {/* Row 2: nav links */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            padding: "8px 12px",
            borderTop: "0.5px solid rgba(255,255,255,0.05)",
            overflowX: "auto",
          }}
        >
          {NAV_LINKS.map((l) => {
            const active =
              l.href === "/"
                ? location.pathname === "/"
                : location.pathname === l.href || location.pathname.startsWith(l.href + "/");
            return (
              <span
                key={l.href}
                onClick={() => navigate(l.href)}
                style={{
                  color: active ? GOLD : "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  fontWeight: active ? 700 : 500,
                  fontSize: 12,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: active ? `1px solid ${GOLD}` : "1px solid transparent",
                  background: active ? "rgba(245,200,66,0.08)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {l.label}
              </span>
            );
          })}
        </div>
      </nav>
      <main>{children}</main>
      <footer style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <BrandLogo height={36} onClick={() => navigate("/")} />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>CVR 33685815 · København, Danmark</div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
            {[
              { label: t("homeFooterPrivacy"), href: "/privacy" },
              { label: t("homeFooterTerms"), href: "/terms" },
              { label: t("homeFooterContact"), href: "/priser" },
              { label: t("navBlog"), href: "/blog" },
            ].map(l => <span key={l.href} onClick={() => navigate(l.href)} style={{ cursor: "pointer" }}>{l.label}</span>)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>© 2026 Sportstalent.dk</div>
        </div>
      </footer>
    </div>
  );
}
