import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageMeta } from "@/components/PageMeta";
import {
  passkeysSupported,
  platformAuthenticatorAvailable,
  signInWithPasskey,
} from "@/lib/passkeys";
import { haptics } from "@/lib/haptics";
import { registerPushToken } from "@/lib/nativePush";
import {
  isNative,
  isBiometricAvailable,
  hasSavedBiometricCredentials,
  getBiometricCredentialsWithPrompt,
  saveBiometricCredentials,
  getBiometryLabel,
} from "@/lib/biometricAuth";
import coachAthlete from "@/assets/coach-athlete.jpg";

const GOLD = "#F5C842";
const BG = "#0B0C14";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioHasCreds, setBioHasCreds] = useState(false);
  const [bioLabel, setBioLabel] = useState("Face ID");
  const [bioLoading, setBioLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect");
  const inviteCode = params.get("invite");
  const tab = params.get("tab");

  // Redirect legacy signup/invite entry points to the correct flows.
  // Athletes now only join via invitation link; coaches sign up on /signup/coach.
  useEffect(() => {
    if (inviteCode) {
      try { sessionStorage.setItem("pending_invite_code", inviteCode); } catch {}
      navigate(`/invite-signup?code=${encodeURIComponent(inviteCode)}`, { replace: true });
      return;
    }
    if (tab === "signup") {
      navigate("/signup/coach", { replace: true });
    }
  }, [inviteCode, tab, navigate]);

  useEffect(() => {
    (async () => {
      if (!passkeysSupported()) return;
      const ok = await platformAuthenticatorAvailable();
      setPasskeyAvailable(ok);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!isNative()) return;
      const avail = await isBiometricAvailable();
      setBioAvailable(avail);
      if (avail) {
        setBioLabel(await getBiometryLabel());
        setBioHasCreds(await hasSavedBiometricCredentials());
      }
    })();
  }, []);

  const applyPendingInviteAndPush = async () => {
    const pendingInvite =
      sessionStorage.getItem("pending_invite_code") ||
      localStorage.getItem("pending_invite_code");
    if (pendingInvite) {
      sessionStorage.removeItem("pending_invite_code");
      try { localStorage.removeItem("pending_invite_code"); } catch {}
      try { await supabase.rpc("apply_invite_to_my_profile" as any, { _code: pendingInvite }); } catch {}
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await registerPushToken(user.id);
    } catch { /* non-blocking */ }
  };

  const handleBiometricLogin = async () => {
    setBioLoading(true);
    haptics.tap();
    try {
      const creds = await getBiometricCredentialsWithPrompt(
        bioLabel === "Face ID" ? "Log ind med Face ID" : "Log ind med biometri"
      );
      if (!creds) throw new Error("Ingen gemte oplysninger");
      const { error } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });
      if (error) throw error;
      await applyPendingInviteAndPush();
      navigate(redirectTo || "/dashboard");
    } catch (e: any) {
      toast({
        title: t("error"),
        description: e?.message || "Biometrisk login fejlede",
        variant: "destructive",
      });
    } finally {
      setBioLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    haptics.tap();
    try {
      await signInWithPasskey(email || undefined);
      await applyPendingInviteAndPush();
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await applyPendingInviteAndPush();
      // Offer to save credentials for biometric login on native
      if (bioAvailable && !bioHasCreds) {
        try {
          const ok = window.confirm(`Vil du aktivere ${bioLabel} til hurtigt login næste gang?`);
          if (ok) {
            await saveBiometricCredentials(email, password);
            setBioHasCreds(true);
          }
        } catch { /* ignore */ }
      }
      navigate(redirectTo || "/dashboard");
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
        title="Log ind – Sportstalent"
        description="Log ind på din Sportstalent-konto."
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
            marginBottom: 32,
          }}
        >
          {t("signInToAccount")}
        </h1>

        {passkeyAvailable && (
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

        {bioAvailable && bioHasCreds && !passkeyAvailable && (
          <>
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={bioLoading}
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
              {bioLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" /> Log ind med {bioLabel}
                </>
              )}
            </button>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16, letterSpacing: "0.1em" }}>
              {t("usePasswordInstead")}
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>{t("email")}</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
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
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
              style={inputStyle}
            />
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
            {loading ? t("pleaseWait") : t("signIn")}
          </button>
        </form>

        {/* Coach / club sign-up CTA */}
        <div
          style={{
            marginTop: 32,
            padding: "20px 20px 22px",
            borderRadius: 14,
            background: "rgba(245,200,66,0.06)",
            border: "1px solid rgba(245,200,66,0.28)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6 }}>
            {t("authCoachCtaTitle" as any)}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 14, lineHeight: 1.5 }}>
            {t("authCoachCtaBody" as any)}
          </div>
          <button
            type="button"
            onClick={() => navigate("/signup/coach")}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 10,
              border: "none",
              background: GOLD,
              color: BG,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t("authCoachCtaButton" as any)}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 20, lineHeight: 1.5 }}>
          {t("authAthleteHint" as any)}
        </p>

        <div
          style={{
            marginTop: 40,
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
