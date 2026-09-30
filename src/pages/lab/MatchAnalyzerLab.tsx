import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Brain, Check, Pencil, Save, FileDown, RefreshCw, Plus, Sparkles, Trash2, Upload, X, Target, Shield, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import runnerIcon from "@/assets/runner-icon.png";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMatchLabT } from "@/i18n/matchLab";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

type Corner = "red" | "blue";
type Zone = "body" | "head";
interface Ev { id: string; t: number; corner: Corner; tech: string; zone: Zone; scored: boolean; pts: number; round: number; note?: string }
interface Match { id: string; title: string; red: string; blue: string; date: string; weight: string; rounds: number; videoUrl?: string; events: Ev[]; ai: boolean; report?: Report; framesUsed?: number; edited?: boolean; stale?: boolean }

const KICKS = [
  { id: "roundhouse", name: "Roundhouse", kr: "Dollyo Chagi", body: 2, head: 3 },
  { id: "back", name: "Back Kick", kr: "Dwi Chagi", body: 4, head: 5 },
  { id: "spinhook", name: "Spin Hook", kr: "Dwi Huryeo", body: 4, head: 5 },
  { id: "axe", name: "Axe Kick", kr: "Naeryeo Chagi", body: 2, head: 3 },
  { id: "side", name: "Side Kick", kr: "Yeop Chagi", body: 2, head: 3 },
  { id: "front", name: "Front Kick", kr: "Ap Chagi", body: 2, head: 3 },
  { id: "crescent", name: "Crescent", kr: "Bandal Chagi", body: 2, head: 3 },
  { id: "tornado", name: "Tornado", kr: "Tornado Chagi", body: 4, head: 5 },
];
const PUNCHES = [{ id: "punch", name: "Punch", kr: "Jireugi", body: 1, head: 1 }];
const ALL = [...KICKS, ...PUNCHES];
const techName = (id: string) => ALL.find((k) => k.id === id)?.name ?? id;

const RED = "hsl(var(--corner-red))";
const BLUE = "hsl(var(--corner-blue))";
const cc = (c: Corner) => (c === "red" ? RED : BLUE);
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 10);

const DEMO_EVENTS: Ev[] = [
  { id: "d1", t: 8, corner: "red", tech: "crescent", zone: "body", scored: true, pts: 2, round: 1 },
  { id: "d2", t: 21, corner: "blue", tech: "roundhouse", zone: "body", scored: true, pts: 2, round: 1 },
  { id: "d3", t: 34, corner: "red", tech: "spinhook", zone: "head", scored: false, pts: 0, round: 1 },
  { id: "d4", t: 47, corner: "red", tech: "roundhouse", zone: "body", scored: true, pts: 2, round: 1 },
  { id: "d5", t: 63, corner: "blue", tech: "axe", zone: "head", scored: false, pts: 0, round: 1 },
  { id: "d6", t: 78, corner: "red", tech: "back", zone: "body", scored: true, pts: 4, round: 2 },
  { id: "d7", t: 92, corner: "blue", tech: "side", zone: "body", scored: true, pts: 2, round: 2 },
  { id: "d8", t: 105, corner: "red", tech: "crescent", zone: "body", scored: false, pts: 0, round: 2 },
  { id: "d9", t: 118, corner: "red", tech: "punch", zone: "body", scored: true, pts: 1, round: 2 },
  { id: "d10", t: 131, corner: "blue", tech: "front", zone: "body", scored: false, pts: 0, round: 3 },
];

const DEMO: Match = { id: "demo", title: "pol", red: "juaan", blue: "Milad", date: "2026-09-30", weight: "Feather (-68kg)", rounds: 3, events: DEMO_EVENTS, ai: false };
const LAB_KEY = "match_lab_matches_v1";

// Videos stay on this device (IndexedDB), keyed by match id.
const VDB = "match-lab-videos";
function vdb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => { const r = indexedDB.open(VDB, 1); r.onupgradeneeded = () => r.result.createObjectStore("v"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function vop<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await vdb();
  return new Promise((res, rej) => { const q = fn(db.transaction("v", mode).objectStore("v")); q.onsuccess = () => res(q.result as T); q.onerror = () => rej(q.error); });
}
const saveVideo = (id: string, b: Blob) => vop<void>("readwrite", (s) => s.put(b, id));
const loadVideo = (id: string) => vop<Blob | undefined>("readonly", (s) => s.get(id));
const removeVideo = (id: string) => vop<void>("readwrite", (s) => s.delete(id)).catch(() => undefined);
const WEIGHTS = ["Fin (-54kg)", "Fly (-58kg)", "Bantam (-63kg)", "Feather (-68kg)", "Light (-74kg)", "Welter (-80kg)", "Middle (-87kg)", "Heavy (+87kg)"];

export default function MatchAnalyzerLab() {
  const t = useMatchLabT();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>(() => {
    try { const raw = localStorage.getItem(LAB_KEY); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; } } catch { /* ignore */ }
    return [DEMO];
  });
  // Keep analyses on this device (video files cannot be stored, so they are left out).
  useEffect(() => { try { localStorage.setItem(LAB_KEY, JSON.stringify(matches.map(({ videoUrl: _v, ...m }) => m))); } catch { /* quota */ } }, [matches]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const open = matches.find((m) => m.id === openId) || null;
  const update = (m: Match) => setMatches((ms) => ms.map((x) => {
    if (x.id !== m.id) return x;
    // Events changed after an analysis → mark the AI report as out of date.
    const stale = m.report && x.events !== m.events ? true : m.stale;
    return { ...m, stale };
  }));
  useEffect(() => {
    let alive = true;
    matches.filter((m) => !m.videoUrl).forEach(async (m) => {
      try { const b = await loadVideo(m.id); if (b && alive) { const url = URL.createObjectURL(b); setMatches((ms) => ms.map((x) => (x.id === m.id && !x.videoUrl ? { ...x, videoUrl: url } : x))); } } catch { /* ignore */ }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <Helmet><title>{t("title")} · Sportstalent</title><meta name="robots" content="noindex" /></Helmet>
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        {open ? (
          <Studio match={open} onBack={() => setOpenId(null)} onChange={update} />
        ) : (
          <Hub matches={matches} onOpen={setOpenId} onNew={() => setNewOpen(true)} onBack={() => navigate(-1)} onDelete={(id) => setMatches((ms) => { const m = ms.find((x) => x.id === id); if (m?.videoUrl) URL.revokeObjectURL(m.videoUrl); removeVideo(id); return ms.filter((x) => x.id !== id); })} />
        )}
      </div>
      <NewMatchDialog open={newOpen} onOpenChange={setNewOpen} onCreate={(m) => { setMatches((ms) => [m, ...ms]); setOpenId(m.id); }} />
    </div>
  );
}

function LogoLoader({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/85 backdrop-blur-sm animate-fade-in" role="status" aria-live="polite">
      <div className="logo-3d-stage relative h-32 w-32 flex items-center justify-center">
        <div className="logo-3d-glow absolute inset-0 rounded-full" />
        <img src={runnerIcon} alt="" className="logo-3d relative h-24 w-auto" />
      </div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
    </div>
  );
}

function score(events: Ev[], c: Corner) {
  return events.filter((e) => e.corner === c && e.scored).reduce((s, e) => s + e.pts, 0);
}

function Hub({ matches, onOpen, onNew, onBack, onDelete }: { matches: Match[]; onOpen: (id: string) => void; onNew: () => void; onBack: () => void; onDelete: (id: string) => void }) {
  const t = useMatchLabT();
  const [delId, setDelId] = useState<string | null>(null);
  const delMatch = matches.find((m) => m.id === delId);
  const total = matches.reduce((s, m) => s + m.events.length, 0);
  const kpis = [
    [t("totalMatches"), matches.length], [t("inProgress"), matches.filter((m) => !!!m.report).length],
    [t("completed"), matches.filter((m) => !!m.report).length], [t("techniquesLogged"), total],
  ] as const;
  return (
    <>
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 me-1" />{t("back")}</Button>
      <div className="rounded-xl border bg-card p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <Badge variant="outline" className="mb-2 border-primary text-primary">{t("badge")}</Badge>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button className="h-11" onClick={onNew}><Plus className="h-4 w-4 me-1" />{t("newAnalysis")}</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(([l, v]) => (
          <Card key={l}><CardContent className="p-4"><div className="text-3xl font-black">{v}</div><div className="text-xs text-muted-foreground uppercase tracking-wide">{l}</div></CardContent></Card>
        ))}
      </div>
      <h2 className="text-lg font-bold">{t("recent")}</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {matches.map((m) => (
          <Card key={m.id} className="hover:border-primary transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold">{m.title}</div>
                <div className="flex gap-2">
                  {m.id === "demo" && <Badge variant="secondary">{t("demo")}</Badge>}
                  <Badge variant={!!m.report ? "default" : "outline"}>{!!m.report ? t("completed") : t("inProgress")}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold" style={{ color: RED }}>{m.red}</span>
                <span className="font-black text-xl">{score(m.events, "red")} – {score(m.events, "blue")}</span>
                <span className="font-semibold" style={{ color: BLUE }}>{m.blue}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{m.date} · {m.weight} · {m.events.length} {t("techniquesLogged").toLowerCase()}</span>
                <div className="flex gap-2 shrink-0"><Button size="icon" variant="ghost" className="h-9 w-9" title={t("delete")} aria-label={t("delete")} onClick={() => setDelId(m.id)}><Trash2 className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => onOpen(m.id)}>{t("open")}</Button></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{delMatch ? `${delMatch.title}: ${delMatch.red} vs ${delMatch.blue}. ` : ""}{t("deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (delId) onDelete(delId); setDelId(null); toast.success(t("deleted")); }}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NewMatchDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (m: Match) => void }) {
  const t = useMatchLabT();
  const [f, setF] = useState({ title: "", red: "", blue: "", date: new Date().toISOString().slice(0, 10), weight: WEIGHTS[3], rounds: 3 });
  const [file, setFile] = useState<File | null>(null);
  const ok = f.title && f.red && f.blue;
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    let videoUrl: string | undefined;
    if (file) {
      setLoading(true);
      videoUrl = URL.createObjectURL(file);
      const ok = await new Promise<boolean>((res) => {
        const v = document.createElement("video"); v.preload = "metadata"; v.muted = true;
        v.onloadeddata = () => res(true); v.onerror = () => res(false); v.src = videoUrl!;
        setTimeout(() => res(true), 20000);
      });
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      if (!ok) { URL.revokeObjectURL(videoUrl); toast.error(t("videoError")); return; }
    }
    const id = uid();
    if (file) { try { await saveVideo(id, file); toast.success(t("videoLocal")); } catch { /* quota: keep for this session only */ } }
    onCreate({ id, ...f, videoUrl, events: [], ai: false });
    onOpenChange(false); setFile(null); setF({ ...f, title: "", red: "", blue: "" });
  };
  return (
    <>
    {loading && <LogoLoader label={t("uploading")} />}
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("newAnalysis")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>{t("matchTitle")}</Label><Input className="h-11" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label style={{ color: RED }}>{t("redCorner")}</Label><Input className="h-11" value={f.red} onChange={(e) => setF({ ...f, red: e.target.value })} /></div>
            <div><Label style={{ color: BLUE }}>{t("blueCorner")}</Label><Input className="h-11" value={f.blue} onChange={(e) => setF({ ...f, blue: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t("date")}</Label><Input type="date" className="h-11" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div><Label>{t("weightClass")}</Label>
              <select className="h-11 w-full rounded-md border bg-background px-2 text-sm" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })}>
                {WEIGHTS.map((w) => <option key={w}>{w}</option>)}
              </select></div>
            <div><Label>{t("rounds")}</Label>
              <select className="h-11 w-full rounded-md border bg-background px-2 text-sm" value={f.rounds} onChange={(e) => setF({ ...f, rounds: +e.target.value })}>
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
              </select></div>
          </div>
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer hover:border-primary">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">{file ? file.name : t("video")}</span>
            <span className="text-xs text-muted-foreground text-center">{t("videoHint")}</span>
            <input type="file" accept="video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button disabled={!ok || loading} onClick={submit}>{t("start")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

function Studio({ match, onBack, onChange }: { match: Match; onBack: () => void; onChange: (m: Match) => void }) {
  const t = useMatchLabT();
  const vref = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [round, setRound] = useState(1);
  const [corner, setCorner] = useState<Corner>("red");
  const [zone, setZone] = useState<Zone>("body");
  const [scored, setScored] = useState(true);
  const [cat, setCat] = useState<"kicks" | "punches">("kicks");
  const [note, setNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState<"frames" | "ai">("ai");
  const events = useMemo(() => [...match.events].sort((a, b) => a.t - b.t), [match.events]);
  const red = score(events, "red"), blue = score(events, "blue");

  const now = () => (vref.current ? vref.current.currentTime : time);
  const add = (tech: string) => {
    const k = ALL.find((x) => x.id === tech)!;
    const ev: Ev = { id: uid(), t: Math.round(now()), corner, tech, zone, scored, pts: scored ? k[zone] : 0, round, note: note || undefined };
    onChange({ ...match, events: [...match.events, ev] }); setNote("");
  };
  const adjust = (c: Corner, d: number) => {
    if (d > 0) onChange({ ...match, events: [...match.events, { id: uid(), t: Math.round(now()), corner: c, tech: "punch", zone: "body", scored: true, pts: 1, round }] });
    else {
      const last = [...match.events].reverse().find((e) => e.corner === c && e.scored);
      if (last) onChange({ ...match, events: match.events.filter((e) => e.id !== last.id) });
    }
  };
  const seek = (s: number) => { if (vref.current) vref.current.currentTime = s; setTime(s); };
  const { locale } = useLanguage();
  const runAi = async () => {
    setAnalyzing(true);
    try {
      setStage("frames");
      const frames = match.videoUrl ? await extractFrames(match.videoUrl, 20) : [];
      setStage("ai");
      const { data, error } = await supabase.functions.invoke("match-lab-analyze", {
        body: { frames, events: match.events, weight: match.weight, rounds: match.rounds, language: locale },
      });
      if (error || !data?.report) throw new Error(data?.error || "ai_error");
      onChange({ ...match, ai: true, report: data.report as Report, framesUsed: data.framesUsed, edited: false, stale: false });
    } catch (e) {
      console.error(e); toast.error(t("aiError"));
    } finally { setAnalyzing(false); }
  };
  const list = cat === "kicks" ? KICKS : PUNCHES;
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [editing, setEditing] = useState<Ev | null>(null);
  const requestRun = () => (match.edited ? setConfirmOverwrite(true) : runAi());

  return (
    <>
      {analyzing && <LogoLoader label={stage === "frames" ? t("stageFrames") : t("stageAi")} />}
      <AlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t("overwriteTitle")}</AlertDialogTitle><AlertDialogDescription>{t("overwriteDesc")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t("cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => runAi()}>{t("overwrite")}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditEventDialog ev={editing} rounds={match.rounds} onClose={() => setEditing(null)} onSave={(ev) => { onChange({ ...match, events: match.events.map((x) => (x.id === ev.id ? ev : x)) }); setEditing(null); }} />
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 me-1" />{t("back")}</Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-xl truncate">{match.title}: {match.red} vs {match.blue}</h1>
          <p className="text-xs text-muted-foreground">{match.date} · {match.weight}</p>
        </div>
        {match.report && <Button variant="outline" className="h-11" onClick={() => exportPdf(match, t)}><FileDown className="h-4 w-4 me-1" />{t("exportPdf")}</Button>}
      </div>
      {match.report && match.stale && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/50 bg-primary/10 p-3">
          <p className="text-sm flex-1 min-w-[200px]">{t("stale")}</p>
          <Button className="h-11" onClick={requestRun} disabled={analyzing}><RefreshCw className="h-4 w-4 me-1" />{t("updateAnalysis")}</Button>
        </div>
      )}
      <div className="grid lg:grid-cols-[1.3fr_1fr_0.8fr] gap-4">
        {/* Video + scoreboard */}
        <div className="space-y-3">
          <div className="aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
            {match.videoUrl ? (
              <video ref={vref} src={match.videoUrl} controls playsInline className="w-full h-full" onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
            ) : (
              <div className="text-center text-muted-foreground text-sm p-6"><Play className="h-8 w-8 mx-auto mb-2" />{t("noVideo")}</div>
            )}
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <div className="flex gap-1">
                  {Array.from({ length: match.rounds }, (_, i) => (
                    <Button key={i} size="sm" variant={round === i + 1 ? "default" : "outline"} className="h-8 px-2" onClick={() => setRound(i + 1)}>{t("round")} {i + 1}</Button>
                  ))}
                </div>
                <span className="text-muted-foreground">{fmt(time)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(["red", "blue"] as Corner[]).map((c) => (
                  <div key={c} className="rounded-lg p-3 text-center border-2" style={{ borderColor: cc(c) }}>
                    <div className="text-xs font-bold uppercase" style={{ color: cc(c) }}>{c === "red" ? match.red : match.blue}</div>
                    <div className="text-5xl font-black my-1">{c === "red" ? red : blue}</div>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" className="h-11 w-11" onClick={() => adjust(c, -1)}>−</Button>
                      <Button size="sm" className="h-11" onClick={() => adjust(c, 1)}>+1</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="manual" className="min-w-0">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="manual">{t("manual")}</TabsTrigger>
            <TabsTrigger value="ai">{t("ai")}</TabsTrigger>
            <TabsTrigger value="stats">{t("stats")}</TabsTrigger>
            <TabsTrigger value="coach">{t("coaching")}</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="space-y-3">
            <Seg options={[["red", t("red")], ["blue", t("blue")]]} value={corner} onChange={(v) => setCorner(v as Corner)} colorFor={(v) => cc(v as Corner)} />
            <Seg options={[["body", t("body")], ["head", t("head")]]} value={zone} onChange={(v) => setZone(v as Zone)} icons={{ body: Shield, head: Target }} />
            <Seg options={[["1", t("scored")], ["0", t("miss")]]} value={scored ? "1" : "0"} onChange={(v) => setScored(v === "1")} icons={{ "1": Check, "0": X }} />
            <Seg options={[["kicks", t("kicks")], ["punches", t("punches")]]} value={cat} onChange={(v) => setCat(v as "kicks" | "punches")} />
            <div className="grid grid-cols-2 gap-2">
              {list.map((k) => (
                <button key={k.id} onClick={() => add(k.id)} className="rounded-lg border p-3 text-start hover:border-primary active:scale-[0.98] transition min-h-11">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{k.name}</span>
                    <Badge variant="secondary">+{k[zone]}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{k.kr}</div>
                </button>
              ))}
            </div>
            <Input className="h-11" placeholder={t("note")} value={note} onChange={(e) => setNote(e.target.value)} />
          </TabsContent>
          <TabsContent value="ai"><AiPanel match={match} analyzing={analyzing} onRun={requestRun} onSave={(r) => { const clean = (sd?: Side) => sd && { ...sd, dominant: unlines(lines(sd.dominant)), strengths: unlines(lines(sd.strengths)), improve: unlines(lines(sd.improve)) }; onChange({ ...match, edited: true, report: { ...r, red: clean(r.red), blue: clean(r.blue) } }); }} onApply={() => { const det = (match.report?.detected ?? []).filter((d) => ALL.some((k) => k.id === d.tech)).map((d) => { const k = ALL.find((x) => x.id === d.tech)!; const zone: Zone = d.zone === "head" ? "head" : "body"; return { id: uid(), t: Math.round(d.t || 0), corner: (d.corner === "blue" ? "blue" : "red") as Corner, tech: d.tech, zone, scored: !!d.scored, pts: d.scored ? k[zone] : 0, round: Math.min(match.rounds, Math.floor((d.t || 0) / 120) + 1) }; }); onChange({ ...match, events: [...match.events, ...det], report: match.report ? { ...match.report, detected: [] } : match.report }); toast.success(t("applied")); }} /></TabsContent>
          <TabsContent value="stats"><StatsPanel match={match} events={events} /></TabsContent>
          <TabsContent value="coach"><CoachPanel match={match} /></TabsContent>
        </Tabs>

        {/* Timeline */}
        <Card className="min-w-0">
          <CardHeader className="pb-2"><CardTitle className="text-base">{t("timeline")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {events.length === 0 && <p className="text-sm text-muted-foreground">{t("noEvents")}</p>}
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-md border p-2 border-s-4 cursor-pointer hover:bg-muted" style={{ borderInlineStartColor: cc(e.corner) }} onClick={() => seek(e.t)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{techName(e.tech)}</div>
                  <div className="text-xs text-muted-foreground">{fmt(e.t)} · {t("round")} {e.round} · {t(e.zone)}</div>
                </div>
                <Badge variant={e.scored ? "default" : "outline"}>{e.scored ? `+${e.pts}` : t("miss")}</Badge>
                <Button size="icon" variant="ghost" className="h-8 w-8" title={t("editEvent")} aria-label={t("editEvent")} onClick={(x) => { x.stopPropagation(); setEditing(e); }}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" title="✕" onClick={(x) => { x.stopPropagation(); onChange({ ...match, events: match.events.filter((y) => y.id !== e.id) }); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Seg({ options, value, onChange, colorFor, icons }: { options: [string, string][]; value: string; onChange: (v: string) => void; colorFor?: (v: string) => string; icons?: Record<string, React.ComponentType<{ className?: string }>> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map(([v, l]) => {
        const active = v === value; const Icon = icons?.[v];
        const col = colorFor?.(v);
        return (
          <button key={v} onClick={() => onChange(v)} className={`h-11 rounded-lg border-2 font-bold text-sm flex items-center justify-center gap-1 transition ${active ? "bg-primary/10" : "opacity-60"}`}
            style={{ borderColor: active ? col ?? "hsl(var(--primary))" : undefined, color: col }}>
            {Icon && <Icon className="h-4 w-4" />}{l}
          </button>
        );
      })}
    </div>
  );
}

function Bar({ label, value, max = 100, suffix = "" }: { label: string; value: number; max?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span>{label}</span><span className="font-bold">{value}{suffix}</span></div>
      <Progress value={(value / max) * 100} className="h-2" />
    </div>
  );
}

type Side = { style?: string; dominant?: string[]; strengths?: string[]; improve?: string[] };
type CoachSide = { focus?: string[]; technique?: { name?: string; tips?: string[]; drills?: string[] }; strategy?: string[]; physical?: string[]; mental?: string[] };
interface Report {
  winner?: Corner; summary?: string; red?: Side; blue?: Side;
  fightIq?: Record<string, number>; ring?: { centerControlPct?: number; reactionMs?: number; counterRatePct?: number; attacksPerMin?: number };
  momentum?: { t: number; corner: Corner; text: string }[]; mechanics?: Record<string, number>;
  detected?: { t: number; corner: Corner; tech: string; zone: Zone; scored: boolean; confidence?: number }[];
  coaching?: { red?: CoachSide; blue?: CoachSide };
}

/** Grab evenly spaced, downscaled JPEG frames from a local video. */
async function extractFrames(url: string, count: number): Promise<{ t: number; data: string }[]> {
  const v = document.createElement("video");
  v.src = url; v.muted = true; v.playsInline = true; v.preload = "auto";
  await new Promise<void>((res, rej) => { v.onloadedmetadata = () => res(); v.onerror = () => rej(new Error("video")); });
  const dur = v.duration || 0; if (!dur || !isFinite(dur)) return [];
  const w = 480, h = Math.round((v.videoHeight / Math.max(1, v.videoWidth)) * w) || 270;
  const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d")!;
  const out: { t: number; data: string }[] = [];
  for (let i = 0; i < count; i++) {
    const t = (dur * (i + 0.5)) / count;
    await new Promise<void>((res) => { v.onseeked = () => res(); v.currentTime = t; });
    ctx.drawImage(v, 0, 0, w, h);
    out.push({ t: Math.round(t), data: c.toDataURL("image/jpeg", 0.6) });
  }
  return out;
}

const n = (x: unknown, d = 0) => (typeof x === "number" && isFinite(x) ? Math.round(x) : d);

function AiPanel({ match, analyzing, onRun, onApply, onSave }: { match: Match; analyzing: boolean; onRun: () => void; onApply: () => void; onSave: (r: Report) => void }) {
  const t = useMatchLabT();
  const [draft, setDraft] = useState<Report | null>(null);
  const r = match.report;
  const runBtn = (
    <Button className="h-11" onClick={onRun} disabled={analyzing}><Sparkles className="h-4 w-4 me-1" />{analyzing ? t("analyzing") : t("analyzeAi")}</Button>
  );
  if (!r) return (
    <Card><CardContent className="p-6 text-center space-y-3">
      <Sparkles className="h-8 w-8 mx-auto text-primary" />
      {runBtn}
      <p className="text-xs text-muted-foreground">{match.videoUrl ? t("aiReal") : t("aiNoVideo")}</p>
    </CardContent></Card>
  );
  if (draft) return <ReportEditor match={match} draft={draft} setDraft={setDraft} onCancel={() => setDraft(null)} onSave={() => { onSave(draft); setDraft(null); toast.success(t("saved")); }} />;
  const iq = r.fightIq ?? {}; const ring = r.ring ?? {}; const mech = r.mechanics ?? {};
  return (
    <div className="space-y-3 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t("framesUsed")}: {match.framesUsed ?? 0}{match.edited && <Badge variant="secondary" className="ms-2">{t("edited")}</Badge>}</p>
        <Button size="sm" variant="outline" onClick={onRun} disabled={analyzing}>{analyzing ? t("analyzing") : t("reanalyze")}</Button>
      </div>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("report")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {r.summary && <p className="text-sm">{r.summary}</p>}
          {(["red", "blue"] as Corner[]).map((c) => { const sd = r[c] ?? {}; return (
            <div key={c} className="rounded-lg border p-3 space-y-2 border-s-4" style={{ borderInlineStartColor: cc(c) }}>
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: cc(c) }}>{c === "red" ? match.red : match.blue}</span>
                {r.winner === c && <Badge>{t("winner")}</Badge>}
              </div>
              {sd.style && <p className="text-xs text-muted-foreground">{t("style")}: {sd.style}</p>}
              <div className="flex flex-wrap gap-1">{(sd.dominant ?? []).map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}</div>
              <div className="text-xs space-y-1">
                <div className="font-semibold">{t("strengths")}</div>
                {(sd.strengths ?? []).map((k) => <div key={k} className="flex gap-1"><Check className="h-3 w-3 mt-0.5 shrink-0 text-primary" />{k}</div>)}
                <div className="font-semibold pt-1">{t("improve")}</div>
                {(sd.improve ?? []).map((k) => <div key={k} className="flex gap-1"><X className="h-3 w-3 mt-0.5 shrink-0 text-destructive" />{k}</div>)}
              </div>
            </div>
          ); })}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4" />{t("fightIq")} · {n(iq.score)} <span className="text-xs font-normal" style={{ color: RED }}>{match.red}</span></CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {["distance", "timing", "adaptability", "setups", "defense", "pressure"].map((k) => <Bar key={k} label={t(k)} value={n(iq[k])} />)}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("ringControl")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-center">
          {[[t("center"), `${n(ring.centerControlPct)}%`], [t("reaction"), `${n(ring.reactionMs)} ms`], [t("counterRate"), `${n(ring.counterRatePct)}%`], [t("attacksMin"), String(ring.attacksPerMin ?? 0)]].map(([l, v]) => (
            <div key={l} className="rounded-md border p-2"><div className="text-lg font-black">{v}</div><div className="text-[11px] text-muted-foreground">{l}</div></div>
          ))}
        </CardContent>
      </Card>
      {(r.momentum ?? []).length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("momentum")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(r.momentum ?? []).map((m, i) => (
            <div key={i} className="flex gap-2"><span className="font-mono text-xs w-10 shrink-0" style={{ color: cc(m.corner === "blue" ? "blue" : "red") }}>{fmt(n(m.t))}</span>{m.text}</div>
          ))}
        </CardContent>
      </Card>}
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("mechanics")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {["chamber", "pivot", "balance", "recovery", "hip", "flexibility"].map((k) => <Bar key={k} label={t(k)} value={n(mech[k])} max={10} suffix="/10" />)}
        </CardContent>
      </Card>
      {(r.detected ?? []).length > 0 && <Card><CardHeader className="pb-2 flex-row items-center justify-between"><CardTitle className="text-base">{t("detected")}</CardTitle>
        <Button size="sm" onClick={onApply}><Check className="h-4 w-4 me-1" />{t("applyAll")}</Button></CardHeader>
        <CardContent className="space-y-2">
          {(r.detected ?? []).map((e, i) => (
            <div key={i} className="flex justify-between text-sm border-s-4 ps-2" style={{ borderInlineStartColor: cc(e.corner === "blue" ? "blue" : "red") }}>
              <span>{fmt(n(e.t))} · {techName(e.tech)} · {t(e.zone === "head" ? "head" : "body")}</span><span className="text-muted-foreground">{n(e.confidence)}%</span>
            </div>
          ))}
        </CardContent>
      </Card>}
      <div className="sticky bottom-20 z-20 flex justify-end">
        <Button className="h-11 shadow-lg" onClick={() => setDraft(JSON.parse(JSON.stringify(r)))}><Pencil className="h-4 w-4 me-1" />{t("edit")}</Button>
      </div>
    </div>
  );
}

const lines = (a?: string[]) => (a ?? []).join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const clamp = (v: string, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

function ReportEditor({ match, draft, setDraft, onCancel, onSave }: { match: Match; draft: Report; setDraft: (r: Report) => void; onCancel: () => void; onSave: () => void }) {
  const t = useMatchLabT();
  const set = (patch: Partial<Report>) => setDraft({ ...draft, ...patch });
  const setSide = (c: Corner, patch: Partial<Side>) => set({ [c]: { ...(draft[c] ?? {}), ...patch } } as Partial<Report>);
  const num = (label: string, value: number, max: number, onV: (v: number) => void) => (
    <div key={label} className="space-y-1"><Label className="text-xs">{label}</Label>
      <Input type="number" inputMode="numeric" min={0} max={max} className="h-11" value={value} onChange={(e) => onV(clamp(e.target.value, max))} /></div>
  );
  const iq = draft.fightIq ?? {}; const mech = draft.mechanics ?? {}; const ring = draft.ring ?? {};
  return (
    <div className="space-y-3 pb-24">
      <p className="text-xs text-muted-foreground">{t("editHint")}</p>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("report")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">{t("summary")}</Label>
            <Textarea rows={3} value={draft.summary ?? ""} onChange={(e) => set({ summary: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">{t("winner")}</Label>
            <Seg options={[["red", match.red], ["blue", match.blue]]} value={draft.winner ?? ""} onChange={(v) => set({ winner: v as Corner })} colorFor={(v) => cc(v as Corner)} /></div>
          {(["red", "blue"] as Corner[]).map((c) => { const sd = draft[c] ?? {}; return (
            <div key={c} className="rounded-lg border p-3 space-y-2 border-s-4" style={{ borderInlineStartColor: cc(c) }}>
              <span className="font-bold" style={{ color: cc(c) }}>{c === "red" ? match.red : match.blue}</span>
              <div className="space-y-1"><Label className="text-xs">{t("style")}</Label><Input className="h-11" value={sd.style ?? ""} onChange={(e) => setSide(c, { style: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("dominant")} · {t("onePerLine")}</Label><Textarea rows={2} value={lines(sd.dominant)} onChange={(e) => setSide(c, { dominant: e.target.value.split("\n") })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("strengths")} · {t("onePerLine")}</Label><Textarea rows={3} value={lines(sd.strengths)} onChange={(e) => setSide(c, { strengths: e.target.value.split("\n") })} /></div>
              <div className="space-y-1"><Label className="text-xs">{t("improve")} · {t("onePerLine")}</Label><Textarea rows={3} value={lines(sd.improve)} onChange={(e) => setSide(c, { improve: e.target.value.split("\n") })} /></div>
            </div>
          ); })}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("fightIq")} (0–100)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {["score", "distance", "timing", "adaptability", "setups", "defense", "pressure"].map((k) => num(k === "score" ? t("fightIq") : t(k), n(iq[k]), 100, (v) => set({ fightIq: { ...iq, [k]: v } })))}
        </CardContent>
      </Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("ringControl")}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {num(`${t("center")} %`, n(ring.centerControlPct), 100, (v) => set({ ring: { ...ring, centerControlPct: v } }))}
          {num(`${t("reaction")} ms`, n(ring.reactionMs), 5000, (v) => set({ ring: { ...ring, reactionMs: v } }))}
          {num(`${t("counterRate")} %`, n(ring.counterRatePct), 100, (v) => set({ ring: { ...ring, counterRatePct: v } }))}
          {num(t("attacksMin"), n(ring.attacksPerMin), 200, (v) => set({ ring: { ...ring, attacksPerMin: v } }))}
        </CardContent>
      </Card>
      {(draft.momentum ?? []).length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("momentum")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(draft.momentum ?? []).map((m, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="font-mono text-xs w-10 shrink-0 pt-3" style={{ color: cc(m.corner === "blue" ? "blue" : "red") }}>{fmt(n(m.t))}</span>
              <Textarea rows={2} value={m.text} onChange={(e) => set({ momentum: (draft.momentum ?? []).map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" title={t("removeItem")} aria-label={t("removeItem")} onClick={() => set({ momentum: (draft.momentum ?? []).filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>}
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("mechanics")} (0–10)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {["chamber", "pivot", "balance", "recovery", "hip", "flexibility"].map((k) => num(t(k), n(mech[k]), 10, (v) => set({ mechanics: { ...mech, [k]: v } })))}
        </CardContent>
      </Card>
      {(draft.detected ?? []).length > 0 && <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("detected")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(draft.detected ?? []).map((e, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-s-4 ps-2" style={{ borderInlineStartColor: cc(e.corner === "blue" ? "blue" : "red") }}>
              <span>{fmt(n(e.t))} · {techName(e.tech)} · {t(e.zone === "head" ? "head" : "body")}</span>
              <Button size="icon" variant="ghost" className="h-11 w-11" title={t("removeItem")} aria-label={t("removeItem")} onClick={() => set({ detected: (draft.detected ?? []).filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>}
      <div className="sticky bottom-20 z-20 flex justify-end gap-2 rounded-lg border bg-card/95 p-2 shadow-lg backdrop-blur">
        <Button variant="outline" className="h-11" onClick={onCancel}>{t("discard")}</Button>
        <Button className="h-11" onClick={onSave}><Save className="h-4 w-4 me-1" />{t("save")}</Button>
      </div>
    </div>
  );
}

function StatsPanel({ match, events }: { match: Match; events: Ev[] }) {
  const t = useMatchLabT();
  const st = (c: Corner) => {
    const e = events.filter((x) => x.corner === c); const h = e.filter((x) => x.scored);
    return { a: e.length, h: h.length, acc: e.length ? Math.round((h.length / e.length) * 100) : 0, p: h.reduce((s, x) => s + x.pts, 0) };
  };
  const r = st("red"), b = st("blue");
  const used = ALL.map((k) => ({ k, r: events.filter((e) => e.tech === k.id && e.corner === "red").length, b: events.filter((e) => e.tech === k.id && e.corner === "blue").length })).filter((x) => x.r + x.b > 0);
  const max = Math.max(1, ...used.map((x) => Math.max(x.r, x.b)));
  return (
    <div className="space-y-3">
      <Card><CardContent className="p-4">
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-muted-foreground"><th className="text-start" /><th style={{ color: RED }}>{match.red}</th><th style={{ color: BLUE }}>{match.blue}</th></tr></thead>
          <tbody className="text-center font-bold">
            {[[t("attempts"), r.a, b.a], [t("hits"), r.h, b.h], [t("accuracy"), `${r.acc}%`, `${b.acc}%`], [t("points"), r.p, b.p]].map(([l, x, y]) => (
              <tr key={l as string} className="border-t"><td className="text-start font-normal py-2">{l}</td><td>{x}</td><td>{y}</td></tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("usage")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {used.map(({ k, r, b }) => (
            <div key={k.id} className="text-xs space-y-1">
              <div>{k.name}</div>
              <div className="h-2 rounded" style={{ width: `${(r / max) * 100}%`, background: RED, minWidth: r ? 4 : 0 }} />
              <div className="h-2 rounded" style={{ width: `${(b / max) * 100}%`, background: BLUE, minWidth: b ? 4 : 0 }} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CoachPanel({ match }: { match: Match }) {
  const t = useMatchLabT();
  const [who, setWho] = useState<Corner>("red");
  const cs = match.report?.coaching?.[who];
  if (!cs) return <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">{t("coachEmpty")}</CardContent></Card>;
  const li = (xs?: string[]) => (xs ?? []).map((k) => <div key={k}>• {k}</div>);
  return (
    <div className="space-y-3">
      <Seg options={[["red", match.red], ["blue", match.blue]]} value={who} onChange={(v) => setWho(v as Corner)} colorFor={(v) => cc(v as Corner)} />
      <Card><CardHeader className="pb-2"><CardTitle className="text-base">{t("focus")}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(cs.focus ?? []).slice(0, 3).map((k, i) => (
            <div key={k} className="flex items-center gap-3 rounded-md border p-2"><span className="font-black text-primary">#{i + 1}</span><span className="text-sm">{k}</span></div>
          ))}
        </CardContent>
      </Card>
      <Tabs defaultValue="technique">
        <TabsList className="grid grid-cols-4 w-full">
          {["technique", "strategy", "physical", "mental"].map((k) => <TabsTrigger key={k} value={k} className="text-xs">{t(k)}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="technique"><Card><CardContent className="p-4 text-sm space-y-2">
          {cs.technique?.name && <div className="font-bold">{cs.technique.name}</div>}
          <div className="font-semibold text-xs uppercase text-muted-foreground">{t("tips")}</div>
          {li(cs.technique?.tips)}
          <div className="font-semibold text-xs uppercase text-muted-foreground pt-2">{t("drills")}</div>
          {li(cs.technique?.drills)}
        </CardContent></Card></TabsContent>
        {(["strategy", "physical", "mental"] as const).map((v) => (
          <TabsContent key={v} value={v}><Card><CardContent className="p-4 text-sm space-y-2">{li(cs[v])}</CardContent></Card></TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EditEventDialog({ ev, rounds, onClose, onSave }: { ev: Ev | null; rounds: number; onClose: () => void; onSave: (e: Ev) => void }) {
  const t = useMatchLabT();
  const [d, setD] = useState<Ev | null>(ev);
  useEffect(() => setD(ev), [ev]);
  if (!d) return null;
  const k = ALL.find((x) => x.id === d.tech) ?? ALL[0];
  const save = () => onSave({ ...d, pts: d.scored ? k[d.zone] : 0, round: Math.max(1, Math.min(rounds, d.round)) });
  return (
    <Dialog open={!!ev} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("editEvent")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Seg options={[["red", t("red")], ["blue", t("blue")]]} value={d.corner} onChange={(v) => setD({ ...d, corner: v as Corner })} colorFor={(v) => cc(v as Corner)} />
          <select className="h-11 w-full rounded-md border bg-background px-2 text-sm" value={d.tech} onChange={(e) => setD({ ...d, tech: e.target.value })}>
            {ALL.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.kr}</option>)}
          </select>
          <Seg options={[["body", t("body")], ["head", t("head")]]} value={d.zone} onChange={(v) => setD({ ...d, zone: v as Zone })} />
          <Seg options={[["1", t("scored")], ["0", t("miss")]]} value={d.scored ? "1" : "0"} onChange={(v) => setD({ ...d, scored: v === "1" })} />
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("timeSec")}</Label><Input type="number" min={0} className="h-11" value={d.t} onChange={(e) => setD({ ...d, t: Math.max(0, Math.round(Number(e.target.value) || 0)) })} /></div>
            <div><Label>{t("round")}</Label>
              <select className="h-11 w-full rounded-md border bg-background px-2 text-sm" value={d.round} onChange={(e) => setD({ ...d, round: +e.target.value })}>
                {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => <option key={r} value={r}>{r}</option>)}
              </select></div>
          </div>
          <p className="text-xs text-muted-foreground">{d.scored ? `+${k[d.zone]}` : t("miss")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={onClose}>{t("cancel")}</Button>
          <Button className="h-11" onClick={save}>{t("saveEvent")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Build a text PDF of the saved analysis and share it (or download as fallback). */
async function exportPdf(match: Match, t: (k: string) => string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 15; let y = 18;
  const need = (h: number) => { if (y + h > 280) { doc.addPage(); y = 18; } };
  const text = (s: string, size = 10, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size); doc.setTextColor(...color);
    for (const ln of doc.splitTextToSize(s, W - 2 * M) as string[]) { need(size * 0.5); doc.text(ln, M, y); y += size * 0.45; }
    y += 1.5;
  };
  const head = (s: string) => { y += 3; text(s.toUpperCase(), 11, true, [180, 130, 20]); };
  const list = (a?: string[]) => (a ?? []).forEach((x) => text(`•  ${x}`));
  const r = match.report ?? {};
  const red: [number, number, number] = [220, 40, 40], blue: [number, number, number] = [30, 110, 230];
  text(t("pdfTitle"), 18, true);
  text(`${match.title}: ${match.red} vs ${match.blue}`, 13, true);
  text(`${match.date} · ${match.weight} · ${match.rounds} ${t("rounds")}`, 9, false, [110, 110, 110]);
  text(`${match.red} ${score(match.events, "red")} – ${score(match.events, "blue")} ${match.blue}${r.winner ? `   ·   ${t("winner")}: ${r.winner === "red" ? match.red : match.blue}` : ""}`, 12, true);
  if (match.edited) text(t("edited"), 9, false, [110, 110, 110]);
  if (r.summary) { head(t("summary")); text(r.summary); }
  (["red", "blue"] as Corner[]).forEach((c) => {
    const sd = r[c]; if (!sd) return;
    head(c === "red" ? match.red : match.blue);
    if (sd.style) text(`${t("style")}: ${sd.style}`, 10, false, c === "red" ? red : blue);
    if (sd.dominant?.length) text(`${t("dominant")}: ${sd.dominant.join(", ")}`);
    if (sd.strengths?.length) { text(t("strengths"), 10, true); list(sd.strengths); }
    if (sd.improve?.length) { text(t("improve"), 10, true); list(sd.improve); }
  });
  const iq = r.fightIq ?? {};
  head(`${t("fightIq")} · ${n(iq.score)} (${match.red})`);
  text(["distance", "timing", "adaptability", "setups", "defense", "pressure"].map((k) => `${t(k)} ${n(iq[k])}`).join("   ·   "));
  const ring = r.ring ?? {};
  head(t("ringControl"));
  text(`${t("center")} ${n(ring.centerControlPct)}%  ·  ${t("reaction")} ${n(ring.reactionMs)} ms  ·  ${t("counterRate")} ${n(ring.counterRatePct)}%  ·  ${t("attacksMin")} ${ring.attacksPerMin ?? 0}`);
  const mech = r.mechanics ?? {};
  head(t("mechanics"));
  text(["chamber", "pivot", "balance", "recovery", "hip", "flexibility"].map((k) => `${t(k)} ${n(mech[k])}/10`).join("   ·   "));
  if (r.momentum?.length) { head(t("momentum")); r.momentum.forEach((m) => text(`${fmt(n(m.t))}  ${m.text}`)); }
  (["red", "blue"] as Corner[]).forEach((c) => {
    const cs = r.coaching?.[c]; if (!cs) return;
    head(`${t("coaching")} · ${c === "red" ? match.red : match.blue}`);
    if (cs.focus?.length) { text(t("focus"), 10, true); cs.focus.forEach((f, i) => text(`#${i + 1}  ${f}`)); }
    if (cs.technique?.name) text(`${t("technique")}: ${cs.technique.name}`, 10, true);
    if (cs.technique?.tips?.length) { text(t("tips"), 10, true); list(cs.technique.tips); }
    if (cs.technique?.drills?.length) { text(t("drills"), 10, true); list(cs.technique.drills); }
    if (cs.strategy?.length) { text(t("strategy"), 10, true); list(cs.strategy); }
    if (cs.physical?.length) { text(t("physical"), 10, true); list(cs.physical); }
    if (cs.mental?.length) { text(t("mental"), 10, true); list(cs.mental); }
  });
  head(t("pdfEvents"));
  [...match.events].sort((a, b) => a.t - b.t).forEach((e) =>
    text(`${fmt(e.t)}  R${e.round}  ${e.corner === "red" ? match.red : match.blue}  ${techName(e.tech)} (${t(e.zone)})  ${e.scored ? `+${e.pts}` : t("miss")}`, 9, false, e.corner === "red" ? red : blue));
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140, 140, 140); doc.text(`${t("pdfFooter")} · ${i}/${pages}`, M, 290); }
  const name = `${match.title || "match"}-${match.date}.pdf`.replace(/[^\w.-]+/g, "_");
  const blob = doc.output("blob");
  const file = new File([blob], name, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) { try { await nav.share({ files: [file], title: name }); return; } catch { /* cancelled → download */ } }
  doc.save(name);
}
