import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LogOut, Pencil, Download, KeyRound, Trash2, ChevronLeft } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { AppFooter } from "@/components/AppFooter";
import { useLanguage } from "@/i18n/LanguageContext";

interface LicenseField {
  id: string;
  field_name: string;
  sort_order: number;
}

interface LicenseValue {
  value?: string;
  expires_at?: string;
}

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  discipline: string | null;
  club_name: string | null;
  roles: string[] | null;
  birth_date: string | null;
  belt_level: string | null;
  weight_kg: number | null;
  goals: string[] | null;
  license_values: Record<string, LicenseValue> | null;
  email: string | null;
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function calcAge(birth: string | null): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr: string | undefined, locale: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale || "da-DK", { day: "numeric", month: "short", year: "numeric" });
}

export default function Profile() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const [data, setData] = useState<ProfileData | null>(null);
  const [licenseFields, setLicenseFields] = useState<LicenseField[]>([]);
  const [hasCoach, setHasCoach] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, discipline, club_id, coach_club_name, roles, birth_date, belt_level, weight_kg, goals, license_values, clubs:club_id(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: ca } = await supabase
        .from("coach_athletes")
        .select("coach_id")
        .eq("athlete_id", user.id)
        .limit(1)
        .maybeSingle();

      let fields: LicenseField[] = [];
      if (ca?.coach_id) {
        const { data: lf } = await supabase
          .from("coach_license_fields")
          .select("id, field_name, sort_order")
          .eq("coach_id", ca.coach_id)
          .order("sort_order", { ascending: true })
          .limit(3);
        fields = lf || [];
      }

      if (!mounted) return;
      const p = prof as any;
      setData({
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        discipline: p?.discipline ?? null,
        club_name: p?.clubs?.name ?? p?.coach_club_name ?? null,
        roles: p?.roles ?? null,
        birth_date: p?.birth_date ?? null,
        belt_level: p?.belt_level ?? null,
        weight_kg: p?.weight_kg ?? null,
        goals: p?.goals ?? null,
        license_values: p?.license_values ?? {},
        email: user.email ?? null,
      });
      setHasCoach(!!ca?.coach_id);
      setLicenseFields(fields);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleExport = async () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const roleLabel = (() => {
    const r = data?.roles || [];
    const hasA = r.includes("athlete");
    const hasC = r.includes("coach");
    if (hasA && hasC) return t("profileRoleBoth" as any);
    if (hasC) return t("profileRoleCoach" as any);
    return t("profileRoleAthlete" as any);
  })();

  const age = calcAge(data?.birth_date ?? null);
  const discipline = data?.discipline || "sparring";
  const goals = data?.goals || [];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${t("profileTitle" as any)} · Sportstalent`}
        description={t("profileMetaDesc" as any)}
        noindex
      />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("profileBack" as any)}
        </Button>

        {/* Header card */}
        <Card>
          <CardContent className="p-5 sm:p-6 relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile-setup")}
              className="absolute top-3 right-3 h-9 w-9 rounded-full"
              aria-label={t("profileEdit" as any)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden shrink-0 bg-primary text-primary-foreground flex items-center justify-center">
                {data?.avatar_url ? (
                  <img src={data.avatar_url} alt={data.display_name || "avatar"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold">{initialsOf(data?.display_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-10">
                <h1 className="text-base font-semibold text-foreground truncate">
                  {loading ? "—" : (data?.display_name || t("profileNoName" as any))}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {data?.club_name || t("profileNoClub" as any)}
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                  <MetaCell
                    label={t("profileBirthDate" as any)}
                    value={data?.birth_date ? `${fmtDate(data.birth_date, locale)}${age != null ? ` (${age})` : ""}` : "—"}
                  />
                  <MetaCell label={t("profileBeltLevel" as any)} value={data?.belt_level || "—"} />
                  <MetaCell label={t("profileHeight" as any)} value="—" />
                  <MetaCell label={t("profileWeight" as any)} value={data?.weight_kg ? `${data.weight_kg} kg` : "—"} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sport & discipline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profileSportDiscipline" as any)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <Row label={t("profileSport" as any)} value="Taekwondo" />
            <Separator />
            <div className="py-3">
              <p className="text-xs text-muted-foreground mb-2">{t("profileDiscipline" as any)}</p>
              <div className="flex gap-2">
                {["sparring", "poomsae"].map((d) => {
                  const active = discipline === d;
                  return (
                    <Badge
                      key={d}
                      variant={active ? "default" : "secondary"}
                      className="capitalize px-3 py-1"
                    >
                      {d}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-3">
              <p className="text-sm text-muted-foreground">{t("profileRole" as any)}</p>
              <Badge variant="default">{roleLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Licenses & registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profileLicensesTitle" as any)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {!hasCoach || licenseFields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {hasCoach ? t("profileLicensesNoFields" as any) : t("profileLicensesNoCoach" as any)}
              </p>
            ) : (
              licenseFields.map((f, idx) => {
                const v = data?.license_values?.[f.id];
                const defined = !!v?.value;
                const dleft = daysUntil(v?.expires_at);
                const expired = dleft !== null && dleft < 0;
                const soon = dleft !== null && dleft >= 0 && dleft <= 30;

                let badgeText = "";
                let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                if (defined) {
                  if (expired) { badgeText = t("profileLicenseExpired" as any); badgeVariant = "destructive"; }
                  else if (soon) { badgeText = t("profileLicenseExpiringSoon" as any); badgeVariant = "outline"; }
                  else { badgeText = t("profileLicenseActive" as any); badgeVariant = "default"; }
                }

                return (
                  <div key={f.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{f.field_name}</p>
                        {defined ? (
                          <>
                            <p className="text-sm text-foreground mt-1 truncate">{v?.value}</p>
                            <p className={`text-xs mt-0.5 ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                              {t("profileLicenseExpires" as any)}: {fmtDate(v?.expires_at, locale)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic mt-1">
                            {t("profileLicenseNotDefined" as any)}
                          </p>
                        )}
                      </div>
                      {defined && <Badge variant={badgeVariant} className="shrink-0">{badgeText}</Badge>}
                    </div>
                  </div>
                );
              })
            )}
            <Separator />
            <p className="text-xs text-muted-foreground pt-3">
              {t("profileLicensesFooter" as any)}
            </p>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profileGoalsTitle" as any)}</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("profileGoalsEmpty" as any)}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {goals.map((g) => (
                  <Badge key={g} variant="secondary">{g}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("profileAccountTitle" as any)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <Row label={t("profileAccountEmail" as any)} value={data?.email || "—"} />
            <Separator />
            <ActionRow
              icon={<KeyRound className="h-4 w-4" />}
              label={t("profileChangePassword" as any)}
              onClick={() => navigate("/change-password")}
            />
            <Separator />
            <ActionRow
              icon={<Download className="h-4 w-4" />}
              label={t("profileExportData" as any)}
              onClick={handleExport}
            />
            <Separator />
            <ActionRow
              icon={<Trash2 className="h-4 w-4" />}
              label={t("profileDeleteAccount" as any)}
              sub={t("profileDeleteAccountSub" as any)}
              danger
              onClick={() => navigate("/delete-account")}
            />
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full h-11"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t("profileLogout" as any)}
        </Button>
      </div>
      <AppFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground truncate">{value}</p>
    </div>
  );
}

function ActionRow({
  icon, label, sub, onClick, danger,
}: { icon: React.ReactNode; label: string; sub?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 hover:bg-muted/40 transition-colors text-left rounded-md -mx-2 px-2"
    >
      <div className={`h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0 ${danger ? "text-destructive" : "text-primary"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-destructive" : "text-foreground"}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground truncate mt-0.5">{value}</p>
    </div>
  );
}
