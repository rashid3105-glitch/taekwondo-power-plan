import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trophy, Save, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { SPORT_ORDER, SPORT_PROFILES, getSportProfile, type SportSlug } from "@/config/sportProfiles";

interface ClubRow {
  id: string;
  name: string;
  sport: string | null;
}

export default function AdminSportPreview() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [sport, setSport] = useState<SportSlug>("taekwondo");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
      const { data } = await supabase.from("clubs" as any).select("id, name, sport").order("name");
      const list = (data as unknown as ClubRow[]) ?? [];
      setClubs(list);
      if (list.length) {
        setSelectedClub(list[0].id);
        setSport(getSportProfile(list[0].sport).slug);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const profile = useMemo(() => SPORT_PROFILES[sport], [sport]);

  const onSelectClub = (id: string) => {
    setSelectedClub(id);
    const club = clubs.find(c => c.id === id);
    setSport(getSportProfile(club?.sport).slug);
  };

  const save = async () => {
    if (!selectedClub) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("clubs" as any).update({ sport } as any).eq("id", selectedClub);
      if (error) throw error;
      setClubs(prev => prev.map(c => c.id === selectedClub ? { ...c, sport } : c));
      toast({ title: t("saved") || "Gemt" });
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
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
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/clubs")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("backToDashboard")}
        </Button>

        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Sportsgren (preview)
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            Preview af den sport-agnostiske model. Valget gemmes på klubben, men påvirker
            endnu ikke resten af appen — alt kører uændret på taekwondo-opsætningen.
          </p>
        </div>

        {/* Club selector */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Klub</label>
          <select
            value={selectedClub}
            onChange={(e) => onSelectClub(e.target.value)}
            className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {clubs.length === 0 && <p className="text-sm text-muted-foreground">Ingen klubber fundet.</p>}
        </div>

        {/* Sport picker */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vælg sportsgren</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SPORT_ORDER.map(slug => {
              const active = slug === sport;
              return (
                <button
                  key={slug}
                  onClick={() => setSport(slug)}
                  className={`rounded-lg border-2 p-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {SPORT_PROFILES[slug].name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live profile preview */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Sportsprofil: {profile.name}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gradsystem</div>
              <div className="text-sm font-medium text-foreground">{profile.gradeLabel}</div>
              <div className="flex flex-wrap gap-1">
                {profile.grades.slice(0, 6).map(g => (
                  <span key={g} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">{g}</span>
                ))}
                {profile.grades.length > 6 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    +{profile.grades.length - 6}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Konkurrenceformater</div>
              <div className="text-sm text-foreground">
                {profile.competitionFormats.length ? profile.competitionFormats.join(" · ") : "Ingen (træningsfokus)"}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground pt-2">Kampanalyse</div>
              <div className="text-sm text-foreground">{profile.hasMatchAnalysis ? "Aktiveret" : "Skjult"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {profile.skillLabel} ({profile.skillGroups.reduce((n, g) => n + g.skills.length, 0)})
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.skillGroups.map(group => (
                <div key={group.group} className="rounded-md border border-border bg-card p-2.5">
                  <div className="text-xs font-semibold text-foreground mb-1">{group.group}</div>
                  <div className="flex flex-wrap gap-1">
                    {group.skills.map(s => (
                      <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Testbatteri</div>
            <div className="text-sm text-foreground">{profile.testBattery.join(", ")}</div>
          </div>

          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Sådan ser atletprofilen ud</div>
            <div className="text-sm text-foreground">{profile.gradeLabel}: <span className="text-primary font-semibold">{profile.grades[Math.floor(profile.grades.length / 2)]}</span></div>
            <div className="text-sm text-foreground">Ugens fokus: <span className="text-primary font-semibold">{profile.skillGroups[0]?.skills[0]}</span></div>
            <div className="text-sm text-foreground">Sessionstype: <span className="text-primary font-semibold">{profile.sessionLabel}</span></div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || !selectedClub}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {t("save") || "Gem"}
          </Button>
        </div>
      </div>
    </div>
  );
}
