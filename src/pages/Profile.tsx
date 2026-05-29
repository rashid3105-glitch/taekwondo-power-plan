import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Pencil, Download, KeyRound, Trash2 } from "lucide-react";

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

function roleLabel(roles: string[] | null | undefined): string {
  const r = roles || [];
  const hasA = r.includes("athlete");
  const hasC = r.includes("coach");
  if (hasA && hasC) return "Begge";
  if (hasC) return "Coach";
  return "Atlet";
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
}

export default function Profile() {
  const navigate = useNavigate();
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
    a.download = `profil-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const age = calcAge(data?.birth_date ?? null);
  const role = roleLabel(data?.roles);
  const discipline = data?.discipline || "sparring";
  const goals = data?.goals || [];

  return (
    <div className="min-h-screen p-4 space-y-4" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Header */}
      <section className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 relative">
        <button
          type="button"
          onClick={() => navigate("/profile-setup")}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white/80 hover:bg-white/[0.1] transition-colors"
          aria-label="Rediger profil"
        >
          <Pencil size={15} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden shrink-0"
            style={{ backgroundColor: "var(--accent-hex)" }}
          >
            {data?.avatar_url ? (
              <img src={data.avatar_url} alt={data.display_name || "avatar"} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-extrabold text-black">{initialsOf(data?.display_name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-10">
            <h1 className="text-[16px] font-bold text-white truncate">
              {loading ? "—" : (data?.display_name || "Uden navn")}
            </h1>
            <p className="text-[12px] text-white/55 mt-0.5 truncate">{data?.club_name || "Ingen klub"}</p>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3">
              <MetaCell label="Fødselsdato" value={data?.birth_date ? `${fmtDate(data.birth_date)}${age != null ? ` (${age})` : ""}` : "—"} />
              <MetaCell label="Bæltegrad" value={data?.belt_level || "—"} />
              <MetaCell label="Højde" value="—" />
              <MetaCell label="Vægt" value={data?.weight_kg ? `${data.weight_kg} kg` : "—"} />
            </div>
          </div>
        </div>
      </section>

      {/* Sport & disciplin */}
      <Section title="Sport & disciplin">
        <Row label="Sport" value={data?.sport || "Taekwondo"} />
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-[11px] uppercase tracking-widest text-white/35 mb-2">Disciplin</p>
          <div className="flex gap-2">
            {["sparring", "poomsae"].map((d) => {
              const active = discipline === d;
              return (
                <span
                  key={d}
                  className="px-3 py-1.5 rounded-full text-[12px] font-semibold capitalize"
                  style={
                    active
                      ? { backgroundColor: "var(--accent-hex)", color: "#000" }
                      : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
                  }
                >
                  {d}
                </span>
              );
            })}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-white/35">Rolle</p>
          <span
            className="px-2.5 py-0.5 rounded-md text-[11px] font-bold"
            style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
          >
            {role}
          </span>
        </div>
      </Section>

      {/* Licenser & registreringer */}
      <Section title="Licenser & registreringer">
        {!hasCoach || licenseFields.length === 0 ? (
          <div className="px-4 py-6 text-center text-white/40 text-[13px]">
            {hasCoach ? "Din coach har ikke defineret felter endnu." : "Ingen coach tilknyttet."}
          </div>
        ) : (
          licenseFields.map((f, idx) => {
            const v = data?.license_values?.[f.id];
            const defined = !!v?.value;
            const dleft = daysUntil(v?.expires_at);
            const expired = dleft !== null && dleft < 0;
            const soon = dleft !== null && dleft >= 0 && dleft <= 30;
            const ok = dleft !== null && dleft > 30;

            let badgeBg = "rgba(255,255,255,0.08)";
            let badgeColor = "rgba(255,255,255,0.5)";
            let badgeText = "—";
            let dateColor = "rgba(255,255,255,0.55)";
            let borderColor = "";
            if (defined) {
              if (expired) { badgeBg = "#f87171"; badgeColor = "#000"; badgeText = "Udløbet"; dateColor = "#f87171"; borderColor = "rgba(248,113,113,0.2)"; }
              else if (soon) { badgeBg = "#F5A623"; badgeColor = "#000"; badgeText = "Udløber snart"; dateColor = "#F5A623"; borderColor = "rgba(245,166,35,0.2)"; }
              else if (ok) { badgeBg = "#22c55e"; badgeColor = "#000"; badgeText = "Aktiv"; }
              else { badgeText = "Aktiv"; badgeBg = "#22c55e"; badgeColor = "#000"; }
            }

            return (
              <div
                key={f.id}
                className={`px-4 py-3 ${idx > 0 ? "border-t border-white/10" : ""}`}
                style={borderColor ? { borderLeft: `2px solid ${borderColor}` } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-widest text-white/35">{f.field_name}</p>
                    {defined ? (
                      <>
                        <p className="text-[14px] text-white mt-1 truncate">{v?.value}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: dateColor }}>
                          Udløber: {fmtDate(v?.expires_at)}
                        </p>
                      </>
                    ) : (
                      <p className="text-[13px] text-white/40 mt-1 italic">Ikke defineret af coach</p>
                    )}
                  </div>
                  {defined && (
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: badgeBg, color: badgeColor }}
                    >
                      {badgeText}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
          <p className="text-[11px] text-white/45 leading-relaxed">
            Din coach definerer hvilke registreringsfelter der er relevante.
          </p>
        </div>
      </Section>

      {/* Mine mål */}
      <Section title="Mine mål">
        <div className="px-4 py-3">
          {goals.length === 0 ? (
            <p className="text-[13px] text-white/40">Ingen mål valgt endnu.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {goals.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Konto */}
      <Section title="Konto">
        <Row label="Email" value={data?.email || "—"} />
        <ActionRow
          icon={<KeyRound size={15} />}
          label="Skift adgangskode"
          onClick={() => navigate("/change-password")}
        />
        <ActionRow
          icon={<Download size={15} />}
          label="Download mine data"
          onClick={handleExport}
        />
        <ActionRow
          icon={<Trash2 size={15} />}
          label="Slet konto"
          sub="Download dine data først"
          danger
          onClick={() => navigate("/delete-account")}
        />
      </Section>

      {/* Log ud */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full h-11 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <LogOut size={16} />
        Log ud
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] uppercase tracking-widest text-white/35 mb-2 px-1">{title}</p>
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <p className="text-[11px] uppercase tracking-widest text-white/35">{label}</p>
      <p className="text-[13px] text-white/85 truncate">{value}</p>
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
      className="w-full flex items-center gap-3 px-4 py-3 border-t border-white/10 hover:bg-white/[0.04] transition-colors text-left"
    >
      <div
        className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"
        style={{ color: danger ? "#f87171" : "var(--accent-hex)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-semibold ${danger ? "text-[#f87171]" : "text-white"}`}>{label}</p>
        {sub && <p className="text-[11px] text-white/40 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-white/35">{label}</p>
      <p className="text-[12px] text-white/85 truncate">{value}</p>
    </div>
  );
}
