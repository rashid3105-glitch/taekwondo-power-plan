import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Home, Zap, NotebookPen, MessageCircle, Menu, Users, Trophy, Settings,
  CheckCircle2, AlertTriangle, CalendarDays, Activity, Salad, Brain, HeartPulse,
  BarChart3, Video, BookOpen, User, Repeat, HelpCircle, Globe, ClipboardList,
  ShieldCheck, Package, FileText, Megaphone, Timer, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Danish-only design mockup (not shipped to users) — copy is intentionally static.
type Role = "athlete" | "coach";

function Phone({ children, nav, onMore, moreOpen, onCloseMore, more }: {
  children: React.ReactNode; nav: { icon: any; label: string; active?: boolean; more?: boolean; badge?: number }[];
  onMore: () => void; moreOpen: boolean; onCloseMore: () => void; more: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[390px] h-[780px] rounded-[2.5rem] border-[10px] border-foreground/80 bg-background overflow-hidden shadow-2xl">
      <div className="h-full overflow-y-auto pb-20">{children}</div>
      <nav className="absolute bottom-0 inset-x-0 border-t border-border bg-card/95 backdrop-blur flex justify-around px-1 pt-1.5 pb-3">
        {nav.map((n) => (
          <button key={n.label} onClick={n.more ? onMore : undefined}
            className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-lg", n.active ? "text-primary" : "text-muted-foreground")}>
            <span className="relative">
              <n.icon className="h-5 w-5" />
              {!!n.badge && <span className="absolute -right-2 -top-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{n.badge}</span>}
            </span>
            <span className="text-[10px] font-semibold">{n.label}</span>
          </button>
        ))}
      </nav>
      {moreOpen && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-end" onClick={onCloseMore}>
          <div className="w-full max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-card-foreground">Mere</span>
              <button onClick={onCloseMore} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            {more}
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ name, club }: { name: string; club: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur px-4 pt-6 pb-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">Torsdag 5. november</p>
        <p className="font-extrabold text-card-foreground truncate">{name}</p>
      </div>
      <span className="text-xs font-semibold rounded-full border border-border px-3 py-1.5 text-foreground">{club} ▾</span>
      <div className="h-9 w-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">{name[name.indexOf(" ") + 1] ?? "F"}</div>
    </header>
  );
}

function Section({ title, items }: { title: string; items: { icon: any; label: string }[] }) {
  return (
    <div className="mb-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((i) => (
          <div key={i.label} className="rounded-xl border border-border bg-background p-3 flex flex-col items-center gap-1.5 text-center">
            <i.icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground leading-tight">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AthleteHome() {
  return (
    <>
      <Header name="Goddag, Jonas" club="CPH TKD" />
      <div className="p-4 space-y-4">
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Dagens træning</p>
          <p className="text-lg font-extrabold text-foreground">Styrke & hurtighed</p>
          <ul className="text-sm text-foreground/90 space-y-1.5">
            <li className="flex gap-2"><Zap className="h-4 w-4 text-primary mt-0.5" /> 3 øvelser · ca. 35 min</li>
            <li className="flex gap-2"><CalendarDays className="h-4 w-4 text-primary mt-0.5" /> Klubtræning: sparring kl. 17:30</li>
            <li className="flex gap-2"><Activity className="h-4 w-4 text-primary mt-0.5" /> Teknikfokus: modangreb</li>
          </ul>
          <button className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold">Start træning</button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vigtigt lige nu</p>
          <div className="flex gap-3 items-start"><MessageCircle className="h-4 w-4 text-primary mt-0.5" /><p className="text-sm text-card-foreground"><b>Træner:</b> "Husk benskinner i dag"</p></div>
          <div className="flex gap-3 items-start"><Trophy className="h-4 w-4 text-primary mt-0.5" /><p className="text-sm text-card-foreground">Austrian Open om <b>12 dage</b></p></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ i: NotebookPen, l: "Dagbog", s: "Ikke skrevet" }, { i: Zap, l: "Parathed", s: "Tjek ind" }, { i: Trophy, l: "Stævner", s: "1 kommende" }].map((x) => (
            <div key={x.l} className="rounded-xl border border-border bg-card p-3 text-center">
              <x.i className="h-5 w-5 text-primary mx-auto" />
              <p className="text-xs font-bold text-card-foreground mt-1">{x.l}</p>
              <p className="text-[10px] text-muted-foreground">{x.s}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CoachHome() {
  return (
    <>
      <Header name="Træner Farooq" club="CPH TKD" />
      <div className="p-4 space-y-4">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Kræver handling · 3</p>
          {["Ali S. meldte knæsmerter i går", "3 ubesvarede beskeder", "2 mangler samtykke"].map((r) => (
            <div key={r} className="flex items-center justify-between text-sm text-foreground py-1.5 border-b border-border/50 last:border-0">
              {r}<ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Dagens træning</p>
          <p className="text-lg font-extrabold text-foreground">Kamp & sparring · 17:30</p>
          <p className="text-sm text-foreground/90">Teknikfokus: modangreb / cut-kick</p>
          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Fremmøde</span><span className="font-bold text-foreground">0 / 14</span></div>
          <button className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold">Registrér fremmøde</button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Truppen</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ n: 18, l: "Aktive" }, { n: 2, l: "Skadede" }, { n: 1, l: "Inaktiv 7d+" }].map((s) => (
              <div key={s.l} className="rounded-xl bg-muted p-2"><p className="text-lg font-extrabold text-foreground">{s.n}</p><p className="text-[10px] text-muted-foreground">{s.l}</p></div>
            ))}
          </div>
          <div className="space-y-1.5 text-sm text-card-foreground">
            <p className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Sara L. gennemførte styrke (30 min)</p>
            <p className="flex gap-2"><NotebookPen className="h-4 w-4 text-primary mt-0.5" /> Jonas M.: "God energi i dag"</p>
          </div>
          <p className="text-xs font-bold text-primary">Se al aktivitet →</p>
        </div>
      </div>
    </>
  );
}

const athleteMore = (
  <>
    <Section title="Mine moduler" items={[{ icon: Salad, label: "Kostplan" }, { icon: Brain, label: "Mental" }, { icon: HeartPulse, label: "Genoptræning" }, { icon: BarChart3, label: "Udvikling & test" }, { icon: Video, label: "Videoanalyse" }, { icon: BookOpen, label: "Bibliotek" }]} />
    <Section title="Konto" items={[{ icon: User, label: "Profil" }, { icon: Globe, label: "Sprog" }, { icon: Repeat, label: "Skift til træner" }, { icon: HelpCircle, label: "Hjælp" }]} />
  </>
);
const coachMore = (
  <>
    <Section title="Træningsværktøjer" items={[{ icon: Timer, label: "Testsessioner" }, { icon: ClipboardList, label: "Træningslogs" }, { icon: Brain, label: "Mental review" }, { icon: BookOpen, label: "Bibliotek" }]} />
    <Section title="Klub" items={[{ icon: ShieldCheck, label: "Samtykker" }, { icon: Package, label: "Moduler" }, { icon: FileText, label: "Rapporter" }, { icon: Megaphone, label: "Opslag" }]} />
    <Section title="Konto" items={[{ icon: User, label: "Profil" }, { icon: Globe, label: "Sprog" }, { icon: Repeat, label: "Atletvisning" }, { icon: HelpCircle, label: "Hjælp" }]} />
  </>
);

export default function MockupAppRedesign() {
  const [role, setRole] = useState<Role>("athlete");
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = role === "athlete"
    ? [{ icon: Home, label: "I dag", active: true }, { icon: Zap, label: "Træning" }, { icon: NotebookPen, label: "Dagbog" }, { icon: MessageCircle, label: "Beskeder", badge: 2 }, { icon: Menu, label: "Mere", more: true }]
    : [{ icon: Home, label: "I dag", active: true }, { icon: Users, label: "Truppen" }, { icon: Trophy, label: "Sæson" }, { icon: MessageCircle, label: "Beskeder", badge: 3 }, { icon: Settings, label: "Klub", more: true }];

  return (
    <div className="min-h-screen bg-muted/40 py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Tilbage</Link>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Mockup: ny forside & menu</h1>
          <p className="text-sm text-muted-foreground">Skift rolle, og tryk på "Mere"/"Klub" i bunden for at se menuen.</p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-card border border-border p-1">
          {(["athlete", "coach"] as Role[]).map((r) => (
            <button key={r} onClick={() => { setRole(r); setMoreOpen(false); }}
              className={cn("h-11 rounded-lg text-sm font-bold", role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {r === "athlete" ? "Atlet" : "Træner"}
            </button>
          ))}
        </div>
        <Phone nav={nav} onMore={() => setMoreOpen(true)} moreOpen={moreOpen} onCloseMore={() => setMoreOpen(false)} more={role === "athlete" ? athleteMore : coachMore}>
          {role === "athlete" ? <AthleteHome /> : <CoachHome />}
        </Phone>
      </div>
    </div>
  );
}
