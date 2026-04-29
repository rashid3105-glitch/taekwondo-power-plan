import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Fingerprint, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  enrollPasskey,
  passkeysSupported,
  platformAuthenticatorAvailable,
} from "@/lib/passkeys";
import { haptics } from "@/lib/haptics";

/**
 * One-time prompt shown on the dashboard inviting the user to enable Face ID.
 * Hidden if not supported, already dismissed, or user already has a passkey.
 */
export function EnablePasskeyCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!passkeysSupported()) return;
        if (!(await platformAuthenticatorAvailable())) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("passkey_prompt_dismissed_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.passkey_prompt_dismissed_at) return;

        const { count } = await supabase
          .from("user_passkeys")
          .select("*", { count: "exact", head: true });
        if ((count || 0) > 0) return;

        if (!cancelled) setShow(true);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dismiss = async () => {
    setShow(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ passkey_prompt_dismissed_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
  };

  const handleEnable = async () => {
    setBusy(true);
    haptics.tap();
    try {
      await enrollPasskey();
      toast({ title: t("passkeyEnrolled") });
      await dismiss();
    } catch (e: any) {
      toast({
        title: t("passkeyEnrollFailed"),
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  if (!show) return null;

  return (
    <Card className="p-4 border-primary/30 bg-primary/5 relative">
      <button
        onClick={dismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Fingerprint className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-sm font-bold">{t("enableFaceIdTitle")}</h4>
          <p className="text-xs text-muted-foreground mt-1">{t("enableFaceIdDesc")}</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={busy}
              className="h-9"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("enableFaceIdCta")}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss} className="h-9">
              {t("notNow")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
