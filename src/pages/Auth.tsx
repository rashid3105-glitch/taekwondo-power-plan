import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageMeta } from "@/components/PageMeta";
import { validatePassword } from "@/lib/passwordValidation";
import {
  passkeysSupported,
  platformAuthenticatorAvailable,
  signInWithPasskey,
} from "@/lib/passkeys";
import { haptics } from "@/lib/haptics";
import coachAthlete from "@/assets/coach-athlete.jpg";

const GOLD = "#F5C842";
const BG = "#0B0C14";

export default function AuthPage() {
  const initialTab = new URLSearchParams(window.location.search).get("tab");
  const [isLogin, setIsLogin] = useState(initialTab !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const redirectTo = new URLSearchParams(window.location.search).get("redirect");
  const inviteCode = new URLSearchParams(window.location.search).get("invite");

  useEffect(() => {
    if (inviteCode) sessionStorage.setItem("pending_invite_code", inviteCode);
  }, [inviteCode]);

  useEffect(() => {
    (async () => {
      if (!passkeysSupported()) return;
      const ok = await platformAuthenticatorAvailable();
      setPasskeyAvailable(ok);
    })();
  }, []);

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    haptics.tap();
    try {
      await signInWithPasskey(email || undefined);
      navigate(redirectTo || "/dashboard");
    } catch (e: any) {
      toast({ title: t("passkeyLoginFailed"), description: e?.message, variant: "destructive" });
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: t("error"), description: t("email"), variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: t("resetLinkSent"), description: t("resetLinkSentDesc") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const pendingInvite = sessionStorage.getItem("pending_invite_code");
        if (pendingInvite) {
          sessionStorage.removeItem("pending_invite_code");
          await supabase.rpc("apply_invite_to_my_profile" as any, { _code: pendingInvite });
          await supabase.auth.signOut();
          toast({ title: t("joinRequestSent") });
          navigate("/");
          return;
        }
        navigate(redirectTo || "/dashboard");
      } else {
        const pwCheck = validatePassword(password);
        if (!pwCheck.ok) {
          toast({ title: t("error"), description: t("passwordTooWeak"), variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "new-user-notification",
              recipientEmail: "rashid3105@gmail.com",
              idempotencyKey: `new-user-${signUpData.user?.id || Date.now()}`,
              templateData: { userName: displayName, userEmail: email, isDemo: false },
            },
          });
        } catch (emailErr) {
          console.error("Failed to send admin notification email", emailErr);
        }
        toast({ title: t("accountCreated"), description: t("youreSignedIn") });
        navigate(redirectTo ? `/onboarding?redirect=${encodeURIComponent(redirectTo)}` : "/onboarding");
      }
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      const isPreviewProxyFailure =
        msg.toLowerCase().includes("load failed") || msg.toLowerCase().includes("failed to fetch");
      toast({
        title: t("error"),
        description: isPreviewProxyFailure
          ? "Netværksfejl i preview. Prøv at åbne siden i en ny fane eller på sportstalent.dk."
          : msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 46,
    padding: "0 14px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontSize: 15,
    outline: "none",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "Inter, sans-serif" }}>
      <PageMeta
        title={isLogin ? "Log ind – Sportstalent" : "Opret konto – Sportstalent"}
        description="Log ind eller opret din Sportstalent-konto."
        noindex
      />

      <nav
        style={{
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          onClick={() => navigate("/")}
          style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", cursor: "pointer" }}
        >
          Sports<span style={{ color: GOLD }}>talent</span>
        </div>
        <LanguageSwitcher />
      </nav>

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {isLogin ? t("signInToAccount") : t("createAthleteAccount")}
        </h1>
        <p style={{ textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>
          {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "transparent",
              border: "none",
              color: GOLD,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
              padding: 0,
            }}
          >
            {isLogin ? t("signUp") : t("signIn")}
          </button>
        </p>

        {isLogin && passkeyAvailable && (
          <>
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={passkeyLoading}
              style={{
                width: "100%",
                height: 46,
                borderRadius: 10,
                background: "rgba(245,200,66,0.1)",
                border: "1px solid rgba(245,200,66,0.35)",
                color: GOLD,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {passkeyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" /> {t("continueWithFaceId")}
                </>
              )}
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16, letterSpacing: "0.1em" }}>
              {t("usePasswordInstead")}
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!isLogin && (
            <div>
              <label style={labelStyle}>{t("displayName")}</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("yourName")}
                required
                autoComplete="name"
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>{t("email")}</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="athlete@example.com"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{t("password")}</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {t("forgotPassword")}
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={isLogin ? 6 : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={inputStyle}
            />
            {!isLogin && (
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
                {t("passwordRequirementsHint")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 10,
              border: "none",
              background: GOLD,
              color: BG,
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t("pleaseWait") : isLogin ? t("signIn") : t("createAccount")}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 16 }}>
          {t("ctaSubtext")}
        </p>

        <div
          style={{
            marginTop: 48,
            borderRadius: 16,
            overflow: "hidden",
            border: "0.5px solid rgba(255,255,255,0.08)",
          }}
        >
          <img
            src={coachAthlete}
            alt="Coach og atlet ved sidelinjen til en taekwondo-kamp"
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
