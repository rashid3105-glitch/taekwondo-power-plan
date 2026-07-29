import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Megaphone, Search, Send, Users } from "lucide-react";

type Audience = "all" | "clubs" | "users";

interface Club { id: string; name: string }
interface Person { user_id: string; display_name: string | null; club_id: string | null }
interface SentRow {
  id: string;
  title: string;
  audience: string;
  recipient_count: number;
  created_at: string;
}

export default function AdminAnnouncements() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<SentRow[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (!adminCheck) { navigate("/dashboard"); return; }
      setReady(true);

      const [clubRes, peopleRes, histRes] = await Promise.all([
        supabase.from("clubs").select("id, name").order("name"),
        supabase.from("profiles").select("user_id, display_name, club_id").eq("is_approved", true).order("display_name"),
        supabase.from("admin_announcements" as any)
          .select("id, title, audience, recipient_count, created_at")
          .order("created_at", { ascending: false }).limit(10),
      ]);
      setClubs((clubRes.data as Club[]) ?? []);
      setPeople((peopleRes.data as Person[]) ?? []);
      setHistory((histRes.data as unknown as SentRow[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const clubName = useMemo(() => {
    const m: Record<string, string> = {};
    clubs.forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [clubs]);

  const filteredPeople = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people.slice(0, 100);
    return people
      .filter((p) => (p.display_name ?? "").toLowerCase().includes(q))
      .slice(0, 100);
  }, [people, search]);

  const estimated = useMemo(() => {
    if (audience === "users") return selectedUsers.length;
    if (audience === "clubs") return people.filter((p) => p.club_id && selectedClubs.includes(p.club_id)).length;
    return people.length;
  }, [audience, people, selectedClubs, selectedUsers]);

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: "Udfyld titel og besked", variant: "destructive" });
      return;
    }
    if (audience === "clubs" && selectedClubs.length === 0) {
      toast({ title: "Vælg mindst én klub", variant: "destructive" });
      return;
    }
    if (audience === "users" && selectedUsers.length === 0) {
      toast({ title: "Vælg mindst én bruger", variant: "destructive" });
      return;
    }
    if (!confirm(`Send beskeden til ca. ${estimated} bruger(e)?`)) return;

    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-admin-announcement", {
      body: {
        title: title.trim(),
        body: body.trim(),
        audience,
        club_ids: audience === "clubs" ? selectedClubs : [],
        user_ids: audience === "users" ? selectedUsers : [],
      },
    });
    setSending(false);

    if (error) {
      toast({ title: "Kunne ikke sende", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Besked sendt", description: `${(data as any)?.recipients ?? 0} modtager(e)` });
    setTitle(""); setBody(""); setSelectedClubs([]); setSelectedUsers([]);
    const { data: hist } = await supabase.from("admin_announcements" as any)
      .select("id, title, audience, recipient_count, created_at")
      .order("created_at", { ascending: false }).limit(10);
    setHistory((hist as unknown as SentRow[]) ?? []);
  };

  if (!ready) return null;

  const tabBtn = (value: Audience, label: string) => (
    <button
      key={value}
      onClick={() => setAudience(value)}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        audience === value
          ? "bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground border border-border"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Tilbage">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Megaphone className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Besked til brugere</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {tabBtn("all", "Alle brugere")}
                {tabBtn("clubs", "Valgte klubber")}
                {tabBtn("users", "Valgte brugere")}
              </div>

              {audience === "clubs" && (
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-2 space-y-1">
                  {clubs.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                        checked={selectedClubs.includes(c.id)}
                        onChange={() => setSelectedClubs((p) => toggle(p, c.id))}
                      />
                      <span className="text-sm text-foreground">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {audience === "users" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Søg efter navn"
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-xl border border-border p-2 space-y-1">
                    {filteredPeople.map((p) => (
                      <label key={p.user_id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[hsl(var(--primary))]"
                          checked={selectedUsers.includes(p.user_id)}
                          onChange={() => setSelectedUsers((prev) => toggle(prev, p.user_id))}
                        />
                        <span className="text-sm text-foreground">{p.display_name || "—"}</span>
                        {p.club_id && (
                          <span className="ml-auto text-xs text-muted-foreground">{clubName[p.club_id] ?? ""}</span>
                        )}
                      </label>
                    ))}
                    {filteredPeople.length === 0 && (
                      <p className="px-2 py-3 text-sm text-muted-foreground">Ingen brugere fundet.</p>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedUsers.length} valgt</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Titel"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Skriv din besked her…"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" /> Ca. {estimated} modtager(e)
                </span>
                <Button onClick={send} disabled={sending} className="gap-2">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send besked
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Beskeden vises i appen på brugerens forside og sendes som push-notifikation.
              </p>
            </section>

            {history.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Seneste beskeder</h2>
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2">
                      <span className="truncate text-sm text-foreground">{h.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(h.created_at).toLocaleDateString()} · {h.recipient_count}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
