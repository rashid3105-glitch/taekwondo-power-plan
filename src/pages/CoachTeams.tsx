import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Check, X, ChevronUp, ChevronDown, Users, Search, Trash2, Info, Loader2 } from "lucide-react";
import { useActiveClub } from "@/contexts/ActiveClubContext";
import { ClubSwitcher } from "@/components/ClubSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRole } from "@/contexts/RoleContext";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClubTeam, listClubTeams, listTeamMembers, createClubTeam,
  updateClubTeam, addTeamMember, removeTeamMember, deleteClubTeam,
} from "@/lib/clubTeams";

interface MemberOption { id: string; name: string; }


export default function CoachTeams() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const { hasCoachRole, loading: roleLoading } = useRole();

  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<ClubTeam[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [clubMembers, setClubMembers] = useState<MemberOption[]>([]);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [openTeam, setOpenTeam] = useState<ClubTeam | null>(null);
  const [openTeamMembers, setOpenTeamMembers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubTeam | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------- role gating --------
  useEffect(() => {
    if (roleLoading) return;
    if (!hasCoachRole) {
      toast.error(t("clubTeamsCoachOnly"));
      navigate("/dashboard", { replace: true });
    }
  }, [roleLoading, hasCoachRole, navigate, t]);


  // -------- boot --------
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      let cid = activeClubId;
      if (!cid) {
        const { data: profile } = await supabase
          .from("profiles").select("club_id").eq("user_id", user.id).maybeSingle();
        cid = ((profile as any)?.club_id ?? null) as string | null;
      }
      setClubId(cid);
      if (!cid) { setLoading(false); return; }

      await Promise.all([loadTeams(cid), loadClubMembers(cid)]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClubId]);

  const loadTeams = async (cid: string) => {
    try {
      const list = await listClubTeams(cid);
      setTeams(list);
      const rows = await listTeamMembers(list.map((x) => x.id));
      const c: Record<string, number> = {};
      rows.forEach((r) => { c[r.team_id] = (c[r.team_id] ?? 0) + 1; });
      setCounts(c);
    } catch {
      toast.error(t("clubTeamsLoadError"));
    }
  };

  const loadClubMembers = async (cid: string) => {
    const { data: memberships } = await supabase
      .from("club_memberships")
      .select("user_id")
      .eq("club_id", cid)
      .eq("status", "active");
    const ids = Array.from(new Set(((memberships as any[]) ?? []).map((m) => m.user_id)));
    if (ids.length === 0) { setClubMembers([]); return; }
    const { data: profs } = await supabase
      .from("profiles").select("user_id, display_name").in("user_id", ids);
    setClubMembers(
      ((profs as any[]) ?? [])
        .map((p) => ({ id: p.user_id, name: p.display_name || "—" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  // -------- mutations --------
  const handleCreate = async () => {
    if (!clubId || !newName.trim()) return;
    setCreating(true);
    try {
      const maxOrder = teams.reduce((m, x) => Math.max(m, x.sort_order), 0);
      await createClubTeam(clubId, newName, newDesc, maxOrder + 10);
      setNewName(""); setNewDesc("");
      await loadTeams(clubId);
      toast.success(t("clubTeamCreated"));
    } catch (e: any) {
      toast.error(
        String(e?.message ?? "").includes("duplicate") ? t("clubTeamDuplicate") : t("clubTeamSaveError"),
      );
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (team: ClubTeam) => {
    setEditingId(team.id);
    setEditName(team.name);
    setEditDesc(team.description ?? "");
  };

  const saveEdit = async () => {
    if (!editingId || !clubId || !editName.trim()) return;
    try {
      await updateClubTeam(editingId, { name: editName.trim(), description: editDesc.trim() || null });
      setEditingId(null);
      await loadTeams(clubId);
      toast.success(t("clubTeamSaved"));
    } catch (e: any) {
      toast.error(
        String(e?.message ?? "").includes("duplicate") ? t("clubTeamDuplicate") : t("clubTeamSaveError"),
      );
    }
  };

  const toggleActive = async (team: ClubTeam, next: boolean) => {
    if (!clubId) return;
    try {
      await updateClubTeam(team.id, { is_active: next });
      await loadTeams(clubId);
    } catch {
      toast.error(t("clubTeamSaveError"));
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (!clubId || target < 0 || target >= teams.length) return;
    const a = teams[index];
    const b = teams[target];
    try {
      await Promise.all([
        updateClubTeam(a.id, { sort_order: b.sort_order }),
        updateClubTeam(b.id, { sort_order: a.sort_order }),
      ]);
      await loadTeams(clubId);
    } catch {
      toast.error(t("clubTeamSaveError"));
    }
  };

  const openMembers = async (team: ClubTeam) => {
    setOpenTeam(team);
    setSearch("");
    const rows = await listTeamMembers([team.id]);
    setOpenTeamMembers(new Set(rows.map((r) => r.user_id)));
  };

  const toggleMember = async (userId: string, next: boolean) => {
    if (!openTeam || !clubId) return;
    setBusyUser(userId);
    try {
      if (next) await addTeamMember(openTeam.id, userId);
      else await removeTeamMember(openTeam.id, userId);
      setOpenTeamMembers((prev) => {
        const c = new Set(prev);
        if (next) c.add(userId); else c.delete(userId);
        return c;
      });
      setCounts((prev) => ({ ...prev, [openTeam.id]: (prev[openTeam.id] ?? 0) + (next ? 1 : -1) }));
    } catch {
      toast.error(t("clubTeamMemberError"));
    } finally {
      setBusyUser(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clubMembers;
    return clubMembers.filter((m) => m.name.toLowerCase().includes(q));
  }, [clubMembers, search]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label={t("back")} className="p-1 -ml-1 text-white/70 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-heading flex-1">{t("clubTeamsTitle")}</h1>
        <ClubSwitcher />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-white/60">{t("clubTeamsSubtitle")}</p>

        {!loading && !clubId && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60 text-sm">
            {t("clubTeamsNoClub")}
          </div>
        )}

        {clubId && (
          <>
            {/* Create */}
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/60">{t("clubTeamNew")}</h2>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("clubTeamNamePlaceholder")}
                className="bg-white/[0.04] border-white/15 text-white"
              />
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t("clubTeamDescriptionPlaceholder")}
                className="bg-white/[0.04] border-white/15 text-white"
              />
              <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full gap-2">
                <Plus className="h-4 w-4" /> {t("clubTeamCreate")}
              </Button>
            </section>

            {/* List */}
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white/10 animate-pulse rounded-xl" />)}
              </div>
            ) : teams.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-white/60 text-sm">
                {t("clubTeamsEmpty")}
              </div>
            ) : (
              <ul className="space-y-3">
                {teams.map((team, i) => (
                  <li key={team.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    {editingId === team.id ? (
                      <div className="space-y-2">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="bg-white/[0.04] border-white/15 text-white" />
                        <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                          placeholder={t("clubTeamDescriptionPlaceholder")}
                          className="bg-white/[0.04] border-white/15 text-white" />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} className="gap-1"><Check className="h-4 w-4" /> {t("save")}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="gap-1 text-white/70">
                            <X className="h-4 w-4" /> {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold truncate ${team.is_active ? "text-white" : "text-white/40 line-through"}`}>
                              {team.name}
                            </p>
                            {team.description && <p className="text-xs text-white/50 mt-0.5">{team.description}</p>}
                            <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                              <Users className="h-3 w-3" /> {counts[team.id] ?? 0} {t("clubTeamMembersLabel")}
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            <button onClick={() => move(i, -1)} disabled={i === 0}
                              aria-label={t("clubTeamMoveUp")} title={t("clubTeamMoveUp")}
                              className="p-1 text-white/60 hover:text-white disabled:opacity-30">
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button onClick={() => move(i, 1)} disabled={i === teams.length - 1}
                              aria-label={t("clubTeamMoveDown")} title={t("clubTeamMoveDown")}
                              className="p-1 text-white/60 hover:text-white disabled:opacity-30">
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Switch checked={team.is_active} onCheckedChange={(v) => toggleActive(team, v)}
                              aria-label={t("clubTeamActive")} />
                            <span className="text-xs text-white/60">{t("clubTeamActive")}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => startEdit(team)}
                              title={t("clubTeamRename")} className="gap-1 text-white/70">
                              <Pencil className="h-4 w-4" /> {t("clubTeamRename")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openMembers(team)}>
                              {t("clubTeamManageMembers")}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* Members dialog */}
      <Dialog open={!!openTeam} onOpenChange={(o) => { if (!o) setOpenTeam(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{openTeam?.name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t("clubTeamSearchAthletes")} className="pl-9" />
          </div>
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {filteredMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("clubTeamNoAthletes")}</p>
            ) : filteredMembers.map((m) => (
              <label key={m.id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                <Checkbox
                  checked={openTeamMembers.has(m.id)}
                  disabled={busyUser === m.id}
                  onCheckedChange={(v) => toggleMember(m.id, v === true)}
                />
                <span className="text-sm">{m.name}</span>
              </label>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
