import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, X, Zap, Heart, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { haptics } from "@/lib/haptics";
import type { HiitInterval } from "@/data/hiitWorkouts";

interface HiitRunnerProps {
  open: boolean;
  onClose: () => void;
  intervals: HiitInterval[];
  workoutName: string;
}

function beep(freq = 880, dur = 150) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur / 1000);
    osc.start();
    osc.stop(ctx.currentTime + dur / 1000);
  } catch {}
}

export function HiitRunner({ open, onClose, intervals, workoutName }: HiitRunnerProps) {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(intervals[0]?.duration ?? 0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tickRef = useRef<number | null>(null);

  // reset on open / intervals change
  useEffect(() => {
    if (open) {
      setIdx(0);
      setTimeLeft(intervals[0]?.duration ?? 0);
      setRunning(false);
      setDone(false);
    }
  }, [open, intervals]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // interval complete
          const next = idx + 1;
          if (next >= intervals.length) {
            setRunning(false);
            setDone(true);
            triggerHaptic("success");
            beep(523, 250);
            setTimeout(() => beep(659, 250), 200);
            setTimeout(() => beep(784, 350), 400);
            return 0;
          }
          setIdx(next);
          triggerHaptic("medium");
          beep(intervals[next].type === "WORK" ? 880 : 440, 200);
          return intervals[next].duration;
        }
        if (t <= 4) {
          // countdown beeps
          beep(660, 80);
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running, idx, intervals]);

  const cur = intervals[idx];
  const isWork = cur?.type === "WORK";
  const totalRounds = intervals.filter((i) => i.type === "WORK").length;
  const currentRound = intervals.slice(0, idx + 1).filter((i) => i.type === "WORK").length;

  // Circle progress
  const circ = 2 * Math.PI * 88;
  const progress = cur ? (cur.duration - timeLeft) / cur.duration : 0;
  const dash = circ - progress * circ;

  const reset = () => {
    setIdx(0);
    setTimeLeft(intervals[0].duration);
    setRunning(false);
    setDone(false);
    triggerHaptic("light");
  };

  const toggleRun = () => {
    setRunning((r) => !r);
    triggerHaptic("light");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-secondary/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive" fill="currentColor" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {t("hiitRunnerTitle")}
              </div>
              <div className="text-sm font-extrabold text-foreground leading-tight">{workoutName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Trophy className="h-16 w-16 text-accent mb-4" />
            <div className="text-2xl font-extrabold text-foreground mb-1">{t("hiitDone")}</div>
            <div className="text-sm text-muted-foreground mb-6 text-center">
              {totalRounds} {t("hiitRoundsLabel")}
            </div>
            <div className="flex gap-2 w-full">
              <Button onClick={reset} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                {t("hiitRunAgain")}
              </Button>
              <Button onClick={onClose} className="flex-1">
                {t("close")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Timer circle */}
            <div className="relative flex items-center justify-center py-6">
              <svg width="220" height="220" className="-rotate-90">
                <circle
                  cx="110"
                  cy="110"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="6"
                />
                <circle
                  cx="110"
                  cy="110"
                  r="88"
                  fill="none"
                  stroke={isWork ? "hsl(var(--destructive))" : "hsl(var(--accent))"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dash}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1 px-2 py-0.5 rounded-full flex items-center gap-1",
                    isWork
                      ? "text-destructive bg-destructive/10"
                      : "text-accent-foreground bg-accent/20"
                  )}
                >
                  {isWork ? <Zap className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
                  {isWork ? t("hiitWork") : t("hiitRest")}
                </div>
                <div className="text-6xl font-extrabold text-foreground tabular-nums leading-none">
                  {timeLeft}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-bold">
                  {t("hiitSeconds")}
                </div>
              </div>
            </div>

            {/* Current interval info */}
            <div className="px-5 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                {currentRound} / {totalRounds} · {idx + 1}/{intervals.length}
              </div>
              <div className="text-lg font-extrabold text-foreground leading-tight">{cur?.name}</div>
              {cur?.korean && (
                <div className="text-xs text-muted-foreground mt-0.5">{cur.korean}</div>
              )}
              {cur?.description && (
                <div className="text-xs text-muted-foreground mt-2">{cur.description}</div>
              )}
            </div>

            {/* Up next */}
            {intervals[idx + 1] && (
              <div className="mx-5 mt-4 rounded-lg border border-border bg-card/60 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground uppercase tracking-wider font-bold">
                  {t("hiitNext")}
                </span>
                <span className="font-bold text-foreground truncate ml-2">
                  {intervals[idx + 1].name}
                </span>
                <span className="text-muted-foreground ml-2 tabular-nums">
                  {intervals[idx + 1].duration}s
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-2 px-5 py-5">
              <Button
                onClick={toggleRun}
                size="lg"
                className={cn(
                  "flex-1 h-12 text-base font-bold uppercase tracking-wider",
                  running
                    ? "bg-muted text-foreground hover:bg-muted/80"
                    : isWork
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {running ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" fill="currentColor" />
                    {t("hiitPause")}
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" fill="currentColor" />
                    {idx === 0 && timeLeft === intervals[0]?.duration ? t("hiitStart") : t("hiitResume")}
                  </>
                )}
              </Button>
              <Button onClick={reset} variant="outline" size="lg" className="h-12 w-12 p-0">
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1 pb-5 px-5 flex-wrap">
              {intervals.map((iv, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i < idx
                      ? "bg-foreground/40 w-2"
                      : i === idx
                      ? iv.type === "WORK"
                        ? "bg-destructive w-6"
                        : "bg-accent w-6"
                      : iv.type === "WORK"
                      ? "bg-destructive/30 w-2"
                      : "bg-accent/30 w-2"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
