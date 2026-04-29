import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  enrollPasskey,
  passkeysSupported,
  platformAuthenticatorAvailable,
} from "@/lib/passkeys";
import { Fingerprint, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { haptics } from "@/lib/haptics";

interface Passkey {
  id: string;
  device_label: string | null;
  created_at: string;
  last_used_at: string | null;
}

export function PasskeySettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [supported, setSupported] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("user_passkeys")
      .select("id, device_label, created_at, last_used_at")
      .order("created_at", { ascending: false });
    setPasskeys((data || []) as Passkey[]);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const ok = passkeysSupported() && (await platformAuthenticatorAvailable());
      setSupported(ok);
    })();
    load();
  }, []);

  const handleEnroll = async () => {
    setEnrolling(true);
    haptics.tap();
    try {
      await enrollPasskey();
      toast({ title: t("passkeyEnrolled") });
      await load();
    } catch (e: any) {
      toast({
        title: t("passkeyEnrollFailed"),
        description: e?.message,
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemove = async (id: string) => {
    haptics.tap();
    const { error } = await supabase.from("user_passkeys").delete().eq("id", id);
    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
      return;
    }
    setPasskeys((p) => p.filter((k) => k.id !== id));
  };

  if (!supported) return null;

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold">{t("securityTitle")}</h3>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">{t("yourPasskeys")}</p>
        {loading ? (
          <div className="text-xs text-muted-foreground">…</div>
        ) : passkeys.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noPasskeys")}</p>
        ) : (
          <ul className="space-y-2">
            {passkeys.map((k) => (
              <li
                key={k.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {k.device_label || "Device"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("enrolledOn")}: {new Date(k.created_at).toLocaleDateString()}
                      {k.last_used_at &&
                        ` · ${t("lastUsed")}: ${new Date(k.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(k.id)}
                  className="h-8 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        onClick={handleEnroll}
        disabled={enrolling || passkeys.length >= 5}
        className="w-full h-11"
        variant="outline"
      >
        {enrolling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Fingerprint className="h-4 w-4 mr-2" />
            {t("addThisDevice")}
          </>
        )}
      </Button>
    </Card>
  );
}
