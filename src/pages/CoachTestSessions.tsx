// Coach page: list of team test sessions + create wizard entry point.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowLeft, ClipboardList, CheckCircle2, Users, Trash2 } from "lucide-react";
import { TeamSessionWizard, type CoachAthlete } from "@/components/testing/TeamSessionWizard";
import {
  createTeamTestSession,
  listSessionsForClub,
  deleteSession,
  type TeamTestSession,
} from "@/lib/teamTestSessionApi";

export default function CoachTestSessions() {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { activeClubId } = useActiveClub();

  const [athletes, setAthletes] = useState<CoachAthlete[]>([]);
  const [sessions, setSessions] = useState<TeamTestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeClubId]);

  async function load() {
    if (!activeClubId) { setSessions([]); setAthletes([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [members, list] = await Promise.all([
        supabase.rpc("get_club_member_profiles" as any, { _club_id: activeClubId }),
        listSessionsForClub(activeClubId),
      ]);
      const me = (await supabase.auth.getUser()).data.user?.id;
      const roster: CoachAthlete[] = (((members.data as any[]) ?? [])
        .filter((m) => m.user_id !== me && m.is_coach !== true)
        .map((m) => ({ athlete_id: m.user_id, display_name: m.display_name ?? "" }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setAthletes(roster);
      setSessions(list);
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(input: Parameters<typeof createTeamTestSession>[0] extends infer T ? any : never) {
    if (!activeClubId || !userId) return;
    try {
      const id = await createTeamTestSession({
        club_id: activeClubId,
        coach_id: userId,
        name: input.name,
        session_date: input.session_date,
        entry_mode: input.entry_mode,
        focus_areas: input.focus_areas,
        notes: input.notes,
        tests: input.tests,
        athlete_ids: input.athlete_ids,
      });
      setWizardOpen(false);
      navigate(`/coach/testing/sessions/${id}`);
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("ptSessionDeleteConfirm"))) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message, variant: "destructive" });
    }
  }

  const inProgress = useMemo(() => sessions.filter((s) => s.status === "in_progress"), [sessions]);
  const completed = useMemo(() => sessions.filter((s) => s.status === "completed"), [sessions]);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 pb-24">
      <div className="flex items-center gap-2">
        <Link to="/coach" className="text-muted-foreground hover:text-foreground p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t("ptTeamSessions")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("ptTeamSessionsSubtitle")}</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-1.5" disabled={!activeClubId || athletes.length === 0}>
          <Plus className="h-4 w-4" /> {t("ptWizCreateSession")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <Section title={t("ptSessionsInProgress")} items={inProgress} navigate={navigate} onDelete={handleDelete} locale={locale} t={t} />
          <Section title={t("ptSessionsCompleted")} items={completed} navigate={navigate} onDelete={handleDelete} locale={locale} t={t} />
          {sessions.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {t("ptNoSessionsYet")}
            </div>
          )}
        </div>
      )}

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-lg p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <DialogTitle>{t("ptWizCreateSession")}</DialogTitle>
          <TeamSessionWizard
            athletes={athletes}
            onCancel={() => setWizardOpen(false)}
            onCreate={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title, items, navigate, onDelete, locale, t,
}: {
  title: string;
  items: TeamTestSession[];
  navigate: ReturnType<typeof useNavigate>;
  onDelete: (id: string) => void;
  locale: string;
  t: (k: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id}
            className="rounded-xl border border-border bg-card p-3 sm:p-4 flex items-center gap-3 hover:border-primary/40 transition-colors">
            <button
              type="button"
              onClick={() => navigate(`/coach/testing/sessions/${s.id}`)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="text-sm font-bold text-card-foreground truncate">{s.name}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                <span>{new Date(s.session_date).toLocaleDateString(locale)}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {t("ptWizAthletes")}</span>
                {s.status === "completed" && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />{t("ptSessionCompleted")}
                  </Badge>
                )}
                {s.focus_areas.length > 0 && (
                  <span className="text-[10px]">{s.focus_areas.slice(0, 3).map((f) => t(`ptCat_${f}`)).join(" · ")}</span>
                )}
              </div>
            </button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)} aria-label={t("delete")}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
