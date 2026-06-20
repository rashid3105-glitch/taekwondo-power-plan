import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

const GOLD = "#F5C842";

export default function BlogCommentConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const { locale } = useLanguage();
  const isDa = locale === "da";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let mounted = true;
    if (!token) {
      setState("error");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-blog-comment", {
          body: { token },
        });
        if (!mounted) return;
        if (error || (data as any)?.error) {
          setState("error");
        } else {
          setState("success");
        }
      } catch {
        if (mounted) setState("error");
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const heading = isDa ? "Kommentar-bekræftelse" : "Comment confirmation";
  const successText = isDa
    ? "Tak — din kommentar vises efter godkendelse."
    : "Thanks — your comment will appear after moderation.";
  const errorText = isDa
    ? "Linket er ugyldigt eller udløbet."
    : "This link is invalid or has expired.";
  const loadingText = isDa ? "Bekræfter…" : "Confirming…";
  const backText = isDa ? "← Blog" : "← Blog";

  return (
    <LandingLayout>
      <PageMeta title={`${heading} · Sportstalent`} />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "100px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 24, color: "#fff" }}>
          {heading}
        </h1>

        {state === "loading" && (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16 }}>{loadingText}</p>
        )}
        {state === "success" && (
          <p style={{ color: GOLD, fontSize: 18, fontWeight: 600, lineHeight: 1.5 }}>
            ✓ {successText}
          </p>
        )}
        {state === "error" && (
          <p style={{ color: "#ff8a8a", fontSize: 16, lineHeight: 1.5 }}>
            {errorText}
          </p>
        )}

        <button
          onClick={() => navigate("/blog")}
          style={{
            marginTop: 32,
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: GOLD,
            color: "#0B0C14",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {backText}
        </button>
      </div>
    </LandingLayout>
  );
}
