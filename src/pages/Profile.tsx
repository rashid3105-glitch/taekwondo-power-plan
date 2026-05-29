import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { Mail, Trophy, Building2, Shield, Calendar, LogOut, Pencil } from "lucide-react";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  sport: string | null;
  club_name: string | null;
  roles: string[] | null;
  created_at: string | null;
  email: string | null;
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(roles: string[] | null | undefined): string {
  const r = roles || [];
  const hasA = r.includes("athlete");
  const hasC = r.includes("coach");
  if (hasA && hasC) return "Begge";
  if (hasC) return "Coach";
  return "Atlet";
}

export default function Profile() {
  const navigate = useNavigate();
  const { activeRole } = useRole();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, sport, club_id, roles, created_at, clubs:club_id(name)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted) return;
      const clubName = (prof as any)?.clubs?.name ?? null;
      setData({
        display_name: (prof as any)?.display_name ?? null,
        avatar_url: (prof as any)?.avatar_url ?? null,
        sport: (prof as any)?.sport ?? null,
        club_name: clubName,
        roles: (prof as any)?.roles ?? null,
        created_at: (prof as any)?.created_at ?? user.created_at ?? null,
        email: user.email ?? null,
      });
        email: user.email ?? null,
      });
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const createdLabel = data?.created_at
    ? new Date(data.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const sportLabel = data?.sport || "Taekwondo";
  const role = roleLabel(data?.roles);

  return (
    <div
      className="min-h-screen p-4 space-y-4"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Header */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center text-center">
        <div
          className="h-20 w-20 rounded-full flex items-center justify-center mb-3 overflow-hidden"
          style={{ backgroundColor: "var(--accent-hex)" }}
        >
          {data?.avatar_url ? (
            <img src={data.avatar_url} alt={data.display_name || "avatar"} className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold text-black">{initialsOf(data?.display_name)}</span>
          )}
        </div>
        <h1 className="text-heading">{loading ? "—" : (data?.display_name || "Uden navn")}</h1>
        <p className="text-caption mt-1">
          {sportLabel} ·{" "}
          <span
            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold align-middle"
            style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
          >
            {role}
          </span>
        </p>
      </section>

      {/* Info rows */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] divide-y divide-white/10">
        <InfoRow icon={<Mail size={16} />} label="Email" value={data?.email || "—"} />
        <InfoRow icon={<Trophy size={16} />} label="Sport" value={sportLabel} />
        <InfoRow icon={<Building2 size={16} />} label="Klub" value={data?.club_name || "—"} />
        <InfoRow icon={<Shield size={16} />} label="Rolle" value={role} badge />
        <InfoRow icon={<Calendar size={16} />} label="Oprettet" value={createdLabel} />
      </section>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => navigate("/profile-setup")}
          className="w-full h-11 rounded-xl border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/[0.04] transition-colors"
        >
          <Pencil size={16} />
          Rediger profil
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full h-11 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <LogOut size={16} />
          Log ud
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon, label, value, badge,
}: { icon: React.ReactNode; label: string; value: string; badge?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: "var(--accent-hex)" }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-caption">{label}</p>
        {badge ? (
          <span
            className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{ backgroundColor: "var(--accent-hex)", color: "#000" }}
          >
            {value}
          </span>
        ) : (
          <p className="text-body truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
