import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ArrowLeft, BarChart3, Search, Users, Building, Download,
  ArrowUpDown,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ConsentFunnelCard } from "@/components/admin/ConsentFunnelCard";
import { JobRunsCard } from "@/components/admin/JobRunsCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

type StatUser = {
  user_id: string;
  display_name: string;
  club_id: string | null;
  club_name: string | null;
  country: string | null;
  is_approved: boolean | null;
  is_demo: boolean | null;
  demo_expires_at: string | null;
  payment_status: string | null;
  role: "admin" | "coach" | "parent" | "athlete";
  created_at: string;
  last_activity_at: string | null;
  diary_count: number;
  workout_count: number;
  test_count: number;
  competition_count: number;
  email?: string;
};

type Summary = Record<string, number>;

type SortKey = "display_name" | "created_at" | "last_activity_at";

const PAGE_SIZE = 50;

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<StatUser[]>([]);
  const [summary, setSummary] = useState<Summary>({});
  const [signups, setSignups] = useState<{ month: string; count: number }[]>([]);

  const [search, setSearch] = useState("");
  const [clubScope, setClubScope] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!adminCheck) { navigate("/dashboard"); return; }

      const [statsRes, emailsRes] = await Promise.all([
        supabase.rpc("get_admin_user_stats" as any),
        supabase.functions.invoke("get-admin-users"),
      ]);

      if (statsRes.error) {
        toast({ title: t("error"), description: statsRes.error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      const payload = statsRes.data as any;
      const emailMap: Record<string, string> =
        emailsRes.data?.emailMap ??
        (emailsRes.data?.users
          ? Object.fromEntries(emailsRes.data.users.map((u: any) => [u.id, u.email]))
          : {});

      setSummary(payload?.summary ?? {});
      setSignups(payload?.signups_by_month ?? []);
      setUsers(((payload?.users ?? []) as StatUser[]).map((u) => ({ ...u, email: emailMap[u.user_id] || "" })));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clubs = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => { if (u.club_id) map.set(u.club_id, u.club_name || "—"); });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [users]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = now - 30 * 24 * 3600 * 1000;
    const q = search.trim().toLowerCase();
    const rows = users.filter((u) => {
      if (q) {
        const hay = `${u.display_name} ${u.email || ""} ${u.club_name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (clubScope !== "all") {
        if (clubScope === "__none__" ? !!u.club_id : u.club_id !== clubScope) return false;
      }
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "approved" && !u.is_approved) return false;
      if (statusFilter === "pending" && u.is_approved) return false;
      if (statusFilter === "paid" && u.payment_status !== "paid") return false;
      if (statusFilter === "demo" && !(u.is_demo && u.payment_status !== "paid")) return false;
      if (statusFilter === "unpaid" && (u.payment_status === "paid" || u.is_demo)) return false;
      const last = u.last_activity_at ? new Date(u.last_activity_at).getTime() : 0;
      if (activityFilter === "active" && last <= cutoff) return false;
      if (activityFilter === "inactive" && last > cutoff) return false;
      return true;
    });

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "display_name") cmp = (a.display_name || "").localeCompare(b.display_name || "");
      else {
        const av = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0;
        const bv = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0;
        cmp = av - bv;
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [users, search, clubScope, roleFilter, statusFilter, activityFilter, sortKey, sortAsc]);

  useEffect(() => { setPage(0); }, [search, clubScope, roleFilter, statusFilter, activityFilter]);

  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const exportCsv = () => {
    const head = [
      t("statsName"), "Email", t("club"), t("country"), t("statsRole"), t("statsStatus"),
      t("statsCreated"), t("statsLastActivity"),
      t("statsDiary"), t("statsWorkouts"), t("statsTests"), t("statsCompetitions"),
    ];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [head.map(esc).join(",")];
    filtered.forEach((u) => {
      lines.push([
        u.display_name, u.email || "", u.club_name || "", u.country || "", u.role,
        u.payment_status === "paid" ? t("paid") : u.is_demo ? t("demo") : t("unpaid"),
        format(new Date(u.created_at), "yyyy-MM-dd"),
        u.last_activity_at ? format(new Date(u.last_activity_at), "yyyy-MM-dd") : "",
        u.diary_count, u.workout_count, u.test_count, u.competition_count,
      ].map(esc).join(","));
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sportstalent-users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const kpis: { label: string; value: number; hint?: string; color: string }[] = [
    { label: t("statsTotalUsers"), value: summary.total ?? 0, color: "text-foreground" },
    { label: t("statsActive7d"), value: summary.active_7d ?? 0, color: "text-emerald-500" },
    { label: t("statsActive30d"), value: summary.active_30d ?? 0, color: "text-emerald-500" },
    { label: t("statsInactive30d"), value: summary.inactive_30d ?? 0, color: "text-muted-foreground" },
    {
      label: t("statsNewThisMonth"), value: summary.new_this_month ?? 0, color: "text-primary",
      hint: `${t("statsPrevMonth")}: ${summary.new_prev_month ?? 0}`,
    },
    { label: t("statsPending"), value: summary.pending ?? 0, color: "text-amber-500" },
    { label: t("paid"), value: summary.paid ?? 0, color: "text-emerald-500" },
    { label: t("demo"), value: summary.demo ?? 0, color: "text-primary" },
    { label: t("unpaid"), value: summary.unpaid ?? 0, color: "text-destructive" },
    { label: t("statsAthletes"), value: summary.athletes ?? 0, color: "text-foreground" },
    { label: t("statsCoaches"), value: summary.coaches ?? 0, color: "text-foreground" },
    { label: t("statsParents"), value: summary.parents ?? 0, color: "text-foreground" },
    { label: t("statsAdmins"), value: summary.admins ?? 0, color: "text-foreground" },
    { label: t("statsClubs"), value: summary.clubs ?? 0, color: "text-foreground" },
    { label: t("statsNoClub"), value: summary.no_club ?? 0, color: "text-muted-foreground" },
  ];

  const roleBadge = (role: StatUser["role"]) => {
    const map: Record<string, string> = {
      admin: "bg-amber-500/15 text-amber-500 border-amber-500/30",
      coach: "bg-primary/15 text-primary border-primary/30",
      parent: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      athlete: "bg-muted text-muted-foreground border-border",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${map[role]}`}>
        {t(`statsRole_${role}` as any) || role}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/approval")} aria-label={t("back")} title={t("back")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base font-extrabold text-card-foreground truncate">
              {t("adminStats")}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5" title={t("statsExportCsv")}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("statsExportCsv")}</span>
          </Button>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {/* Summary */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("statsSummary")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-3">
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{k.label}</p>
                {k.hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{k.hint}</p>}
              </div>
            ))}
          </div>
        </section>

        <ConsentFunnelCard />

        <JobRunsCard />

        {/* Signups chart */}
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            {t("statsSignupsPerMonth")}
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signups} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(m: string) => m.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("statsUsersTable")} ({filtered.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="relative lg:col-span-1 sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchUsers")} className="pl-9" />
            </div>
            <Select value={clubScope} onValueChange={setClubScope}>
              <SelectTrigger>
                <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder={t("filterByClub")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allClubs")}</SelectItem>
                <SelectItem value="__none__">— {t("noClub")} —</SelectItem>
                {clubs.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("statsRole")}: {t("all")}</SelectItem>
                <SelectItem value="athlete">{t("statsRole_athlete")}</SelectItem>
                <SelectItem value="coach">{t("statsRole_coach")}</SelectItem>
                <SelectItem value="parent">{t("statsRole_parent")}</SelectItem>
                <SelectItem value="admin">{t("statsRole_admin")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("statsStatus")}: {t("all")}</SelectItem>
                <SelectItem value="approved">{t("statsApproved")}</SelectItem>
                <SelectItem value="pending">{t("statsPending")}</SelectItem>
                <SelectItem value="paid">{t("paid")}</SelectItem>
                <SelectItem value="demo">{t("demo")}</SelectItem>
                <SelectItem value="unpaid">{t("unpaid")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("statsActivity")}: {t("all")}</SelectItem>
                <SelectItem value="active">{t("statsActiveOnly")}</SelectItem>
                <SelectItem value="inactive">{t("statsInactiveOnly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Table */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("noResults")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 text-left">
                      <button onClick={() => toggleSort("display_name")} className="inline-flex items-center gap-1">
                        {t("statsName")} <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left">{t("club")}</th>
                    <th className="px-3 py-2 text-left">{t("statsRole")}</th>
                    <th className="px-3 py-2 text-left">{t("statsStatus")}</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      <button onClick={() => toggleSort("created_at")} className="inline-flex items-center gap-1">
                        {t("statsCreated")} <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap">
                      <button onClick={() => toggleSort("last_activity_at")} className="inline-flex items-center gap-1">
                        {t("statsLastActivity")} <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-3 py-2 text-right">{t("statsDiary")}</th>
                    <th className="px-3 py-2 text-right">{t("statsWorkouts")}</th>
                    <th className="px-3 py-2 text-right">{t("statsTests")}</th>
                    <th className="px-3 py-2 text-right">{t("statsCompetitions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <p className="font-medium text-foreground truncate max-w-[180px]">{u.display_name || "—"}</p>
                        {u.email && <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{u.email}</p>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{u.club_name || "—"}</td>
                      <td className="px-3 py-2">{roleBadge(u.role)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {u.payment_status === "paid" ? (
                            <Badge className="text-[10px] h-5 bg-emerald-500">{t("paid")}</Badge>
                          ) : u.is_demo ? (
                            <Badge variant="secondary" className="text-[10px] h-5">{t("demo")}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-5">{t("unpaid")}</Badge>
                          )}
                          {!u.is_approved && (
                            <Badge variant="outline" className="text-[10px] h-5 border-amber-500/40 text-amber-500">
                              {t("statsPending")}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(u.created_at), "dd/MM/yyyy")}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {u.last_activity_at
                          ? <span className="text-foreground">{format(new Date(u.last_activity_at), "dd/MM/yyyy")}</span>
                          : <span className="text-muted-foreground">{t("statsNever")}</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{u.diary_count}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{u.workout_count}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{u.test_count}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{u.competition_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pageCount > 1 && (
          <div className="flex items-center justify-between gap-2 pb-8">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              {t("statsPrevPage")}
            </Button>
            <span className="text-xs text-muted-foreground">{page + 1} / {pageCount}</span>
            <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
              {t("next")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
