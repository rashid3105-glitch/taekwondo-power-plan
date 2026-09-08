import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, UserPlus, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  sendPasswordResetEmail,
  resendConfirmationEmail,
  logAdminUserAction,
} from "@/lib/adminUserActions";

type LeadRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  club_name: string | null;
  license_active: boolean | null;
  role: string;
  discipline: string | null;
  athlete_band: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  recovery_sent_at: string | null;
  confirmation_sent_at: string | null;
  wants_demo: boolean;
  lead_status: string;
  lead_note: string | null;
  lead_status_updated_at: string | null;
};

const STATUSES = ["new", "contacted", "declined", "won"] as const;
const STATUS_ORDER: Record<string, number> = { new: 0, contacted: 1, won: 2, declined: 3 };

const isTestAccount = (email: string | null) => {
  const e = (email || "").toLowerCase();
  return (
    e.endsWith("@sportstalent.dk") ||
    e.includes("+test") ||
    e.endsWith("@example.com") ||
    e.endsWith(".example.com") ||
    e.endsWith("@system.sportstalent.local")
  );
};

const fmt = (v: string | null) => (v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "—");

export default function AdminLeads() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<LeadRow[]>([]);
  const [never, setNever] = useState<LeadRow[]>([]);
  const [hideTests, setHideTests] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("admin-leads", {
      body: { action: "list" },
    });
    if (error || (data as any)?.error) {
      setError(t("adminLeadsLoadError"));
    } else {
      setDemo(((data as any).demo_signups ?? []) as LeadRow[]);
      setNever(((data as any).never_signed_in ?? []) as LeadRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const statusLabel = (v: string) => t(`adminLeadStatus_${v || "new"}`);

  const demoRows = useMemo(
    () =>
      demo
        .filter((r) => (hideTests ? !isTestAccount(r.email) : true))
        .filter((r) => (statusFilter === "all" ? true : (r.lead_status || "new") === statusFilter))
        .sort((a, b) => {
          const d =
            (STATUS_ORDER[a.lead_status || "new"] ?? 0) - (STATUS_ORDER[b.lead_status || "new"] ?? 0);
          if (d !== 0) return d;
          const s = Number(Boolean(a.last_sign_in_at)) - Number(Boolean(b.last_sign_in_at));
          if (s !== 0) return s;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [demo, hideTests, statusFilter],
  );

  const neverRows = useMemo(
    () =>
      never
        .filter((r) => (hideTests ? !isTestAccount(r.email) : true))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [never, hideTests],
  );

  const newCount = demo.filter(
    (r) => !isTestAccount(r.email) && (r.lead_status || "new") === "new",
  ).length;

  const setStatus = async (row: LeadRow, status: string) => {
    setBusy(row.user_id);
    const note = noteDrafts[row.user_id] ?? row.lead_note ?? "";
    const { data, error } = await supabase.functions.invoke("admin-leads", {
      body: { action: "set_status", user_id: row.user_id, status, note },
    });
    setBusy(null);
    if (error || (data as any)?.error) {
      toast.error(t("adminLeadsSaveError"));
      return;
    }
    const patch = (r: LeadRow) =>
      r.user_id === row.user_id
        ? { ...r, lead_status: status, lead_note: note, lead_status_updated_at: new Date().toISOString() }
        : r;
    setDemo((prev) => prev.map(patch));
    setNever((prev) => prev.map(patch));
    toast.success(t("adminLeadsSaved"));
  };

  const doReset = async (row: LeadRow) => {
    if (!row.email) return;
    setBusy(row.user_id);
    try {
      await sendPasswordResetEmail(row.email);
      await logAdminUserAction(row.user_id, "send_reset", true);
      toast.success(t("adminLeadsResetSent"));
    } catch (e: any) {
      await logAdminUserAction(row.user_id, "send_reset", false);
      toast.error(`${t("adminLeadsResetFailed")}: ${e?.message ?? ""}`);
    } finally {
      setBusy(null);
    }
  };

  const doResend = async (row: LeadRow) => {
    if (!row.email) return;
    setBusy(row.user_id);
    try {
      await resendConfirmationEmail(row.email);
      await logAdminUserAction(row.user_id, "resend_confirmation", true);
      toast.success(t("adminLeadsConfirmSent"));
    } catch (e: any) {
      await logAdminUserAction(row.user_id, "resend_confirmation", false);
      toast.error(`${t("adminLeadsConfirmFailed")}: ${e?.message ?? ""}`);
    } finally {
      setBusy(null);
    }
  };

  const Actions = ({ row }: { row: LeadRow }) => (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {!row.email_confirmed_at && (
        <Button size="sm" variant="outline" disabled={busy === row.user_id} onClick={() => doResend(row)}>
          <Mail className="mr-1.5 h-3.5 w-3.5" /> {t("adminLeadsResendConfirm")}
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={busy === row.user_id} onClick={() => doReset(row)}>
        <KeyRound className="mr-1.5 h-3.5 w-3.5" /> {t("adminLeadsSendReset")}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("back")}
        </Button>

        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t("adminLeads")}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("adminLeadsIntro")}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setHideTests((v) => !v)}>
            {hideTests ? t("adminLeadsShowTests") : t("adminLeadsHideTests")}
          </Button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value="all">{t("adminLeadsAllStatuses")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            {newCount} {t("adminLeadsNewBadge")}
          </Badge>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : error ? (
          <p className="mt-6 text-sm text-destructive">{error}</p>
        ) : (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("adminLeadsDemoSection")} ({demoRows.length})
            </h2>
            <div className="mt-3 space-y-3">
              {demoRows.length === 0 && <p className="text-sm text-muted-foreground">{t("adminLeadsEmpty")}</p>}
              {demoRows.map((r) => (
                <div key={r.user_id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{r.display_name || "—"}</span>
                    <span className="text-sm text-muted-foreground">{r.email}</span>
                    {isTestAccount(r.email) && <Badge variant="secondary">TEST</Badge>}
                    <Badge variant="outline">{statusLabel(r.lead_status)}</Badge>
                    {!r.last_sign_in_at && (
                      <Badge variant="outline" className="border-destructive text-destructive">
                        {t("adminLeadsNeverBadge")}
                      </Badge>
                    )}
                    {!r.email_confirmed_at && (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">
                        {t("adminLeadsUnconfirmed")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(r.club_name || "—")} · {t(`adminLeadRole_${r.role}`)} · {t("adminLeadsCreated")} {fmt(r.created_at)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={r.lead_status || "new"}
                      disabled={busy === r.user_id}
                      onChange={(e) => setStatus(r, e.target.value)}
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                    <input
                      value={noteDrafts[r.user_id] ?? r.lead_note ?? ""}
                      onChange={(e) => setNoteDrafts((p) => ({ ...p, [r.user_id]: e.target.value }))}
                      onBlur={() => setStatus(r, r.lead_status || "new")}
                      placeholder={t("adminLeadsNotePlaceholder")}
                      className="h-9 flex-1 min-w-[200px] rounded-md border border-border bg-background px-2 text-sm text-foreground"
                    />
                  </div>
                  <Actions row={r} />
                </div>
              ))}
            </div>

            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("adminLeadsNeverSection")} ({neverRows.length})
            </h2>
            <div className="mt-3 space-y-3">
              {neverRows.length === 0 && <p className="text-sm text-muted-foreground">{t("adminLeadsEmpty")}</p>}
              {neverRows.map((r) => (
                <div key={r.user_id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{r.display_name || "—"}</span>
                    <span className="text-sm text-muted-foreground">{r.email}</span>
                    {isTestAccount(r.email) && <Badge variant="secondary">TEST</Badge>}
                    {!r.email_confirmed_at && (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">
                        {t("adminLeadsUnconfirmed")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {(r.club_name || "—")} · {t(`adminLeadRole_${r.role}`)} · {t("adminLeadsCreated")} {fmt(r.created_at)} ·{" "}
                    {t("adminLeadsConfirmedAt")} {fmt(r.email_confirmed_at)} · {t("adminLeadsRecoveryAt")} {fmt(r.recovery_sent_at)}
                  </div>
                  <Actions row={r} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
