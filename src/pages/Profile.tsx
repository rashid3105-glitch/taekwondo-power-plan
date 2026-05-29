import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

      const roles: string[] = (prof as any)?.roles ?? [];
      const isCoach = roles.includes("coach");
      const fieldsOwner = ca?.coach_id ?? (isCoach ? user.id : null);

      let fields: LicenseField[] = [];
      if (fieldsOwner) {
        const { data: lf } = await supabase
          .from("coach_license_fields")
          .select("id, field_name, sort_order")
          .eq("coach_id", fieldsOwner)
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
      setHasCoach(!!fieldsOwner);
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

  const cardCls = "rounded-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6";
  const sectionTitleCls = "text-xs uppercase tracking-wider text-white/35 mb-3";

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a" }}>
      <PageMeta
        title={`${t("profileTitle" as any)} · Sportstalent`}
        description={t("profileMetaDesc" as any)}
        noindex
      />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 text-white/70 hover:text-white hover:bg-white/5">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t("profileBack" as any)}
        </Button>

        {/* Header card */}
        <div className={`${cardCls} relative`}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile-edit")}
            className="absolute top-3 right-3 h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/5"
            aria-label={t("profileEdit" as any)}
            style={{ color: "var(--accent-hex)" }}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <div className="flex items-start gap-4">
            <div
              className="h-16 w-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-black"
              style={{ backgroundColor: "var(--accent-hex)" }}
            >
              {data?.avatar_url ? (
                <img src={data.avatar_url} alt={data.display_name || "avatar"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{initialsOf(data?.display_name)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 pr-10">
              <h1 className="text-base font-semibold text-white truncate">
                {loading ? "—" : (data?.display_name || t("profileNoName" as any))}
              </h1>
              <p className="text-sm text-white/50 mt-0.5 truncate">
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
        </div>

        {/* Sport & discipline */}
        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileSportDiscipline" as any)}</h2>
          <Row label={t("profileSport" as any)} value="Taekwondo" />
          <Separator className="bg-white/10" />
          <div className="py-3">
            <p className="text-xs text-white/50 mb-2">{t("profileDiscipline" as any)}</p>
            <div className="flex gap-2">
              {["sparring", "poomsae"].map((d) => {
                const active = discipline === d;
                return (
                  <span
                    key={d}
                    className="capitalize px-3 py-1 rounded-md text-xs font-medium"
                    style={
                      active
                        ? { backgroundColor: "var(--accent-hex)", color: "#000" }
                        : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {d}
                  </span>
                );
              })}
            </div>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-white/60">{t("profileRole" as any)}</p>
            <span
              className="px-3 py-1 rounded-md text-xs font-medium"
              style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Licenses */}
        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileLicensesTitle" as any)}</h2>
          {!hasCoach || licenseFields.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-6">
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
              let badgeStyle: React.CSSProperties = { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" };
              if (defined) {
                if (expired) { badgeText = t("profileLicenseExpired" as any); badgeStyle = { backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }; }
                else if (soon) { badgeText = t("profileLicenseExpiringSoon" as any); badgeStyle = { backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }; }
                else { badgeText = t("profileLicenseActive" as any); badgeStyle = { backgroundColor: "var(--accent-hex)", color: "#000" }; }
              }

              return (
                <div key={f.id}>
                  {idx > 0 && <Separator className="bg-white/10" />}
                  <div className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/50">{f.field_name}</p>
                      {defined ? (
                        <>
                          <p className="text-sm text-white mt-1 truncate">{v?.value}</p>
                          <p className={`text-xs mt-0.5 ${expired ? "text-red-400" : "text-white/50"}`}>
                            {t("profileLicenseExpires" as any)}: {fmtDate(v?.expires_at, locale)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-white/40 italic mt-1">
                          {t("profileLicenseNotDefined" as any)}
                        </p>
                      )}
                    </div>
                    {defined && (
                      <span className="shrink-0 px-2 py-1 rounded-md text-xs font-medium" style={badgeStyle}>
                        {badgeText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <Separator className="bg-white/10" />
          <p className="text-xs text-white/40 pt-3">
            {t("profileLicensesFooter" as any)}
          </p>
        </div>

        {/* Goals */}
        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileGoalsTitle" as any)}</h2>
          {goals.length === 0 ? (
            <p className="text-sm text-white/50">{t("profileGoalsEmpty" as any)}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-md text-xs font-medium"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Account */}
        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileAccountTitle" as any)}</h2>
          <Row label={t("profileAccountEmail" as any)} value={data?.email || "—"} />
          <Separator className="bg-white/10" />
          <ActionRow
            icon={<KeyRound className="h-4 w-4" />}
            label={t("profileChangePassword" as any)}
            onClick={() => navigate("/change-password")}
          />
          <Separator className="bg-white/10" />
          <ActionRow
            icon={<Download className="h-4 w-4" />}
            label={t("profileExportData" as any)}
            onClick={handleExport}
          />
          <Separator className="bg-white/10" />
          <ActionRow
            icon={<Trash2 className="h-4 w-4" />}
            label={t("profileDeleteAccount" as any)}
            sub={t("profileDeleteAccountSub" as any)}
            onClick={() => navigate("/delete-account")}
            danger
          />
        </div>

        <Button
          variant="ghost"
          className="w-full h-11 border border-white/10 text-white/80 hover:text-white hover:bg-white/5"
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
      <p className="text-sm text-white/60">{label}</p>
      <p className="text-sm text-white truncate">{value}</p>
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
      className="w-full flex items-center gap-3 py-3 hover:bg-white/5 transition-colors text-left rounded-md -mx-2 px-2"
    >
      <div
        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
        style={
          danger
            ? { backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444" }
            : { backgroundColor: "rgba(255,255,255,0.06)", color: "var(--accent-hex)" }
        }
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-red-400" : "text-white"}`}>{label}</p>
        {sub && <p className="text-xs text-white/50 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-white/45">{label}</p>
      <p className="text-sm text-white truncate mt-0.5">{value}</p>
    </div>
  );
}
