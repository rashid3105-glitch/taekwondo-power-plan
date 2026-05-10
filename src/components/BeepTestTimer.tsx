import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Wind, Loader2, X } from "lucide-react";

interface BeepLevel {
  level: number;
  shuttles: number;
  speed: number; // km/h
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

const intervalForSpeed = (speed: number) => Math.round((20 / (speed / 3.6)) * 10) / 10;

type Phase = "idle" | "countdown" | "running" | "finished";

interface BeepTestTimerProps {
  mode: "individual" | "coach";
  athletes?: Array<{ athlete_id: string; display_name: string }>;
  currentUserId: string | null;
  onSave: (params: {
    userId: string;
    level: number;
    shuttle: number;
    testType: "individual" | "coach";
    testedBy: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

export function BeepTestTimer({ mode, athletes = [], currentUserId, onSave, onClose }: BeepTestTimerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [countdown, setCountdown] = useState(5);
  const [levelIdx, setLevelIdx] = useState(0);
  const [shuttle, setShuttle] = useState(1);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [nextBeepIn, setNextBeepIn] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickRef = useRef<number | null>(null);
  const lastBeepAtRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const levelIdxRef = useRef(0);
  const shuttleRef = useRef(1);

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        audioCtxRef.current = new Ctx();
      } catch {
        // no audio
      }
    }
    return audioCtxRef.current;
  };

  const beep = (freq = 880, duration = 80) => {
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
    } catch {
      /* ignore */
    }
  };

  const doubleBeep = () => {
    beep(1100, 100);
    setTimeout(() => beep(1100, 100), 200);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const handleStart = () => {
    if (mode === "coach" && !selectedAthleteId) {
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
    setLevelIdx(0);
    setShuttle(1);
    setElapsed(0);
    setPhase("running");
    const now = performance.now();
    startedAtRef.current = now;
    lastBeepAtRef.current = now;
    // Initial beep marks start
    beep(880, 80);

    tickRef.current = window.setInterval(() => {
      const t = performance.now();
      const elapsedSec = (t - startedAtRef.current) / 1000;
      setElapsed(elapsedSec);

      const lvl = LEVELS[levelIdxRef.current];
      const interval = intervalForSpeed(lvl.speed) * 1000;
      const sinceBeep = t - lastBeepAtRef.current;
      const remaining = Math.max(0, (interval - sinceBeep) / 1000);
      setNextBeepIn(remaining);

      if (sinceBeep >= interval) {
        lastBeepAtRef.current = t;
        // Advance shuttle
        const nextShuttle = shuttleRef.current + 1;
        if (nextShuttle > lvl.shuttles) {
          // Level up
          if (levelIdxRef.current + 1 >= LEVELS.length) {
            // Maxed out
            doubleBeep();
            finish();
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

  const finish = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setPhase("finished");
  };

  const handleStop = () => {
    finish();
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
    setSaved(false);
  };

  const currentLevel = LEVELS[levelIdx];
  const decimalLevel = Math.round((currentLevel.level + shuttle / 100) * 100) / 100;
  // Simplified Ramsbottom VO2max estimate from speed
  const vo2max = Math.round((currentLevel.speed * 6 - 27.4) * 10) / 10;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    const targetUser = mode === "coach" ? selectedAthleteId : currentUserId;
    if (!targetUser) return;
    setSaving(true);
    try {
      await onSave({
        userId: targetUser,
        level: currentLevel.level,
        shuttle,
        testType: mode,
        testedBy: mode === "coach" ? currentUserId : null,
      });
      setSaved(true);
      toast({ title: t("beepTestSaved") });
    } catch (e: any) {
      toast({ title: t("error"), description: e?.message || "Save failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const levelInterval = intervalForSpeed(currentLevel.speed);
  const beepProgressPct = Math.max(0, Math.min(100, (1 - nextBeepIn / levelInterval) * 100));

  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-extrabold text-foreground">{t("beepTestTitle")}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {phase === "idle" && (
        <div className="space-y-4">
          {mode === "coach" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{t("beepTestSelectAthlete")}</label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("beepTestSelectAthlete")} />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((a) => (
                    <SelectItem key={a.athlete_id} value={a.athlete_id}>
                      {a.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleStart} size="lg" className="w-full h-12 text-base font-bold">
            {t("beepTestStart")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Léger 20m shuttle test · 21 levels · {LEVELS[0].speed}–{LEVELS[LEVELS.length - 1].speed} km/h
          </p>
        </div>
      )}

      {phase === "countdown" && (
        <div className="text-center py-12 space-y-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{t("beepTestCountdown")}</p>
          <div
            key={countdown}
            className="text-9xl font-extrabold text-primary animate-in zoom-in duration-300"
          >
            {countdown}
          </div>
        </div>
      )}

      {phase === "running" && (
        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("beepTestLevel")}</div>
            <div className="text-6xl font-extrabold text-primary">{currentLevel.level}</div>
            <div className="text-sm text-muted-foreground">{currentLevel.speed.toFixed(1)} km/h</div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5">
              <span>{t("beepTestShuttle")} {shuttle} / {currentLevel.shuttles}</span>
              <span>{formatTime(elapsed)}</span>
            </div>
            <Progress value={(shuttle / currentLevel.shuttles) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1.5">
              <span>{t("beepTestNextBeep")}</span>
              <span className="font-mono">{nextBeepIn.toFixed(1)}s</span>
            </div>
            <Progress value={beepProgressPct} className="h-3" />
          </div>

          <Button
            onClick={handleStop}
            variant="destructive"
            size="lg"
            className="w-full h-14 text-base font-bold"
          >
            {t("beepTestStop")}
          </Button>
        </div>
      )}

      {phase === "finished" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 text-center space-y-3">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">{t("beepTestFinished")}</p>
            <div>
              <div className="text-xs text-muted-foreground">{t("beepTestResult")}</div>
              <div className="text-4xl font-extrabold text-primary mt-1">
                {t("beepTestLevel")} {currentLevel.level} · {t("beepTestShuttle")} {shuttle}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">({decimalLevel.toFixed(2)})</div>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="text-xs text-muted-foreground">{t("beepTestVO2")}</div>
              <div className="text-2xl font-bold text-foreground mt-1">~{vo2max} ml/kg/min</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={reset} variant="outline" size="lg" className="h-12">
              {t("beepTestRunAgain")}
            </Button>
            <Button onClick={handleSave} disabled={saving || saved} size="lg" className="h-12">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {saved ? t("beepTestSaved") : t("beepTestSave")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
