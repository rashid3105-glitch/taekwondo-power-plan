import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, Shield, Copy, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export default function MfaSetupDialog({ open, onOpenChange, onChanged }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"loading" | "enroll" | "verify" | "enabled" | "disabled">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("loading");
      setFactorId(null);
      setQr(null);
      setSecret(null);
      setCode("");
      setBusy(false);
      setCopied(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const verified = (data?.all || []).find((f: any) => f.status === "verified");
        if (verified) {
          setStep("enabled");
          return;
        }
        const unverified = (data?.all || []).find((f: any) => f.status === "unverified");
        if (unverified) {
          await supabase.auth.mfa.unenroll({ factorId: unverified.id });
        }
        const { data: enroll, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Sportstalent",
        });
        if (enrollErr) throw enrollErr;
        setFactorId(enroll.id);
        setQr(enroll.totp.qr_code);
        setSecret(enroll.totp.secret);
        setStep("enroll");
      } catch (e: any) {
        console.error("mfa setup load failed", e);
        toast.error(e?.message || t("error"));
        onOpenChange(false);
      }
    })();
  }, [open, onOpenChange, t]);

  const handleVerify = async () => {
    if (!factorId || code.length !== 6) return;
    setBusy(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.replace(/\s/g, ""),
      });
      if (verifyErr) throw verifyErr;
      setStep("enabled");
      onChanged();
      toast.success(t("mfaSetupSuccess"));
    } catch (e: any) {
      console.error("mfa verify failed", e);
      toast.error(e?.message || t("mfaInvalidCode"));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = (data?.all || []).find((f: any) => f.status === "verified");
      if (!verified) throw new Error(t("error"));
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
      if (unenrollErr) throw unenrollErr;
      setStep("disabled");
      onChanged();
      toast.success(t("mfaDisabledSuccess"));
    } catch (e: any) {
      console.error("mfa disable failed", e);
      toast.error(e?.message || t("error"));
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("mfaTitle")}
          </DialogTitle>
          <DialogDescription>{t("mfaSetupDesc")}</DialogDescription>
        </DialogHeader>

        {step === "loading" && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {step === "enroll" && qr && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("mfaScanQr")}</p>
            <div className="flex justify-center bg-white p-3 rounded-xl">
              <img src={qr} alt={t("mfaQrAlt")} className="w-48 h-48" />
            </div>
            {secret && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{t("mfaManualEntry")}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs break-all font-mono text-foreground">{secret}</code>
                  <Button type="button" variant="ghost" size="icon" onClick={copySecret} aria-label={t("copy")}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("mfaEnterCode")}</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("mfaCodePlaceholder")}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-lg tracking-widest h-12"
              />
            </div>
            <Button
              onClick={handleVerify}
              disabled={busy || code.length !== 6}
              className="w-full"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("mfaVerify")}
            </Button>
          </div>
        )}

        {step === "enabled" && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-green-600 dark:text-green-400">
              <p className="text-sm font-medium">{t("mfaEnabledTitle")}</p>
              <p className="text-xs mt-1">{t("mfaEnabledDesc")}</p>
            </div>
            <p className="text-xs text-muted-foreground">{t("mfaNoRecoveryCodes")}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => onOpenChange(false)} className="w-full">{t("close")}</Button>
              <Button
                variant="outline"
                onClick={handleDisable}
                disabled={busy}
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("mfaDisable")}
              </Button>
            </div>
          </div>
        )}

        {step === "disabled" && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">{t("mfaDisabledTitle")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("mfaDisabledDesc")}</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">{t("close")}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
