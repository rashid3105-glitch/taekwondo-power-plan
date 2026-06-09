import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Wind, Loader2, X, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeepLevel {
  level: number;
  shuttles: number;
  speed: number;
}

const LEVELS: BeepLevel[] = [
  { level: 1, shuttles: 7, speed: 8.0 },
  { level: 2, shuttles: 8, speed: 9.0 },
  { level: 3, shuttles: 8, speed: 9.5 },
  { level: 4, shuttles: 9, speed: 10.0 },
  { level: 5, shuttles: 9, speed: 10.5 },
  { level: 6, shuttles: 10, speed: 11.0 },
  { level: 7, shuttles: 10, speed: 11.5 },
  { level: 8, shuttles: 11, speed: 12.0 },
  { level: 9, shuttles: 11, speed: 12.5 },
  { level: 10, shuttles: 11, speed: 13.0 },
  { level: 11, shuttles: 12, speed: 13.5 },
  { level: 12, shuttles: 12, speed: 14.0 },
  { level: 13, shuttles: 13, speed: 14.5 },
  { level: 14, shuttles: 13, speed: 15.0 },
  { level: 15, shuttles: 13, speed: 15.5 },
  { level: 16, shuttles: 17, speed: 16.0 },
  { level: 17, shuttles: 17, speed: 16.5 },
  { level: 18, shuttles: 18, speed: 17.0 },
  { level: 19, shuttles: 18, speed: 17.5 },
  { level: 20, shuttles: 21, speed: 18.0 },
  { level: 21, shuttles: 21, speed: 18.5 },
];

const intervalForSpeed = (speed: number) =>
  Math.round((20 / (speed / 3.6)) * 10) / 10;

const vo2maxEstimate = (speed: number) =>
  Math.round((speed * 6 - 27.4) * 10) / 10;

type Phase = "idle" | "countdown" | "running" | "finished";

interface StoppedResult {
  levelIdx: number;
  shuttle: number;
  saved: boolean;
  saving: boolean;
}

export interface BeepTestSaveParams {
  userId: string;
  level: number;
  shuttle: number;
  testType: "individual" | "coach";
  testedBy: string | null;
}

interface BeepTestTimerProps {
  mode: "individual" | "coach";
  athletes?: Array<{ athlete_id: string; display_name: string }>;
  currentUserId: string | null;
  onSave: (params: BeepTestSaveParams) => Promise<void>;
  onClose: () => void;
}

export function BeepTestTimer({
  mode,
  athletes = [],
  currentUserId,
  onSave,
  onClose,
}: BeepTestTimerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    mode === "individual" ? new Set(["self"]) : new Set()
  );
  const [countdown, setCountdown] = useState(5);
  const [levelIdx, setLevelIdx] = useState(0);
  const [shuttle, setShuttle] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [nextBeepIn, setNextBeepIn] = useState(0);
  const [stopped, setStopped] = useState<Map<string, StoppedResult>>(new Map());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickRef = useRef<number | null>(null);
  const lastBeepAtRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const levelIdxRef = useRef(0);
  const shuttleRef = useRef(1);
  const stoppedRef = useRef<Set<string>>(new Set());

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      } catch { /* no audio */ }
    }
    return audioCtxRef.current;
  };

  const beep = useCallback((freq = 880, duration = 80) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000 + 0.02);
    } catch { /* ignore */ }
  }, []);

  const doubleBeep = useCallback(() => {
    beep(1100, 100);
    setTimeout(() => beep(1100, 100), 200);
  }, [beep]);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  const activeParticipants = mode === "individual"
    ? [{ athlete_id: "self", display_name: "" }]
    : athletes.filter(a => selectedIds.has(a.athlete_id));

  const handleToggleAthlete = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === athletes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(athletes.map(a => a.athlete_id)));
    }
  };

  const handleStart = () => {
    if (mode === "coach" && selectedIds.size === 0) {
      toast({ title: t("error"), description: t("beepTestSelectAthlete"), variant: "destructive" });
      return;
    }
    ensureAudio();
    setPhase("countdown");
    setCountdown(5);
    let remaining = 5;
    beep(660, 100);
    const cd = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        beep(660, 100);
        setCountdown(remaining);
      } else {
        window.clearInterval(cd);
        doubleBeep();
        startRunning();
      }
    }, 1000);
  };

  const startRunning = () => {
    levelIdxRef.current = 0;
    shuttleRef.current = 1;
    stoppedRef.current = new Set();
    setLevelIdx(0);
    setShuttle(1);
    setElapsed(0);
    setStopped(new Map());
    setPhase("running");
    const now = performance.now();
    startedAtRef.current = now;
    lastBeepAtRef.current = now;
    beep(880, 80);

    tickRef.current = window.setInterval(() => {
      const now = performance.now();
      setElapsed((now - startedAtRef.current) / 1000);
      const lvl = LEVELS[levelIdxRef.current];
      const intervalMs = intervalForSpeed(lvl.speed) * 1000;
      const sinceBeep = now - lastBeepAtRef.current;
      setNextBeepIn(Math.max(0, (intervalMs - sinceBeep) / 1000));

      if (sinceBeep >= intervalMs) {
        lastBeepAtRef.current = now;
        const nextShuttle = shuttleRef.current + 1;
        if (nextShuttle > lvl.shuttles) {
          if (levelIdxRef.current + 1 >= LEVELS.length) {
            doubleBeep();
            finishAll();
            return;
          }
          levelIdxRef.current += 1;
          shuttleRef.current = 1;
          setLevelIdx(levelIdxRef.current);
          setShuttle(1);
          doubleBeep();
        } else {
          shuttleRef.current = nextShuttle;
          setShuttle(nextShuttle);
          beep(880, 80);
        }
      }
    }, 100);
  };

  const finishAll = () => {
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    setPhase("finished");
  };

  const handleStopAthlete = async (athleteId: string) => {
    const lvlIdx = levelIdxRef.current;
    const sht = shuttleRef.current;
    stoppedRef.current.add(athleteId);

    setStopped(prev => {
      const next = new Map(prev);
      next.set(athleteId, { levelIdx: lvlIdx, shuttle: sht, saved: false, saving: true });
      return next;
    });

    try {
      const targetUser = athleteId === "self" ? currentUserId! : athleteId;
      await onSave({
        userId: targetUser,
        level: LEVELS[lvlIdx].level,
        shuttle: sht,
        testType: mode,
        testedBy: mode === "coach" ? currentUserId : null,
      });
      setStopped(prev => {
        const next = new Map(prev);
        const existing = next.get(athleteId);
        if (existing) next.set(athleteId, { ...existing, saved: true, saving: false });
        return next;
      });
    } catch (e: any) {
      setStopped(prev => {
        const next = new Map(prev);
        const existing = next.get(athleteId);
        if (existing) next.set(athleteId, { ...existing, saving: false });
        return next;
      });
      toast({ title: t("error"), description: e?.message || "Save failed", variant: "destructive" });
    }

    if (stoppedRef.current.size >= activeParticipants.length) {
      finishAll();
    }
  };

  const reset = () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    setPhase("idle");
    setCountdown(5);
    setLevelIdx(0);
    setShuttle(1);
    setElapsed(0);
    setNextBeepIn(0);
    setStopped(new Map());
    stoppedRef.current = new Set();
    if (mode === "individual") setSelectedIds(new Set(["self"]));
    else setSelectedIds(new Set());
  };

  const currentLevel = LEVELS[levelIdx];
  const levelInterval = intervalForSpeed(currentLevel.speed);
  const beepProgressPct = Math.max(0, Math.min(100, (1 - nextBeepIn / levelInterval) * 100));

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-extrabold text-foreground">{t("beepTestTitle")}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
      </div>

      {phase === "idle" && (
        <div className="space-y-4">
          {mode === "coach" && athletes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" /> {t("beepTestSelectAthletes")}
                </label>
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {selectedIds.size === athletes.length ? t("beepTestDeselectAll") : t("beepTestSelectAll")}
                </button>
              </div>
              <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                {athletes.map(a => (
                  <label
                    key={a.athlete_id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={selectedIds.has(a.athlete_id)}
                      onCheckedChange={() => handleToggleAthlete(a.athlete_id)}
                    />
                    <span className="text-sm font-medium text-foreground">{a.display_name}</span>
                  </label>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <p className="text-xs text-muted-foreground">{selectedIds.size} {t("beepTestSelected")}</p>
              )}
            </div>
          )}
          <Button onClick={handleStart} size="lg" className="w-full h-12 text-base font-bold">
            {t("beepTestStart")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Léger 20m shuttle · 21 {t("beepTestLevel").toLowerCase()}s · {LEVELS[0].speed}–{LEVELS[LEVELS.length - 1].speed} km/h
          </p>
        </div>
      )}

      {phase === "countdown" && (
        <div className="text-center py-10 space-y-3">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{t("beepTestCountdown")}</p>
          <div key={countdown} className="text-9xl font-extrabold text-primary animate-in zoom-in duration-300">
            {countdown}
          </div>
        </div>
      )}

      {phase === "running" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="text-center space-y-0.5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("beepTestLevel")}</div>
              <div className="text-5xl font-extrabold text-primary">{currentLevel.level}</div>
              <div className="text-xs text-muted-foreground">{currentLevel.speed.toFixed(1)} km/h · {t("beepTestShuttle")} {shuttle}/{currentLevel.shuttles}</div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{t("beepTestNextBeep")}</span>
                <span className="font-mono">{nextBeepIn.toFixed(1)}s · {fmt(elapsed)}</span>
              </div>
              <Progress value={beepProgressPct} className="h-2.5" />
            </div>
          </div>

          <div className="space-y-2">
            {activeParticipants.map(a => {
              const stoppedData = stopped.get(a.athlete_id);
              const isActive = !stoppedData;
              return (
                <div
                  key={a.athlete_id}
                  className={cn(
                    "rounded-xl border p-3 flex items-center justify-between gap-3 transition-all",
                    isActive
                      ? "border-border bg-card"
                      : stoppedData?.saved
                        ? "border-green-500/30 bg-green-500/5 opacity-70"
                        : "border-border bg-muted/40 opacity-80"
                  )}
                >
                  <div className="min-w-0">
                    {mode === "coach" && (
                      <p className="text-sm font-semibold text-card-foreground truncate">{a.display_name}</p>
                    )}
                    {!isActive && stoppedData && (
                      <p className="text-xs text-muted-foreground">
                        {t("beepTestLevel")} {LEVELS[stoppedData.levelIdx].level} · {t("beepTestShuttle")} {stoppedData.shuttle}
                      </p>
                    )}
                  </div>
                  {isActive ? (
                    <Button
                      onClick={() => handleStopAthlete(a.athlete_id)}
                      variant="destructive"
                      size="sm"
                      className="shrink-0 font-bold px-4 h-10"
                    >
                      {t("beepTestStop")}
                    </Button>
                  ) : stoppedData?.saving ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
                  ) : stoppedData?.saved ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs font-semibold shrink-0">
                      <CheckCircle2 className="h-4 w-4" /> {t("beepTestSaved")}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {mode === "coach" && activeParticipants.length > 1 && (
            <Button variant="outline" size="sm" className="w-full" onClick={finishAll}>
              {t("beepTestEndAll")}
            </Button>
          )}
        </div>
      )}

      {phase === "finished" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-bold text-card-foreground">{t("beepTestFinished")}</p>
            <div className="space-y-2">
              {activeParticipants.map(a => {
                const res = stopped.get(a.athlete_id);
                if (!res) return null;
                const lvl = LEVELS[res.levelIdx];
                const vo2 = vo2maxEstimate(lvl.speed);
                const decimal = Math.round((lvl.level + res.shuttle / 100) * 100) / 100;
                return (
                  <div key={a.athlete_id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                    {mode === "coach" && (
                      <span className="text-sm font-semibold text-card-foreground truncate flex-1">{a.display_name}</span>
                    )}
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary">
                        {t("beepTestLevel")} {lvl.level} · {t("beepTestShuttle")} {res.shuttle}
                        <span className="text-xs text-muted-foreground font-normal ml-1">({decimal.toFixed(2)})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t("beepTestVO2")}: ~{vo2} ml/kg/min
                      </div>
                    </div>
                    {res.saved
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : <span className="text-xs text-amber-500 shrink-0">{t("beepTestNotSaved")}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <Button onClick={reset} variant="outline" size="lg" className="w-full h-12">
            {t("beepTestRunAgain")}
          </Button>
        </div>
      )}
    </div>
  );
}
