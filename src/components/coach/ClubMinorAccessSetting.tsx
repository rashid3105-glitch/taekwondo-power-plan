import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const MINOR_ACCESS_SEEN_KEY = "club_minor_access_seen_v1";

/** Club admin toggle: minors may use the app (no health data) while waiting for parental consent. */
export function ClubMinorAccessSetting({ clubId }: { clubId: string | null }) {
  const { t } = useLanguage();
  const { activeMembership } = useActiveClub();
  const { isAdmin } = useIsAdmin() as any;
  const canEdit = activeMembership?.role_in_club === "admin" || !!isAdmin;
  const [value, setValue] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(MINOR_ACCESS_SEEN_KEY, "1"); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_club_minor_access" as any, { _club_id: clubId } as any);
      if (!cancelled) setValue(error ? false : data === true);
    })();
    return () => { cancelled = true; };
  }, [clubId]);

  if (!clubId) return null;

  const toggle = async (v: boolean) => {
    setSaving(true);
    const { error } = await supabase.rpc("set_club_minor_access" as any, { _club_id: clubId, _enabled: v } as any);
    setSaving(false);
    if (error) { toast.error(t("error")); return; }
    setValue(v);
    toast.success(t("clubMinorAccessSaved"));
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-card-foreground">{t("clubMinorAccessTitle")}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{t("clubMinorAccessDesc")}</div>
        {!canEdit && <div className="text-[11px] text-muted-foreground mt-2 italic">{t("clubMinorAccessOnlyAdmin")}</div>}
      </div>
      <Switch
        checked={!!value}
        disabled={!canEdit || saving || value === null}
        onCheckedChange={toggle}
        aria-label={t("clubMinorAccessTitle")}
      />
    </div>
  );
}
