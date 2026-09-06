import { useEffect, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { SetBirthDateDialog } from "@/components/coach/SetBirthDateDialog";

interface Row {
  user_id: string;
  display_name: string | null;
}

/**
 * Coach-facing reminder: lists club athletes with no date of birth so the
 * coach can fill each one in without leaving the dashboard.
 */
export function MissingBirthDatesCard() {
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!activeClubId) { setRows([]); return; }
      const { data, error } = await supabase.rpc("get_club_member_profiles", {
        _club_id: activeClubId,
      });
      if (cancelled) return;
      if (error) {
        console.error("[MissingBirthDatesCard] load failed:", error.message);
        setRows([]);
        return;
      }
      const missing = ((data as any[]) || [])
        .filter((m) => !m.is_coach && !m.birth_date)
        .map((m) => ({ user_id: m.user_id, display_name: m.display_name }));
      setRows(missing);
      setOpen(missing.length <= 3);
    })();
    return () => { cancelled = true; };
  }, [activeClubId]);

  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 text-left"
      >
        <CalendarDays className="h-5 w-5 text-primary shrink-0" />
        <h3 className="text-sm font-semibold text-foreground flex-1 min-w-0">
          {t("missingBdTitle")}{" "}
          <Badge variant="secondary" className="ml-1 align-middle">{rows.length}</Badge>
        </h3>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <>
          <p className="text-xs text-muted-foreground mt-2 mb-3 pl-8">
            {t("missingBdDesc")}
          </p>
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.user_id}
                className="rounded-lg border border-border bg-card p-3 flex items-center gap-2"
              >
                <span className="text-sm font-medium truncate flex-1 min-w-0">
                  {r.display_name || "—"}
                </span>
                <SetBirthDateDialog
                  athleteId={r.user_id}
                  athleteName={r.display_name}
                  clubId={activeClubId}
                  onSaved={() =>
                    setRows((rs) => rs.filter((x) => x.user_id !== r.user_id))
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
