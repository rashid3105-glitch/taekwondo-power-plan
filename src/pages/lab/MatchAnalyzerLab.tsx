import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Brain, Check, Plus, Sparkles, Trash2, Upload, X, Target, Shield, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMatchLabT } from "@/i18n/matchLab";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

type Corner = "red" | "blue";
type Zone = "body" | "head";
interface Ev { id: string; t: number; corner: Corner; tech: string; zone: Zone; scored: boolean; pts: number; round: number; note?: string }
interface Match { id: string; title: string; red: string; blue: string; date: string; weight: string; rounds: number; videoUrl?: string; events: Ev[]; ai: boolean; report?: Report; framesUsed?: number }

const KICKS = [
  { id: "roundhouse", name: "Roundhouse", kr: "Dollyo Chagi", body: 2, head: 3 },
  { id: "back", name: "Back Kick", kr: "Dwi Chagi", body: 3, head: 4 },
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
  { id: "d6", t: 78, corner: "red", tech: "back", zone: "body", scored: true, pts: 3, round: 2 },
  { id: "d7", t: 92, corner: "blue", tech: "side", zone: "body", scored: true, pts: 2, round: 2 },
  { id: "d8", t: 105, corner: "red", tech: "crescent", zone: "body", scored: false, pts: 0, round: 2 },
  { id: "d9", t: 118, corner: "red", tech: "punch", zone: "body", scored: true, pts: 1, round: 2 },
  { id: "d10", t: 131, corner: "blue", tech: "front", zone: "body", scored: false, pts: 0, round: 3 },
];

const DEMO: Match = { id: "demo", title: "pol", red: "juaan", blue: "Milad", date: "2026-09-30", weight: "Feather (-68kg)", rounds: 3, events: DEMO_EVENTS, ai: false };
const WEIGHTS = ["Fin (-54kg)", "Fly (-58kg)", "Bantam (-63kg)", "Feather (-68kg)", "Light (-74kg)", "Welter (-80kg)", "Middle (-87kg)", "Heavy (+87kg)"];

export default function MatchAnalyzerLab() {
  const t = useMatchLabT();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([DEMO]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const open = matches.find((m) => m.id === openId) || null;
  const update = (m: Match) => setMatches((ms) => ms.map((x) => (x.id === m.id ? m : x)));

  return (
    <div className="min-h-screen bg-background text-foreground pt-safe pb-safe">
      <Helmet><title>{t("title")} · Sportstalent</title><meta name="robots" content="noindex" /></Helmet>
      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        {open ? (
          <Studio match={open} onBack={() => setOpenId(null)} onChange={update} />
        ) : (
          <Hub matches={matches} onOpen={setOpenId} onNew={() => setNewOpen(true)} onBack={() => navigate(-1)} />
        )}
      </div>
      <NewMatchDialog open={newOpen} onOpenChange={setNewOpen} onCreate={(m) => { setMatches((ms) => [m, ...ms]); setOpenId(m.id); }} />
    </div>
  );
}

function score(events: Ev[], c: Corner) {
  return events.filter((e) => e.corner === c && e.scored).reduce((s, e) => s + e.pts, 0);
}

function Hub({ matches, onOpen, onNew, onBack }: { matches: Match[]; onOpen: (id: string) => void; onNew: () => void; onBack: () => void }) {
  const t = useMatchLabT();
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
                <Button size="sm" variant="outline" onClick={() => onOpen(m.id)}>{t("open")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function NewMatchDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (m: Match) => void }) {
  const t = useMatchLabT();
  const [f, setF] = useState({ title: "", red: "", blue: "", date: new Date().toISOString().slice(0, 10), weight: WEIGHTS[3], rounds: 3 });
  const [file, setFile] = useState<File | null>(null);
  const ok = f.title && f.red && f.blue;
  const submit = () => {
    onCreate({ id: uid(), ...f, videoUrl: file ? URL.createObjectURL(file) : undefined, events: [], ai: false });
    onOpenChange(false); setFile(null); setF({ ...f, title: "", red: "", blue: "" });
  };
  return (
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
          <Button disabled={!ok} onClick={submit}>{t("start")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      const frames = match.videoUrl ? await extractFrames(match.videoUrl, 20) : [];
      const { data, error } = await supabase.functions.invoke("match-lab-analyze", {
        body: { frames, events: match.events, weight: match.weight, rounds: match.rounds, language: locale },
      });
      if (error || !data?.report) throw new Error(data?.error || "ai_error");
      onChange({ ...match, ai: true, report: data.report as Report, framesUsed: data.framesUsed });
    } catch (e) {
      console.error(e); toast.error(t("aiError"));
    } finally { setAnalyzing(false); }
  };
  const list = cat === "kicks" ? KICKS : PUNCHES;

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 me-1" />{t("back")}</Button>
        <div className="min-w-0">
          <h1 className="font-black text-xl truncate">{match.title}: {match.red} vs {match.blue}</h1>
          <p className="text-xs text-muted-foreground">{match.date} · {match.weight}</p>
        </div>
      </div>
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
          <TabsContent value="ai"><AiPanel match={match} analyzing={analyzing} onRun={runAi} onApply={() => { const det = (match.report?.detected ?? []).filter((d) => ALL.some((k) => k.id === d.tech)).map((d) => { const k = ALL.find((x) => x.id === d.tech)!; const zone: Zone = d.zone === "head" ? "head" : "body"; return { id: uid(), t: Math.round(d.t || 0), corner: (d.corner === "blue" ? "blue" : "red") as Corner, tech: d.tech, zone, scored: !!d.scored, pts: d.scored ? k[zone] : 0, round: Math.min(match.rounds, Math.floor((d.t || 0) / 120) + 1) }; }); onChange({ ...match, events: [...match.events, ...det], report: match.report ? { ...match.report, detected: [] } : match.report }); toast.success(t("applied")); }} /></TabsContent>
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

__AI__

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

__COACH__
