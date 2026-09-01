import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { AlertTriangle, MessageCircle, ShieldAlert, IdCard, UserX, Loader2, ChevronRight } from "lucide-react";

interface Props {
  athletes: { user_id: string; display_name: string }[];
}

interface Row {
  key: string;
  count: number;
  label: string;
  icon: typeof MessageCircle;
  to: string;
}

/** Morning triage: everything a coach must react to today, in one list. */
export function CoachTriage({ athletes }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = athletes.map((a) => a.user_id);
      const today = new Date();
      const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
      const todayStr = today.toISOString().slice(0, 10);
      const weekAgo = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);

      // Unanswered messages
      let unread = 0;
      try {
        const { data } = await supabase.rpc("get_unread_chat_counts");
        unread = ((data as any[]) || []).reduce((s, r) => s + Number(r.unread_count || 0), 0);
      } catch { /* offline — leave at 0 */ }

      let missingConsent = 0;
      let expiring = 0;
      let inactive = 0;

      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, birth_date, guardian_email, gal_license_expires_at, myfightbook_expires_at")
          .in("user_id", ids);

        const { data: links } = await supabase
          .from("parent_athletes")
          .select("athlete_id")
          .in("athlete_id", ids);
        const linked = new Set(((links as any[]) || []).map((l) => l.athlete_id));

        for (const p of ((profs as any[]) || [])) {
          if (p.birth_date) {
            const age = Math.floor((today.getTime() - new Date(p.birth_date).getTime()) / (365.25 * 86400000));
            if (age < 18 && !linked.has(p.user_id)) missingConsent++;
          }
          for (const d of [p.gal_license_expires_at, p.myfightbook_expires_at]) {
            if (d && d >= todayStr && d <= in30) expiring++;
          }
        }

        const { data: recent } = await supabase
          .from("diary_entries")
          .select("user_id")
          .gte("entry_date", weekAgo)
          .in("user_id", ids);
        const active = new Set(((recent as any[]) || []).map((r) => r.user_id));
        inactive = ids.filter((id) => !active.has(id)).length;
      }

      if (cancelled) return;
      setRows([
        { key: "msg", count: unread, label: t("coachTriageUnread"), icon: MessageCircle, to: "/messages" },
        { key: "consent", count: missingConsent, label: t("coachTriageConsent"), icon: ShieldAlert, to: "/coach" },
        { key: "lic", count: expiring, label: t("coachTriageLicense"), icon: IdCard, to: "/library/reports" },
        { key: "inactive", count: inactive, label: t("coachTriageInactive"), icon: UserX, to: "/coach" },
      ]);
    })();
    return () => { cancelled = true; };
  }, [athletes, t]);

  const visible = (rows || []).filter((r) => r.count > 0);
  const total = visible.reduce((s, r) => s + r.count, 0);

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-extrabold uppercase tracking-tight text-card-foreground">
          {t("coachTriageTitle")}
        </h2>
        {rows && total > 0 && (
          <span className="ml-auto text-xs font-bold text-primary">
            {total} {t("coachTriageNeedsYou")}
          </span>
        )}
      </div>

      {!rows ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("coachTriageAllClear")}</p>
      ) : (
        <ul className="space-y-1.5">
          {visible.map(({ key, count, label, icon: Icon, to }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-left hover:border-primary/40 transition-colors"
                style={{ minHeight: 44 }}
              >
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">
                  <span className="font-bold">{count}</span> {label}
                </span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
