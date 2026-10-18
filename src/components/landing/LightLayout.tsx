import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { BrandLogo } from "@/components/BrandLogo";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { isNativeApp } from "@/lib/platform";

// Light public layout matching the front page (/) and /fordele/* pages.
export const LIGHT = { bg: "#FFFFFF", soft: "#F5F7FB", ink: "#0F172A", muted: "#526079", line: "#E4E8F0", blue: "#1F5BD8", gold: "#B8901F" };

export function LightLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const m = useIsMobile();
  const pad = m ? 20 : 32;
  const links = [
    { label: t("homeFooterPrivacy"), href: "/privacy" },
    { label: t("homeFooterTerms"), href: "/terms" },
    ...(isNativeApp() ? [] : [{ label: t("homeFooterContact"), href: "/contact" }, { label: t("navPricing"), href: "/priser" }]),
    { label: t("navBlog"), href: "/blog" },
  ];
  return (
    <div style={{ background: LIGHT.bg, color: LIGHT.ink, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: `1px solid ${LIGHT.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: `14px ${pad}px`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ cursor: "pointer" }} onClick={() => navigate("/")}><BrandLogo height={m ? 32 : 38} textColor={LIGHT.ink} accentColor={LIGHT.gold} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LanguageSwitcher />
            <button onClick={() => navigate("/auth")} style={{ padding: "8px 16px", borderRadius: 999, border: `1px solid ${LIGHT.line}`, background: "#fff", color: LIGHT.ink, fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{t("signIn")}</button>
          </div>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ borderTop: `1px solid ${LIGHT.line}`, background: LIGHT.soft }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: `24px ${pad}px`, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", fontSize: 13, color: LIGHT.muted }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {links.map((l) => (
              <button key={l.href} type="button" onClick={() => navigate(l.href)} style={{ background: "none", border: 0, padding: "6px 0", color: "inherit", font: "inherit", cursor: "pointer" }}>{l.label}</button>
            ))}
          </div>
          <div>© Sportstalent.dk · CVR 33685815</div>
        </div>
      </footer>
    </div>
  );
}
