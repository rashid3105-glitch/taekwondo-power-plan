import { useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Shield, Dumbbell, Battery, Download, Loader2, Check, Layers, Youtube, CalendarPlus, Bell, BellOff, ArrowLeftRight, Trash2, Plus, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { ExercisePicker } from "@/components/ExercisePicker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useOfflineWorkoutLogs, type WorkoutLog } from "@/hooks/useOfflineWorkoutLogs";
import { useExerciseFeedback, type ExerciseFeedback } from "@/hooks/useExerciseFeedback";
import { ExerciseFeedbackPanel, ExerciseFeedbackView } from "@/components/coach/ExerciseFeedbackPanel";
import { Badge } from "@/components/ui/badge";
import { PeriodizationView } from "@/components/PeriodizationView";
import { cn } from "@/lib/utils";
import { MuscleGroupBadges } from "@/components/MuscleIcon";
import { useLanguage } from "@/i18n/LanguageContext";
import { CalendarDropdown } from "@/components/CalendarDropdown";
import { TrainingReminder } from "@/components/TrainingReminder";
import { normalizeDaySessions, type PlanSession } from "@/lib/planSessionUtils";
import { localizeDayOfWeek, localizeExerciseName } from "@/lib/planTranslation";

const CATEGORY_DOT: Record<string, string> = {
  power: "bg-accent",
  speed: "bg-speed",
  strength: "bg-primary",
  mobility: "bg-accent",
  plyometric: "bg-explosive",
};

const TYPE_BADGES: Record<string, { label: string; className: string; icon: typeof Shield }> = {
  tkd: { label: "Taekwondo", className: "bg-gradient-energy", icon: Shield },
  gym: { label: "Gym Session", className: "bg-gradient-power", icon: Dumbbell },
  recovery: { label: "Recovery", className: "bg-speed/20 text-speed", icon: Battery },
};

interface AIPlanCardProps {
  plan: {
    id: string;
    name: string;
    plan_data: any;
    created_at: string;
    user_id?: string;
  };
  onPlanUpdated?: () => void;
  /** When true, render coach-side feedback editor under each logged exercise */
  coachMode?: boolean;
  /** Required when coachMode=true; the athlete this plan belongs to */
  athleteUserId?: string;
}

function renderSessionExercisesPDF(doc: any, session: PlanSession, margin: number, pageW: number, y: number, checkSpace: (n: number) => void) {
  const typeLabel = TYPE_BADGES[session.type]?.label || session.type;

  checkSpace(30);
  doc.setFillColor(30, 35, 50);
  doc.roundedRect(margin, y, pageW, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255);
  doc.text(`${session.label}`, margin + 4, y + 7);
  doc.setFontSize(8);
  doc.text(typeLabel.toUpperCase(), margin + pageW - 4, y + 7, { align: "right" });
  doc.setTextColor(0);
  y += 14;

  if (session.focus) {
    checkSpace(8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Focus: ${session.focus}`, margin + 2, y);
    doc.setTextColor(0);
    y += 6;
  }

  const exercises = session.exercises || [];
  if (exercises.length > 0) {
    checkSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("#", margin + 2, y);
    doc.text("Exercise", margin + 10, y);
    doc.text("Sets×Reps", margin + 90, y);
    doc.text("Rest", margin + 120, y);
    doc.text("Tempo", margin + 145, y);
    doc.setTextColor(0);
    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + pageW, y);
    y += 4;

    for (let j = 0; j < exercises.length; j++) {
      const ex = exercises[j];
      checkSpace(20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(String(j + 1).padStart(2, "0"), margin + 2, y);
      doc.setFont("helvetica", "bold");
      doc.text(ex.name || "", margin + 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${ex.sets}×${ex.reps}`, margin + 90, y);
      doc.text(ex.rest || "", margin + 120, y);
      doc.text(ex.tempo || "—", margin + 145, y);
      y += 5;

      if (ex.coachingCue) {
        checkSpace(8);
        doc.setFontSize(8);
        doc.setTextColor(80);
        const cueLines = doc.splitTextToSize(`Coaching: ${ex.coachingCue}`, pageW - 12);
        doc.text(cueLines, margin + 10, y);
        y += cueLines.length * 3.5;
        doc.setTextColor(0);
      }

      if (ex.whyItMatters) {
        checkSpace(8);
        doc.setFontSize(8);
        doc.setTextColor(0, 130, 130);
        const whyLines = doc.splitTextToSize(`Why for TKD: ${ex.whyItMatters}`, pageW - 12);
        doc.text(whyLines, margin + 10, y);
        y += whyLines.length * 3.5;
        doc.setTextColor(0);
      }

      if (ex.alternatives?.length > 0) {
        checkSpace(12);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100);
        doc.text("Alternatives:", margin + 10, y);
        y += 3.5;
        doc.setFont("helvetica", "normal");
        for (const alt of ex.alternatives) {
          const altLine = doc.splitTextToSize(`• ${alt.name} — ${alt.reason}`, pageW - 14);
          doc.text(altLine, margin + 12, y);
          y += altLine.length * 3.5;
        }
        doc.setTextColor(0);
      }

      y += 3;
    }
  } else {
    checkSpace(10);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Follow your dojang's programming for this session.", margin + 4, y);
    doc.setTextColor(0);
    y += 6;
  }

  return y;
}

async function generatePDF(plan: AIPlanCardProps["plan"]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const schedule = plan.plan_data?.weeklySchedule || [];
  const margin = 15;
  const pageW = 210 - margin * 2;
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkSpace = (needed: number) => { if (y + needed > 280) addPage(); };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(plan.name, margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated ${new Date(plan.created_at).toLocaleDateString()}`, margin, y);
  y += 12;
  doc.setTextColor(0);

  for (const day of schedule) {
    // Day header
    checkSpace(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 35, 50);
    doc.text(day.dayOfWeek, margin, y);
    doc.setTextColor(0);
    y += 8;

    const sessions = normalizeDaySessions(day);
    for (const session of sessions) {
      y = renderSessionExercisesPDF(doc, session, margin, pageW, y, checkSpace);
      y += 4;
    }
    y += 4;
  }

  doc.save(`${plan.name.replace(/\s+/g, "_")}.pdf`);
}

// Map any-language day name to a 0-6 index for translation lookup
const DAY_NAMES_ALL = [
  ["monday","mandag","måndag","montag","mon","man","mån","mo"],
  ["tuesday","tirsdag","tisdag","dienstag","tue","tir","tis","di"],
  ["wednesday","onsdag","onsdag","mittwoch","wed","ons","mi"],
  ["thursday","torsdag","torsdag","donnerstag","thu","tor","do"],
  ["friday","fredag","fredag","freitag","fri","fre","fr"],
  ["saturday","saturday","lørdag","lördag","samstag","sat","lør","lör","sa"],
  ["sunday","søndag","söndag","sonntag","sun","søn","sön","so"],
];
const DAY_SHORT_KEYS = ["monShort","tueShort","wedShort","thuShort","friShort","satShort","sunShort"] as const;

function translateDayShort(dayOfWeek: string, t: (k: string) => string): string {
  const lower = dayOfWeek?.toLowerCase().trim() || "";
  for (let i = 0; i < DAY_NAMES_ALL.length; i++) {
    if (DAY_NAMES_ALL[i].some(n => lower.startsWith(n) || lower === n)) {
      return t(DAY_SHORT_KEYS[i]);
    }
  }
  return dayOfWeek?.slice(0, 3)?.toUpperCase() || "?";
}

export function AIPlanCard({ plan, onPlanUpdated, coachMode = false, athleteUserId }: AIPlanCardProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [pickerMode, setPickerMode] = useState<{ dayIndex: number; sessionIndex: number; exerciseIndex?: number } | null>(null);
  const [localPlanData, setLocalPlanData] = useState(plan.plan_data);
  const schedule = localPlanData?.weeklySchedule || [];
  const periodization = localPlanData?.periodization || [];
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const { upsertLog, getLog, today, isPending } = useOfflineWorkoutLogs(plan.id, selectedDay, activeSessionIndex);

  // Feedback: collect ids of logs currently shown so we can fetch their feedback
  const visibleLogIds = (selectedDay !== null
    ? (localPlanData?.weeklySchedule?.[selectedDay] ? normalizeDaySessions(localPlanData.weeklySchedule[selectedDay]) : [])
        .flatMap((_: any, sIdx: number) => {
          const session = normalizeDaySessions(localPlanData.weeklySchedule[selectedDay])[sIdx];
          return (session?.exercises || []).map((_: any, eIdx: number) => getLog(eIdx)?.id).filter(Boolean);
        })
    : []) as string[];
  const { byLog: feedbackByLog, refresh: refreshFeedback, markRead } = useExerciseFeedback(visibleLogIds);
  const effectiveAthleteId = athleteUserId ?? plan.user_id ?? "";

  // Get sessions for currently selected day
  const currentDaySessions = selectedDay !== null && schedule[selectedDay]
    ? normalizeDaySessions(schedule[selectedDay])
    : [];

  // Ensure activeSessionIndex is valid
  const safeSessionIndex = Math.min(activeSessionIndex, Math.max(0, currentDaySessions.length - 1));
  const currentSession = currentDaySessions[safeSessionIndex];

  const savePlanData = useCallback(async (newPlanData: any) => {
    setLocalPlanData(newPlanData);
    const { error } = await supabase
      .from("training_plans")
      .update({ plan_data: newPlanData })
      .eq("id", plan.id);
    if (error) {
      toast({ title: "Failed to save changes", variant: "destructive" });
    } else {
      toast({ title: "Plan updated!" });
      onPlanUpdated?.();
    }
  }, [plan.id, toast, onPlanUpdated]);

  const getSessionExercises = useCallback((dayIndex: number, sessionIdx: number) => {
    const day = localPlanData?.weeklySchedule?.[dayIndex];
    if (!day) return [];
    const sessions = normalizeDaySessions(day);
    return sessions[sessionIdx]?.exercises || [];
  }, [localPlanData]);

  const updateSessionExercises = useCallback((dayIndex: number, sessionIdx: number, newExercises: any[]) => {
    const newData = JSON.parse(JSON.stringify(localPlanData));
    const day = newData.weeklySchedule[dayIndex];
    const sessions = normalizeDaySessions(day);
    sessions[sessionIdx] = { ...sessions[sessionIdx], exercises: newExercises };
    // Always store in sessions format
    newData.weeklySchedule[dayIndex] = {
      ...day,
      sessions,
      // Also update top-level exercises for single-session backward compat
      exercises: sessions.length === 1 ? newExercises : day.exercises,
    };
    return newData;
  }, [localPlanData]);

  const handleRemoveExercise = useCallback((dayIndex: number, exerciseIndex: number) => {
    const exercises = [...getSessionExercises(dayIndex, safeSessionIndex)];
    exercises.splice(exerciseIndex, 1);
    savePlanData(updateSessionExercises(dayIndex, safeSessionIndex, exercises));
  }, [getSessionExercises, safeSessionIndex, savePlanData, updateSessionExercises]);

  const handleSwapExercise = useCallback((dayIndex: number, exerciseIndex: number, picked: any) => {
    const exercises = [...getSessionExercises(dayIndex, safeSessionIndex)];
    const existing = exercises[exerciseIndex];
    exercises[exerciseIndex] = {
      ...existing,
      name: picked.name,
      category: picked.category,
      muscleGroups: picked.muscleGroups,
      sets: picked.sets,
      reps: picked.reps,
      tempo: picked.tempo,
      rest: picked.rest,
      coachingCue: picked.coachingCue || existing.coachingCue,
      whyItMatters: picked.whyItMatters || existing.whyItMatters,
      alternatives: picked.alternatives || [],
    };
    savePlanData(updateSessionExercises(dayIndex, safeSessionIndex, exercises));
  }, [getSessionExercises, safeSessionIndex, savePlanData, updateSessionExercises]);

  const handleAddExercise = useCallback((dayIndex: number, picked: any) => {
    const exercises = [...getSessionExercises(dayIndex, safeSessionIndex)];
    exercises.push({
      name: picked.name,
      category: picked.category,
      muscleGroups: picked.muscleGroups,
      sets: picked.sets,
      reps: picked.reps,
      tempo: picked.tempo,
      rest: picked.rest,
      coachingCue: picked.coachingCue || "",
      whyItMatters: picked.whyItMatters || "",
      alternatives: picked.alternatives || [],
    });
    savePlanData(updateSessionExercises(dayIndex, safeSessionIndex, exercises));
  }, [getSessionExercises, safeSessionIndex, savePlanData, updateSessionExercises]);

  const handleDownload = async () => {
    setExporting(true);
    try {
      await generatePDF({ ...plan, plan_data: localPlanData });
      toast({ title: "PDF downloaded!" });
    } catch {
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleReorderExercises = useCallback((dayIndex: number, oldIndex: number, newIndex: number) => {
    const exercises = [...getSessionExercises(dayIndex, safeSessionIndex)];
    const reordered = arrayMove(exercises, oldIndex, newIndex);
    savePlanData(updateSessionExercises(dayIndex, safeSessionIndex, reordered));
  }, [getSessionExercises, safeSessionIndex, savePlanData, updateSessionExercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-foreground truncate">{plan.name}</h2>
          <p className="text-xs text-muted-foreground">
            Generated {new Date(plan.created_at).toLocaleDateString()} · Logging for {new Date(today).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          <TrainingReminder planId={plan.id} schedule={schedule} />
          <CalendarDropdown plan={plan} />
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline ml-1">PDF</span>
          </Button>
          <span className="text-xs bg-speed/20 text-speed px-2 py-1 rounded-full font-semibold">Active</span>
        </div>
      </div>

      {/* Tab toggle */}
      {periodization.length > 0 && (
        <div className="flex rounded-lg border border-border bg-secondary/30 p-0.5">
          <button
            onClick={() => setActiveTab("schedule")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "schedule" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Dumbbell className="h-3.5 w-3.5" /> Weekly Schedule
          </button>
          <button
            onClick={() => setActiveTab("periodization")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "periodization" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" /> Periodization
          </button>
        </div>
      )}

      {/* Periodization view */}
      {activeTab === "periodization" && periodization.length > 0 && (
        <PeriodizationView periodization={periodization} programWeeks={plan.plan_data?.programWeeks} />
      )}

      {/* Week overview */}
      {activeTab === "schedule" && (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
            {schedule.map((day: any, i: number) => {
              const sessions = normalizeDaySessions(day);
              const primaryType = sessions[0]?.type || "rest";
              const config = TYPE_BADGES[primaryType] || TYPE_BADGES.gym;
              const Icon = config.icon;
              const isSelected = selectedDay === i;
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDay(isSelected ? null : i); setActiveSessionIndex(0); }}
                  className={`group flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg border-2 p-2 sm:p-2.5 transition-all cursor-pointer hover:bg-secondary/50 ${
                    isSelected ? "border-primary bg-secondary shadow-glow" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    isSelected 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(190_95%_50%)]" 
                      : "text-muted-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(190_95%_50%/0.5)]"
                  }`}>
                    {translateDayShort(day.dayOfWeek, t)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {sessions.map((sess: PlanSession, si: number) => {
                      const sessConfig = TYPE_BADGES[sess.type] || TYPE_BADGES.gym;
                      const SessIcon = sessConfig.icon;
                      return <SessIcon key={si} className={`h-3.5 w-3.5 transition-all ${
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      }`} />;
                    })}
                  </div>
                  <span className={`text-[8px] sm:text-[9px] font-medium text-center leading-tight transition-all ${
                    isSelected 
                      ? "text-primary drop-shadow-[0_0_8px_hsl(190_95%_50%/0.8)]" 
                      : "text-foreground group-hover:text-primary group-hover:drop-shadow-[0_0_6px_hsl(190_95%_50%/0.5)]"
                  }`}>
                    {sessions.length > 1 ? `${sessions.length} ${t("nSessions")}` : (day.label || sessions[0]?.label)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Day detail */}
          {selectedDay !== null && schedule[selectedDay] && (
            <div className="animate-slide-up rounded-xl border border-border bg-card p-3 sm:p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{localizeDayOfWeek(schedule[selectedDay].dayOfWeek, locale)}</h3>
                </div>
                <CalendarDropdown plan={plan} dayIndex={selectedDay} />
              </div>

              {/* Session tabs if multiple sessions */}
              {currentDaySessions.length > 1 && (
                <div className="flex gap-1 mb-4 rounded-lg border border-border bg-secondary/30 p-0.5">
                  {currentDaySessions.map((sess, si) => {
                    const sessConfig = TYPE_BADGES[sess.type] || TYPE_BADGES.gym;
                    const SessIcon = sessConfig.icon;
                    return (
                      <button
                        key={si}
                        onClick={() => setActiveSessionIndex(si)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all",
                          safeSessionIndex === si
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <SessIcon className="h-3.5 w-3.5" />
                        {sess.label || sessConfig.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Current session header */}
              {currentSession && (
                <>
                  {currentDaySessions.length === 1 && (
                    <p className="text-sm font-semibold text-foreground mb-1">{currentSession.label}</p>
                  )}
                  {currentSession.focus && (
                    <p className="text-sm text-muted-foreground mb-3">{currentSession.focus}</p>
                  )}
                </>
              )}

              {currentSession?.exercises?.length ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event: DragEndEvent) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIndex = Number(String(active.id).split("-").pop());
                      const newIndex = Number(String(over.id).split("-").pop());
                      handleReorderExercises(selectedDay, oldIndex, newIndex);
                    }
                  }}
                >
                  <SortableContext
                    items={currentSession.exercises.map((_: any, j: number) => `ex-${j}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {currentSession.exercises.map((ex: any, j: number) => {
                        const log = getLog(j);
                        const fb = log?.id ? feedbackByLog(log.id) : [];
                        return (
                          <SortableExerciseRow
                            key={`ex-${j}`}
                            id={`ex-${j}`}
                            exercise={ex}
                            index={j + 1}
                            log={log}
                            pending={isPending(j)}
                            onToggleComplete={(completed) => upsertLog(j, { completed })}
                            onUpdateSets={(actual_sets) => upsertLog(j, { actual_sets })}
                            onUpdateReps={(actual_reps) => upsertLog(j, { actual_reps })}
                            onUpdateNotes={(notes) => upsertLog(j, { notes })}
                            onSwap={() => setPickerMode({ dayIndex: selectedDay, sessionIndex: safeSessionIndex, exerciseIndex: j })}
                            onRemove={() => handleRemoveExercise(selectedDay, j)}
                            coachMode={coachMode}
                            athleteUserId={effectiveAthleteId}
                            feedback={fb}
                            onFeedbackChanged={refreshFeedback}
                            onMarkFeedbackRead={markRead}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Follow your dojang's programming for this session.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => setPickerMode({ dayIndex: selectedDay, sessionIndex: safeSessionIndex })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Exercise
              </Button>
            </div>
          )}

          {/* Exercise Picker */}
          <ExercisePicker
            open={!!pickerMode}
            onClose={() => setPickerMode(null)}
            title={pickerMode?.exerciseIndex !== undefined ? "Swap Exercise" : "Add Exercise"}
            onSelect={(picked) => {
              if (!pickerMode) return;
              if (pickerMode.exerciseIndex !== undefined) {
                handleSwapExercise(pickerMode.dayIndex, pickerMode.exerciseIndex, picked);
              } else {
                handleAddExercise(pickerMode.dayIndex, picked);
              }
            }}
          />
        </>
      )}
    </div>
  );
}

interface AIExerciseRowProps {
  exercise: any;
  index: number;
  log?: WorkoutLog;
  pending?: boolean;
  onToggleComplete: (completed: boolean) => void;
  onUpdateSets: (sets: number | null) => void;
  onUpdateReps: (reps: string | null) => void;
  onUpdateNotes: (notes: string | null) => void;
  onSwap: () => void;
  onRemove: () => void;
  coachMode?: boolean;
  athleteUserId?: string;
  feedback?: ExerciseFeedback[];
  onFeedbackChanged?: () => void;
  onMarkFeedbackRead?: (id: string) => void;
}

function SortableExerciseRow(props: AIExerciseRowProps & { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <AIExerciseRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function AIExerciseRow({ exercise, index, log, pending, onToggleComplete, onUpdateSets, onUpdateReps, onUpdateNotes, onSwap, onRemove, coachMode, athleteUserId, feedback, onFeedbackChanged, onMarkFeedbackRead, dragHandleProps }: AIExerciseRowProps & { dragHandleProps?: any }) {
  const [open, setOpen] = useState(false);
  const { locale, t } = useLanguage();
  const completed = log?.completed ?? false;
  const displayName = localizeExerciseName(exercise.name, locale);

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-all",
      completed ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/30"
    )}>
      {/* Row 1: drag handle, checkbox, name */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-1">
        <div
          {...dragHandleProps}
          className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
          <Checkbox
            checked={completed}
            onCheckedChange={(checked) => onToggleComplete(!!checked)}
            className="h-5 w-5"
          />
        </div>
        <span className="mono text-xs text-muted-foreground w-5 text-center">{String(index).padStart(2, "0")}</span>
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${CATEGORY_DOT[exercise.category] || "bg-muted"}`} />
        <button
          onClick={() => setOpen(!open)}
          className="flex-1 min-w-0 text-left cursor-pointer"
        >
          <span className={cn(
            "font-semibold text-sm block truncate",
            completed ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {displayName}
          </span>
        </button>
        {pending && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border text-muted-foreground bg-secondary flex-shrink-0">
            {t("workoutLogPending")}
          </Badge>
        )}
        {completed && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
      </div>

      {/* Row 2: sets×reps + action icons */}
      <div className="flex items-center gap-2 px-2 pb-2 pl-[4.5rem]">
        <span className="text-xs text-muted-foreground font-medium">
          {log?.actual_sets ?? exercise.sets}×{log?.actual_reps ?? exercise.reps}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <div className="flex-1" />
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(displayName + ' exercise form')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Watch demo on YouTube"
        >
          <Youtube className="h-4 w-4" />
        </a>
        <button
          onClick={onSwap}
          className="p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          title="Swap exercise"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          title="Remove exercise"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 animate-slide-up">
          {/* Logging inputs */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Log Your Workout</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Actual Sets</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  placeholder={String(exercise.sets)}
                  value={log?.actual_sets ?? ""}
                  onChange={(e) => onUpdateSets(e.target.value ? Number(e.target.value) : null)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Actual Reps</label>
                <Input
                  type="text"
                  placeholder={exercise.reps}
                  value={log?.actual_reps ?? ""}
                  onChange={(e) => onUpdateReps(e.target.value || null)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
                <Input
                  type="text"
                  placeholder="Weight, RPE, etc."
                  value={log?.notes ?? ""}
                  onChange={(e) => onUpdateNotes(e.target.value || null)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Coach feedback (athlete view) or editor (coach view) */}
          {coachMode && log?.id && athleteUserId ? (
            <ExerciseFeedbackPanel
              workoutLogId={log.id}
              athleteId={athleteUserId}
              existing={feedback?.[0]}
              onSaved={() => onFeedbackChanged?.()}
            />
          ) : !coachMode && feedback && feedback.length > 0 ? (
            <ExerciseFeedbackView feedback={feedback} onMarkRead={onMarkFeedbackRead} />
          ) : null}

          {/* Prescribed details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Prescribed Sets × Reps</p>
              <p className="text-sm font-bold text-foreground">{exercise.sets} × {exercise.reps}</p>
            </div>
            <div className="rounded-md bg-muted p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Rest</p>
              <p className="text-sm font-bold text-foreground">{exercise.rest}</p>
            </div>
            {exercise.tempo && (
              <div className="rounded-md bg-muted p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tempo</p>
                <p className="text-sm font-bold text-foreground">{exercise.tempo}</p>
              </div>
            )}
          </div>
          {exercise.muscleGroups?.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Muscles:</span>
              <MuscleGroupBadges muscles={exercise.muscleGroups} size={28} showLabels />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Coaching: </span>
            {exercise.coachingCue}
          </p>
          <p className="text-xs text-primary/80">
            <span className="font-semibold text-primary">Why for TKD: </span>
            {exercise.whyItMatters}
          </p>
          {exercise.alternatives?.length > 0 && (
            <div className="rounded-md bg-muted/60 p-2.5 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Alternatives</p>
              {exercise.alternatives.map((alt: any, k: number) => (
                <p key={k} className="text-xs text-foreground">
                  <span className="font-semibold">{localizeExerciseName(alt.name, locale)}</span>
                  <span className="text-muted-foreground"> — {alt.reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
