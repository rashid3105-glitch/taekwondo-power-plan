import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Building, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

import { Switch } from "@/components/ui/switch";

interface Club {
  id: string;
  name: string;
  max_athletes: number;
  share_coach_notes: boolean;
  license_active: boolean;
}

export default function AdminClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubMax, setNewClubMax] = useState(5);
  const [creating, setCreating] = useState(false);
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
      .select("id, name, max_athletes, share_coach_notes, license_active")
      .order("name");

    if (error) {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    } else {
      setClubs((data as unknown as Club[]) ?? []);
    }
    setLoading(false);
  };

  const updateClubMaxAthletes = async (clubId: string, newMax: number) => {
    try {
      const { error } = await supabase.from("clubs" as any).update({ max_athletes: newMax } as any).eq("id", clubId);
      if (error) throw error;
      toast({ title: t("clubUpdated") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    }
  };

  const updateShareCoachNotes = async (clubId: string, value: boolean) => {
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, share_coach_notes: value } : c));
    try {
      const { error } = await supabase.from("clubs" as any).update({ share_coach_notes: value } as any).eq("id", clubId);
      if (error) throw error;
      toast({ title: t("clubUpdated") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
      // revert
      setClubs(prev => prev.map(c => c.id === clubId ? { ...c, share_coach_notes: !value } : c));
    }
  };

  const updateLicenseActive = async (clubId: string, value: boolean) => {
    setClubs(prev => prev.map(c => c.id === clubId ? { ...c, license_active: value } : c));
    try {
      const { error } = await supabase.from("clubs" as any).update({ license_active: value } as any).eq("id", clubId);
      if (error) throw error;
      toast({ title: t("clubUpdated") });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
      setClubs(prev => prev.map(c => c.id === clubId ? { ...c, license_active: !value } : c));
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
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/approval")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clubs.map(club => (
            <div key={club.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
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
                        setClubs(prev => prev.map(c => c.id === club.id ? { ...c, max_athletes: val } : c));
                      }
                    }}
                    onBlur={() => updateClubMaxAthletes(club.id, club.max_athletes)}
                    className="w-16 h-8 text-xs text-center"
                  />
                </div>
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-card-foreground">{t("shareCoachNotes")}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("shareCoachNotesHint")}</div>
                </div>
                <Switch
                  checked={!!club.share_coach_notes}
                  onCheckedChange={(v) => updateShareCoachNotes(club.id, v)}
                />
              </div>
            </div>
          ))}
        </div>

        {clubs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No clubs found.</p>
        )}
      </div>
    </div>
  );
}
