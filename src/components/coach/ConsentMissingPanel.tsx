import { useEffect, useState } from "react";
import { ShieldAlert, Mail, Bell, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { toast } from "sonner";

interface MissingRow {
  athlete_id: string;
  display_name: string;
  status: "pending" | "withdrawn" | "none" | string;
  grace_until: string | null;
  parent_email_on_token: string | null;
}

export function ConsentMissingPanel() {
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const [rows, setRows] = useState<MissingRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [reminding, setReminding] = useState(false);
  const [expanded, setExpanded] = useState<boolean | null>(null);

  async function load() {
    const { data, error } = await supabase.functions.invoke("consent-coach-actions", {
      body: { action: "list_missing", ...(activeClubId ? { club_id: activeClubId } : {}) },
    });
    if (error) {
      console.error("[ConsentMissingPanel] list_missing failed:", error);
      const msg = (error as any)?.message || (error as any)?.error || String(error);
      setLoadError(msg);
      setRows([]);
      return;
    }
    if ((data as any)?.error) {
      console.error("[ConsentMissingPanel] list_missing returned error:", (data as any).error);
      setLoadError(String((data as any).error));
      setRows([]);
      return;
    }
    setLoadError(null);
    const list = (data?.missing as MissingRow[]) || [];
    setRows(list);
    setExpanded((prev) => (prev === null ? list.length <= 3 : prev));
  }

  useEffect(() => { load(); }, []);

  if (loadError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-destructive">{t("consentLoadFailed")}</h3>
            <p className="text-xs text-destructive/80 mt-1 break-words">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) return null;

  const statusLabel = (s: string) => {
    if (s === "pending") return t("consentStatusPending");
    if (s === "granted") return t("consentStatusGranted");
    if (s === "withdrawn") return t("consentStatusWithdrawn");
    return t("consentStatusNone");
  };

  async function sendForAthlete(row: MissingRow) {
    const email = (drafts[row.athlete_id] || row.parent_email_on_token || "").trim();
    if (!email) return;
    setSendingId(row.athlete_id);
    const { data, error } = await supabase.functions.invoke("consent-coach-actions", {
      body: { action: "send_parent_request", athlete_id: row.athlete_id, parent_email: email },
    });
    setSendingId(null);
    if (error || !(data as any)?.ok || !(data as any)?.queued) {
      toast.error(t("consentParentRequestFailed"));
      return;
    }
    toast.success(t("consentParentRequestSent"));
    setDrafts((d) => ({ ...d, [row.athlete_id]: "" }));
    load();
  }

  async function remindMe() {
    setReminding(true);
    const { data, error } = await supabase.functions.invoke("consent-coach-actions", {
      body: { action: "remind_me" },
    });
    setReminding(false);
    if (error || !(data as any)?.ok) {
      toast.error(t("consentReminderFailed"));
      return;
    }
    toast.success(t("consentReminderSent"));
  }

  const isOpen = expanded ?? false;

  return (
    <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
      <button
        type="button"
        onClick={() => setExpanded(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 text-left"
      >
        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex-1 min-w-0">
          {t("consentMissingPanelTitle")}{" "}
          <Badge variant="secondary" className="ml-1 align-middle">{rows.length}</Badge>
        </h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-700 dark:text-amber-300 shrink-0" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="flex items-start justify-between gap-3 flex-wrap mt-3 mb-3 pl-8">
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 flex-1 min-w-0">
              {t("consentMissingPanelDesc")}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); remindMe(); }}
              disabled={reminding}
              className="h-8"
            >
              <Bell className="h-3.5 w-3.5 mr-1" />
              {t("consentRemindMeBtn")}
            </Button>
          </div>

          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.athlete_id}
                className="rounded-lg border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{row.display_name}</div>
                  <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2">
                    <span>{statusLabel(row.status)}</span>
                    {row.parent_email_on_token && (
                      <span className="truncate">
                        {t("consentLastSentTo")} {row.parent_email_on_token}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder={t("parentEmailPlaceholder")}
                    value={drafts[row.athlete_id] ?? row.parent_email_on_token ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.athlete_id]: e.target.value }))
                    }
                    className="h-9 text-sm sm:w-64"
                  />
                  <Button
                    size="sm"
                    onClick={() => sendForAthlete(row)}
                    disabled={sendingId === row.athlete_id}
                    className="h-9 whitespace-nowrap"
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    {sendingId === row.athlete_id
                      ? t("consentSendingParent")
                      : t("consentSendParentBtn")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
