import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2 } from "lucide-react";

// Must match POLICY_VERSION in supabase/functions/_shared/age.ts — the
// token-based guardian flow stamps the same value.
const POLICY_VERSION = "2026-06-13";
const CONSENT_TYPE = "health_data_processing";

function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_m, k) => vars[k] ?? `{${k}}`);
}

export function ParentConsentCard({
  athleteId,
  athleteName,
  clubId,
}: {
  athleteId: string;
  athleteName: string;
  clubId: string | null;
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<{ id: string; status: string; granted_at: string | null } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("consent_records")
      .select("id, status, granted_at")
      .eq("athlete_id", athleteId)
      .eq("consent_type", CONSENT_TYPE)
      .maybeSingle();
    setRow((data as any) ?? null);
    setLoading(false);
  }, [athleteId]);

  useEffect(() => { load(); }, [load]);

  const write = async (granted: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no session");
      const now = new Date().toISOString();
      const patch = granted
        ? {
            status: "granted",
            granted_at: now,
            withdrawn_at: null,
            granted_by_relation: "parent",
            granted_by_email: user.email ?? null,
            policy_version: POLICY_VERSION,
          }
        : {
            status: "withdrawn",
            withdrawn_at: now,
            granted_at: null,
            granted_by_relation: "parent",
            granted_by_email: user.email ?? null,
          };

      if (row?.id) {
        const { error } = await supabase
          .from("consent_records")
          .update(patch as any)
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("consent_records").insert({
          athlete_id: athleteId,
          consent_type: CONSENT_TYPE,
          club_id: clubId,
          ...patch,
        } as any);
        if (error) throw error;
      }
      toast({ title: granted ? t("parentConsentGrantedToast") : t("parentConsentWithdrawnToast") });
      await load();
    } catch (e: any) {
      toast({ title: t("parentConsentError"), description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  const granted = row?.status === "granted";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm">{t("parentConsentTitle")}</h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {fill(t("parentConsentBody"), { name: athleteName })}
      </p>

      <p className="text-xs text-muted-foreground">
        <Link to="/privacy" className="underline">{t("privacyConsentPolicyLink")}</Link>
      </p>

      {granted ? (
        <div className="space-y-3">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            {t("parentConsentGrantedState")}
            {row?.granted_at ? ` · ${new Date(row.granted_at).toLocaleDateString()}` : ""}
          </div>
          <Button variant="outline" className="w-full" disabled={saving} onClick={() => write(false)}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("parentConsentWithdrawBtn")}
          </Button>
        </div>
      ) : (
        <Button className="w-full" disabled={saving} onClick={() => write(true)}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("parentConsentGrantBtn")}
        </Button>
      )}
    </Card>
  );
}
