// Universal test runner. Renders the right widget based on TestDefinition.inputType.
// Saves to physical_test_results via the supplied onSave callback.

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Play, Square, RotateCcw, Save, X, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  type TestDefinition,
  localizedTestName,
  localizedProtocol,
} from "@/lib/testCatalog";

export interface TestRunResult {
  value: number;
  unit: string;
}

interface Props {
  def: TestDefinition;
  onSave: (r: TestRunResult) => Promise<void>;
  onCancel: () => void;
}

function formatSec(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export function TestRunner({ def, onSave, onCancel }: Props) {
  const { t, locale } = useLanguage();
  const [showProtocol, setShowProtocol] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stopwatch state (stopwatch, time_hold)
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAt = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown state
  const [countdownLeft, setCountdownLeft] = useState<number>(def.countdownSeconds || 0);
  const [countdownPhase, setCountdownPhase] = useState<"ready" | "running" | "done">("ready");

  // Number input (level, distance, weight, count, and post-countdown)
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const inputType = def.inputType;
  const isStopwatch = inputType === "stopwatch" || inputType === "time_hold";
  const isCountdown = inputType === "countdown";
  const isPureInput = !isStopwatch && !isCountdown;

  // ---- Stopwatch handlers ----
  const swStart = () => {
    if (running) return;
    startedAt.current = Date.now() - elapsedMs;
    setRunning(true);
    intervalRef.current = setInterval(() => {
      if (startedAt.current != null) setElapsedMs(Date.now() - startedAt.current);
    }, 50);
  };
  const swStop = () => {
    if (!running) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  };
  const swReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setElapsedMs(0);
    startedAt.current = null;
  };

  // ---- Countdown handlers ----
  const cdStart = () => {
    if (countdownPhase !== "ready") return;
    setCountdownPhase("running");
    const total = def.countdownSeconds || 0;
    const endsAt = Date.now() + total * 1000;
    intervalRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setCountdownLeft(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setCountdownPhase("done");
      }
    }, 200);
  };
  const cdReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setCountdownLeft(def.countdownSeconds || 0);
    setCountdownPhase("ready");
    setInputValue("");
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    let value: number | null = null;
    if (isStopwatch) {
      value = Math.round((elapsedMs / 1000) * 100) / 100;
      if (value <= 0) { setError(t("ptEnterFinalResult")); return; }
    } else {
      const raw = inputValue.replace(/\s+/g, "").replace(/,/g, ".");
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setError(t("invalidValue") || "Invalid number");
        return;
      }
      value = parsed;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ value, unit: def.unit });
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    isStopwatch ? !running && elapsedMs > 0
      : isCountdown ? countdownPhase === "done" && inputValue.trim().length > 0
      : inputValue.trim().length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-foreground">{localizedTestName(def, locale)}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t(`ptCat_${def.category}`)} · {def.direction === "lower_is_better" ? t("ptDirection_lower") : t("ptDirection_higher")}
        </p>
      </div>

      <button
        type="button"
        className="text-xs flex items-center gap-1.5 text-primary hover:underline"
        onClick={() => setShowProtocol((s) => !s)}
      >
        <Info className="h-3.5 w-3.5" />
        {showProtocol ? t("ptHideProtocol") : t("ptShowProtocol")}
      </button>
      {showProtocol && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground leading-relaxed">
          {localizedProtocol(def, locale)}
        </div>
      )}

      {/* Widget area */}
      {isStopwatch && (
        <div className="rounded-xl border border-border bg-card p-5 text-center space-y-3">
          <div className="font-mono text-5xl font-bold tabular-nums tracking-tight text-primary">
            {formatSec(elapsedMs)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("ptElapsed")}</div>
          <div className="flex justify-center gap-2">
            {!running ? (
              <Button onClick={swStart} size="lg" className="gap-1.5">
                <Play className="h-4 w-4" /> {t("ptStartTimer")}
              </Button>
            ) : (
              <Button onClick={swStop} size="lg" variant="destructive" className="gap-1.5">
                <Square className="h-4 w-4" /> {t("ptStopTimer")}
              </Button>
            )}
            <Button onClick={swReset} size="lg" variant="outline" className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> {t("ptResetTimer")}
            </Button>
          </div>
        </div>
      )}

      {isCountdown && (
        <div className="rounded-xl border border-border bg-card p-5 text-center space-y-3">
          <div className="font-mono text-5xl font-bold tabular-nums text-primary">
            {countdownLeft}s
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {countdownPhase === "ready"
              ? `${t("ptCountdownSeconds")} · ${def.countdownSeconds}s`
              : countdownPhase === "running"
              ? t("ptCountdownReady")
              : t("ptCountdownDone")}
          </div>
          <div className="flex justify-center gap-2">
            {countdownPhase === "ready" && (
              <Button onClick={cdStart} size="lg" className="gap-1.5">
                <Play className="h-4 w-4" /> {t("ptStartTimer")}
              </Button>
            )}
            {countdownPhase !== "ready" && (
              <Button onClick={cdReset} size="lg" variant="outline" className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> {t("ptResetTimer")}
              </Button>
            )}
          </div>
          {countdownPhase === "done" && (
            <div className="pt-2">
              <label className="block text-xs text-muted-foreground mb-1 text-left">
                {t("ptEnterFinalResult")} ({def.unit})
              </label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={t("ptInputPlaceholder")}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {isPureInput && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <label className="block text-xs text-muted-foreground">
            {t("ptEnterFinalResult")} ({def.unit})
          </label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder={t("ptInputPlaceholder")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
            className="h-14 text-2xl font-mono font-bold text-center"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving} className="gap-1.5">
          <X className="h-4 w-4" /> {t("ptCancelTest")}
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("ptConfirmSave")}
        </Button>
      </div>
    </div>
  );
}
