import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Building, Plus, Save, Trophy, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClubBrandingSection } from "@/components/admin/ClubBrandingSection";


interface Club {
  id: string;
  name: string;
  max_athletes: number;
  share_coach_notes: boolean;
  license_active: boolean;
  deleted_at: string | null;
}

const REACTIVATION_DAYS = 30;

type PendingAction =
  | { kind: "deactivate" | "reactivate" | "delete"; club: Club }
  | null;

export default function AdminClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [originalClubs, setOriginalClubs] = useState<Record<string, Club>>({});
  const [brandingEnabled, setBrandingEnabled] = useState<Record<string, boolean>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [confirmName, setConfirmName] = useState("");
  const [working, setWorking] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubMax, setNewClubMax] = useState(5);
  const [creating, setCreating] = useState(false);
  const [licenseFilter, setLicenseFilter] = useState<"active" | "inactive" | "deactivated" | "all">("active");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!adminCheck) { navigate("/dashboard"); return; }
      setIsAdmin(true);
      await loadClubs();
    };
    init();
  }, [navigate, t, toast]);

  const loadClubs = async () => {
    const { data, error } = await supabase
      .from("clubs" as any)
      .select("id, name, max_athletes, share_coach_notes, license_active, deleted_at")
      .order("name");

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      const list = (data as unknown as Club[]) ?? [];
      setClubs(list);
      const map: Record<string, Club> = {};
      list.forEach(c => { map[c.id] = { ...c }; });
      setOriginalClubs(map);
    }

    const { data: mods } = await supabase
      .from("club_module_defaults" as any)
      .select("club_id, enabled")
      .eq("module", "branding");
    const flags: Record<string, boolean> = {};
    for (const m of ((mods as any) || []) as { club_id: string; enabled: boolean }[]) {
      flags[m.club_id] = m.enabled;
    }
    setBrandingEnabled(flags);

    // How many people are still attached to each club — a club can only be
    // deleted when nobody is left (active membership or profile pointer).
    const [memberRes, profileRes] = await Promise.all([
      supabase.from("club_memberships" as any).select("club_id").eq("status", "active"),
      supabase.from("profiles").select("club_id").not("club_id", "is", null),
    ]);
    const counts: Record<string, number> = {};
    for (const row of (((memberRes.data as any[]) ?? []).concat((profileRes.data as any[]) ?? []))) {
      const id = row.club_id as string | null;
      if (id) counts[id] = (counts[id] ?? 0) + 1;
    }
    setMemberCounts(counts);

    setLoading(false);

  };

  const updateLocal = (clubId: string, patch: Partial<Club>) => {
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, ...patch } : c));
  };

  // Turn raw database errors into something a human can act on.
  const describeError = (err: any): string => {
    const raw = `${err?.code ?? ""} ${err?.message ?? ""}`.toLowerCase();
    if (
      err?.code === "23505" ||
      raw.includes("duplicate key") ||
      raw.includes("clubs_name_key") ||
      raw.includes("clubs_slug_key")
    ) {
      return t("clubNameExists") || "A club with that name already exists";
    }
    if (raw.includes("club_not_empty")) return t("clubDeleteBlockedMembers");
    return err?.message ?? String(err);
  };


  const isDirty = (club: Club) => {
    const orig = originalClubs[club.id];
    if (!orig) return false;
    return orig.max_athletes !== club.max_athletes
      || orig.share_coach_notes !== club.share_coach_notes
      || orig.license_active !== club.license_active;
  };

  const saveClub = async (club: Club) => {
    setSavingId(club.id);
    try {
      const { error } = await supabase
        .from("clubs" as any)
        .update({
          max_athletes: club.max_athletes,
          share_coach_notes: club.share_coach_notes,
          license_active: club.license_active,
        } as any)
        .eq("id", club.id);
      if (error) throw error;
      setOriginalClubs(prev => ({ ...prev, [club.id]: { ...club } }));
      toast({ title: t("clubUpdated") });
    } catch (err: any) {
      toast({ title: t("error"), description: describeError(err), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const createClub = async () => {
    const name = newClubName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase.from("clubs" as any).insert({ name, slug, max_athletes: newClubMax } as any);
      if (error) throw error;
      toast({ title: t("clubCreated") || "Club created" });
      setNewClubName("");
      setNewClubMax(5);
      await loadClubs();
    } catch (err: any) {
      toast({ title: t("error"), description: describeError(err), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deletableFrom = (club: Club): Date | null => {
    if (!club.deleted_at) return null;
    const d = new Date(club.deleted_at);
    d.setDate(d.getDate() + REACTIVATION_DAYS);
    return d;
  };

  const fmtDate = (d: Date | string) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  // Club logo and other club files live under a `<clubId>/` prefix in storage,
  // which SQL cannot touch — clean it up right after the row is gone.
  const removeClubFiles = async (clubId: string) => {
    try {
      const { data } = await supabase.storage.from("club-logos").list(clubId);
      const paths = ((data as any[]) ?? []).map((f) => `${clubId}/${f.name}`);
      if (paths.length > 0) await supabase.storage.from("club-logos").remove(paths);
    } catch {
      // Files left behind are harmless; the club data itself is deleted.
    }
  };

  const runPending = async () => {
    if (!pending) return;
    const { kind, club } = pending;
    setWorking(true);
    try {
      if (kind === "deactivate") {
        const { error } = await supabase.rpc("admin_deactivate_club" as any, { _club_id: club.id } as any);
        if (error) throw error;
        toast({ title: t("clubDeactivatedToast") });
      } else if (kind === "reactivate") {
        const { error } = await supabase.rpc("admin_reactivate_club" as any, { _club_id: club.id } as any);
        if (error) throw error;
        toast({ title: t("clubReactivatedToast") });
      } else {
        const { error } = await supabase.rpc("admin_delete_club" as any, { _club_id: club.id } as any);
        if (error) throw error;
        await removeClubFiles(club.id);
        toast({ title: t("clubDeletedToast") });
      }
      setPending(null);
      setConfirmName("");
      await loadClubs();
    } catch (err: any) {
      toast({ title: t("error"), description: describeError(err), variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const liveClubs = clubs.filter(c => !c.deleted_at);
  const activeCount = liveClubs.filter(c => c.license_active === true).length;
  const inactiveCount = liveClubs.length - activeCount;
  const deactivatedCount = clubs.filter(c => !!c.deleted_at).length;
  const visibleClubs =
    licenseFilter === "all"
      ? clubs
      : licenseFilter === "deactivated"
        ? clubs.filter(c => !!c.deleted_at)
        : liveClubs.filter(c => (c.license_active === true) === (licenseFilter === "active"));

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/approval")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/sport-preview")}>
            <Trophy className="h-4 w-4 mr-1" /> Sportsgren (preview)
          </Button>
        </div>

        <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
          <Building className="h-5 w-5" /> {t("clubManagement")}
        </h1>

        {/* Create new club */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{t("addClub") || "Add new club"}</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={t("clubName") || "Club name"}
              value={newClubName}
              onChange={(e) => setNewClubName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && createClub()}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">{t("maxAthletes")}:</span>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={newClubMax}
                onChange={(e) => setNewClubMax(parseInt(e.target.value) || 5)}
                className="w-16 h-10 text-xs text-center"
              />
              <Button size="sm" onClick={createClub} disabled={creating || !newClubName.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                {t("add") || "Add"}
              </Button>
            </div>
          </div>
        </div>

        {/* Unlicensed clubs are never hidden — they are the sales pipeline. */}
        <Select value={licenseFilter} onValueChange={(v) => setLicenseFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t("licenseFilterActive")} ({activeCount})</SelectItem>
            <SelectItem value="inactive">{t("licenseFilterInactive")} ({inactiveCount})</SelectItem>
            <SelectItem value="deactivated">{t("licenseFilterDeactivated")} ({deactivatedCount})</SelectItem>
            <SelectItem value="all">{t("licenseFilterAll")} ({clubs.length})</SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleClubs.map(club => {
            const dirty = isDirty(club);
            const saving = savingId === club.id;
            const deactivated = !!club.deleted_at;
            const members = memberCounts[club.id] ?? 0;
            const from = deletableFrom(club);
            const ready = !!from && from.getTime() <= Date.now();
            return (
            <div key={club.id} className={`rounded-lg border p-4 space-y-3 ${deactivated ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-card-foreground truncate">{club.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t("maxAthletes")}:</span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={club.max_athletes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        updateLocal(club.id, { max_athletes: val });
                      }
                    }}
                    className="w-16 h-8 text-xs text-center"
                    disabled={deactivated}
                  />
                </div>
              </div>

              {deactivated && (
                <div className="rounded-md border border-destructive/30 bg-background/60 px-3 py-2 space-y-1">
                  <div className="text-[11px] font-semibold text-destructive">
                    {t("clubDeactivatedBadge")}{ready ? ` · ${t("clubReadyForDeletion")}` : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t("clubDeactivatedSince")} {fmtDate(club.deleted_at as string)}
                    {from ? ` · ${t("clubDeletableFrom")} ${fmtDate(from)}` : ""}
                  </div>
                  {members > 0 && (
                    <div className="text-[10px] text-muted-foreground">{t("clubDeleteBlockedMembers")}</div>
                  )}
                </div>
              )}

              <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-card-foreground">{t("shareCoachNotes")}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("shareCoachNotesHint")}</div>
                </div>
                <Switch
                  checked={!!club.share_coach_notes}
                  onCheckedChange={(v) => updateLocal(club.id, { share_coach_notes: v })}
                  disabled={deactivated}
                />
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-card-foreground">{t("clubLicenseActive")}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("clubLicenseActiveHint")}</div>
                </div>
                <Switch
                  checked={!!club.license_active}
                  onCheckedChange={(v) => updateLocal(club.id, { license_active: v })}
                  disabled={deactivated}
                />
              </div>
              {!deactivated && (
                <ClubBrandingSection
                  clubId={club.id}
                  clubName={club.name}
                  enabled={!!brandingEnabled[club.id]}
                />
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                {deactivated ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPending({ kind: "reactivate", club })}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      {t("clubReactivate")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={members > 0}
                      onClick={() => { setConfirmName(""); setPending({ kind: "delete", club }); }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("clubDeletePermanently")}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPending({ kind: "deactivate", club })}
                  >
                    <PauseCircle className="h-4 w-4 mr-1" />
                    {t("clubDeactivate")}
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={() => saveClub(club)}
                  disabled={!dirty || saving || deactivated}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {t("save") || "Save"}
                </Button>
              </div>
            </div>
            );
          })}
        </div>

        {visibleClubs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No clubs found.</p>
        )}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o && !working) { setPending(null); setConfirmName(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === "delete"
                ? t("clubDeleteConfirmTitle")
                : pending?.kind === "reactivate"
                  ? t("clubReactivateConfirmTitle")
                  : t("clubDeactivateConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.club.name}
              {" — "}
              {pending?.kind === "delete"
                ? t("clubDeleteConfirmDesc")
                : pending?.kind === "reactivate"
                  ? t("clubReactivateConfirmDesc")
                  : t("clubDeactivateConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pending?.kind === "delete" && (
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={pending.club.name}
              autoFocus
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={working || (pending?.kind === "delete" && confirmName.trim() !== pending.club.name)}
              onClick={(e) => { e.preventDefault(); runPending(); }}
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {pending?.kind === "delete"
                ? t("clubDeletePermanently")
                : pending?.kind === "reactivate"
                  ? t("clubReactivate")
                  : t("clubDeactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
