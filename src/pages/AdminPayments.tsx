import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, ArrowLeft, CreditCard, CalendarIcon, Search, Users, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { format } from "date-fns";

interface PaymentUser {
  user_id: string;
  display_name: string;
  payment_status: string;
  payment_date: string | null;
  is_demo: boolean;
  created_at: string;
  email?: string;
  club_id?: string | null;
  club_name?: string | null;
}

export default function AdminPayments() {
  const [users, setUsers] = useState<PaymentUser[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "demo">("all");
  const [clubScope, setClubScope] = useState<string>(() => {
    if (typeof window === "undefined") return "all";
    return localStorage.getItem("admin.payments.clubScope") || "all";
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin.payments.clubScope", clubScope);
    }
  }, [clubScope]);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/auth"); return; }
    const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (!adminCheck) { navigate("/dashboard"); return; }
    await loadUsers();
  };

  const loadUsers = async () => {
    const [profilesRes, emailsRes, clubsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, payment_status, payment_date, is_demo, created_at, club_id")
        .order("created_at", { ascending: false }),
      supabase.functions.invoke("get-admin-users"),
      supabase.from("clubs" as any).select("id, name").order("name"),
    ]);

    const emailMap: Record<string, string> = {};
    if (emailsRes.data?.users) {
      for (const u of emailsRes.data.users) {
        emailMap[u.id] = u.email;
      }
    }

    const clubsList = ((clubsRes.data as unknown as { id: string; name: string }[] | null) ?? []);
    setClubs(clubsList);
    const clubMap = new Map<string, string>(clubsList.map((c) => [c.id, c.name]));

    setUsers(
      (profilesRes.data || []).map((p: any) => ({
        ...p,
        email: emailMap[p.user_id] || "",
        club_name: p.club_id ? clubMap.get(p.club_id) || null : null,
      }))
    );
    setLoading(false);
  };

  const togglePayment = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "unpaid" : "paid";
    const updateData: any = { payment_status: newStatus };
    if (newStatus === "paid") {
      updateData.payment_date = new Date().toISOString().split("T")[0];
    } else {
      updateData.payment_date = null;
    }
    await supabase.from("profiles").update(updateData).eq("user_id", userId);
    toast({ title: newStatus === "paid" ? t("markedAsPaid") : t("markedAsUnpaid") });
    loadUsers();
  };

  const setPaymentDate = async (userId: string, date: Date | undefined) => {
    if (!date) return;
    await supabase.from("profiles").update({ payment_date: format(date, "yyyy-MM-dd"), payment_status: "paid" } as any).eq("user_id", userId);
    toast({ title: t("paymentDateUpdated") });
    loadUsers();
  };

  const filtered = users.filter((u) => {
    const matchesSearch = !search ||
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.club_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "paid" && u.payment_status === "paid") ||
      (filter === "unpaid" && u.payment_status !== "paid" && !u.is_demo) ||
      (filter === "demo" && u.is_demo);
    let matchesClub = true;
    if (clubScope !== "all") {
      if (clubScope === "__none__") matchesClub = !u.club_id;
      else matchesClub = u.club_id === clubScope;
    }
    return matchesSearch && matchesFilter && matchesClub;
  });

  const stats = {
    total: users.length,
    paid: users.filter(u => u.payment_status === "paid").length,
    unpaid: users.filter(u => u.payment_status !== "paid" && !u.is_demo).length,
    demo: users.filter(u => u.is_demo && u.payment_status !== "paid").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 pt-safe">
        <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/approval")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base font-extrabold text-foreground">
              {t("adminPayments") || "Payment Management"}
            </span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t("total") || "Total", value: stats.total, color: "text-foreground" },
            { label: t("paid"), value: stats.paid, color: "text-emerald-500" },
            { label: t("unpaid"), value: stats.unpaid, color: "text-destructive" },
            { label: t("demo"), value: stats.demo, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchUsers") || "Search by name, email or club..."}
              className="pl-9"
            />
          </div>
          <Select value={clubScope} onValueChange={setClubScope}>
            <SelectTrigger className="w-full sm:w-48">
              <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={t("filterByClub")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allClubs")}</SelectItem>
              <SelectItem value="__none__">— {t("noClub") || "No club"} —</SelectItem>
              {clubs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all") || "All"}</SelectItem>
              <SelectItem value="paid">{t("paid")}</SelectItem>
              <SelectItem value="unpaid">{t("unpaid")}</SelectItem>
              <SelectItem value="demo">{t("demo")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("noResults") || "No users found"}</p>
            </div>
          ) : (
            filtered.map((u) => (
              <div key={u.user_id} className="rounded-lg border border-border bg-card p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground truncate">{u.display_name || "—"}</p>
                      {u.club_name && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                          <Building className="h-2.5 w-2.5" />
                          {u.club_name}
                        </span>
                      )}
                      {u.payment_status === "paid" && (
                        <Badge variant="default" className="text-[10px] h-5 bg-emerald-500">
                          <CreditCard className="h-2.5 w-2.5 mr-0.5" /> {t("paid")}
                        </Badge>
                      )}
                      {u.is_demo && u.payment_status !== "paid" && (
                        <Badge variant="secondary" className="text-[10px] h-5">Demo</Badge>
                      )}
                    </div>
                    {u.email && <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(u.created_at), "dd/MM/yyyy")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Payment toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{t("paid")}</span>
                      <Switch
                        checked={u.payment_status === "paid"}
                        onCheckedChange={() => togglePayment(u.user_id, u.payment_status)}
                        className="scale-75"
                      />
                    </div>

                    {/* Date picker */}
                    {u.payment_status === "paid" && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {u.payment_date ? format(new Date(u.payment_date), "dd/MM/yy") : t("setDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={u.payment_date ? new Date(u.payment_date) : undefined}
                            onSelect={(date) => setPaymentDate(u.user_id, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
