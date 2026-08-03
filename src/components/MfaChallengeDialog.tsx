import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { Loader2, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  open: boolean;
  factorId: string;
  onVerified: (remember: boolean) => void;
  onCancel: () => void;
}

export default function MfaChallengeDialog({ open, factorId, onVerified, onCancel }: Props) {
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;
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
      setCode("");
      onVerified(remember);
    } catch (e: any) {
      console.error("mfa challenge failed", e);
      toast.error(e?.message || t("mfaInvalidCode"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("mfaChallengeTitle")}
          </DialogTitle>
          <DialogDescription>{t("mfaChallengeDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t("mfaCodePlaceholder")}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="text-center text-2xl tracking-[0.5em] h-14"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
            {t("mfaRememberDevice")}
          </label>
          <Button
            onClick={handleVerify}
            disabled={busy || code.length !== 6}
            className="w-full"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("mfaVerify")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
