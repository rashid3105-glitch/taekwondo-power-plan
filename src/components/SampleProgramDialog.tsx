import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Eye, Dumbbell, Shield, Zap, Battery, ChevronDown, ChevronUp, Info } from "lucide-react";

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  cue: string;
  why: string;
}

interface TrainingDay {
  name: string;
  type: "strength" | "tkd" | "power" | "recovery";
  exercises: Exercise[];
}

interface Week {
  weekNum: number;
  phase: string;
  phaseColor: string;
  focus: string;
  days: TrainingDay[];
}

const PROGRAM: Record<string, Week[]> = {
  en: [
    {
      weekNum: 1, phase: "Anatomical Adaptation", phaseColor: "bg-muted text-muted-foreground", focus: "Build work capacity, movement quality, tendon prep",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Goblet Squat", sets: "3", reps: "10", rest: "90s", cue: "Sit between your hips, chest up — full depth every rep", why: "Builds squat pattern and hip mobility needed for deep chamber positions" },
          { name: "Single-Leg RDL", sets: "3", reps: "8/side", rest: "60s", cue: "Hinge from the hip, keep the back leg in line with your torso", why: "Develops posterior chain balance — critical for kick recovery and stance stability" },
          { name: "Copenhagen Plank", sets: "3", reps: "20s/side", rest: "45s", cue: "Top leg on bench, squeeze adductors hard, no hip drop", why: "Strengthens adductors to prevent groin injuries common in high kicks" },
          { name: "Band Pull-Apart", sets: "3", reps: "15", rest: "30s", cue: "Squeeze shoulder blades together, control the return", why: "Counters rounded posture from guard position, supports shoulder health" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Box Jump (step down)", sets: "4", reps: "5", rest: "90s", cue: "Explode up, land soft and quiet — step down, don't jump", why: "Teaches triple extension without eccentric stress — pure power output" },
          { name: "Med Ball Rotational Throw", sets: "3", reps: "6/side", rest: "60s", cue: "Load the back hip, rotate through the core, release at chest height", why: "Mimics rotational power used in roundhouse and turning kicks" },
          { name: "Pallof Press", sets: "3", reps: "10/side", rest: "45s", cue: "Press out slow, resist rotation — don't let the band pull you", why: "Anti-rotation core strength for maintaining balance during kicks" },
          { name: "Ankle Banded Walks", sets: "2", reps: "15/direction", rest: "30s", cue: "Small steps, knees tracking toes, stay low", why: "Prehab for ankle stability — the most common injury site in TKD" },
        ]},
        { name: "Friday", type: "strength", exercises: [
          { name: "Push-Up (tempo 3-1-1)", sets: "3", reps: "10", rest: "60s", cue: "3 sec down, 1 sec pause, 1 sec up — full range", why: "Builds pressing endurance and shoulder stability for clinch work" },
          { name: "Bulgarian Split Squat", sets: "3", reps: "8/side", rest: "90s", cue: "Front knee tracks over toes, rear foot elevated, stay upright", why: "Unilateral leg strength that directly transfers to single-leg kick power" },
          { name: "Dead Bug", sets: "3", reps: "8/side", rest: "45s", cue: "Press lower back into floor, opposite arm/leg extend together", why: "Teaches core bracing during limb movement — fundamental for kick control" },
          { name: "Face Pull", sets: "3", reps: "12", rest: "30s", cue: "Pull to forehead height, externally rotate at the end", why: "Balances shoulder muscles to prevent impingement from repetitive punching" },
        ]},
      ]
    },
    {
      weekNum: 2, phase: "Anatomical Adaptation", phaseColor: "bg-muted text-muted-foreground", focus: "Progress volume slightly, refine movement patterns",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Goblet Squat", sets: "3", reps: "12", rest: "90s", cue: "Add 2 reps from week 1 — same depth, same tempo", why: "Progressive overload through volume before adding intensity" },
          { name: "Single-Leg RDL", sets: "3", reps: "10/side", rest: "60s", cue: "Use a light dumbbell now if bodyweight feels easy", why: "Loading the pattern once movement quality is established" },
          { name: "Copenhagen Plank", sets: "3", reps: "25s/side", rest: "45s", cue: "5 seconds longer — maintain alignment throughout", why: "Time under tension progression for tendon adaptation" },
          { name: "Band Pull-Apart", sets: "3", reps: "18", rest: "30s", cue: "Increase reps, keep the squeeze at end range", why: "Volume-based progression for postural endurance" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Box Jump (step down)", sets: "4", reps: "5", rest: "90s", cue: "Same height — focus on faster takeoff, not higher box", why: "Rate of force development over absolute height" },
          { name: "Med Ball Rotational Throw", sets: "4", reps: "6/side", rest: "60s", cue: "One extra set — maintain max intent on every throw", why: "Volume increase in power work builds power endurance" },
          { name: "Pallof Press + Hold", sets: "3", reps: "8/side + 5s hold", rest: "45s", cue: "Add a 5-sec hold at full extension each rep", why: "Isometric component challenges anti-rotation under fatigue" },
          { name: "Single-Leg Calf Raise", sets: "3", reps: "12/side", rest: "30s", cue: "Full range — 2 sec up, 2 sec down, pause at top", why: "Calf/Achilles capacity for repeated bouncing and footwork" },
        ]},
        { name: "Friday", type: "strength", exercises: [
          { name: "Push-Up (tempo 3-1-1)", sets: "4", reps: "10", rest: "60s", cue: "Extra set — maintain tempo discipline, no sagging hips", why: "Volume progression in pressing pattern" },
          { name: "Bulgarian Split Squat", sets: "3", reps: "10/side", rest: "90s", cue: "2 more reps per side — keep torso vertical", why: "Progressive overload through rep increase" },
          { name: "Dead Bug + Band", sets: "3", reps: "8/side", rest: "45s", cue: "Hold a light band between hands and knees for resistance", why: "External load challenges core stability further" },
          { name: "Face Pull", sets: "3", reps: "15", rest: "30s", cue: "More reps, lighter weight if needed — quality over ego", why: "High-rep shoulder health work accumulates over time" },
        ]},
      ]
    },
    {
      weekNum: 3, phase: "Accumulation", phaseColor: "bg-primary/15 text-primary", focus: "Increase training volume, build strength base",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "8", rest: "2min", cue: "Barbell now — brace hard, hit parallel, drive through heels", why: "Primary lower body strength builder — hip and knee extension power" },
          { name: "Romanian Deadlift", sets: "3", reps: "10", rest: "90s", cue: "Bar stays close to legs, hinge until hamstring stretch, squeeze glutes up", why: "Posterior chain strength for kick chamber speed and landing stability" },
          { name: "Copenhagen Plank (weighted)", sets: "3", reps: "20s/side", rest: "45s", cue: "Add a small plate on hip — same alignment standards", why: "Progressive loading of adductors for kick injury prevention" },
          { name: "Dumbbell Row", sets: "3", reps: "10/side", rest: "60s", cue: "Pull to hip, squeeze lat, control the negative 2 seconds", why: "Upper back strength for guard position endurance and clinch" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Depth Jump to Broad Jump", sets: "4", reps: "4", rest: "2min", cue: "Step off 30cm box, absorb, immediately explode forward", why: "Reactive strength — trains the stretch-shortening cycle used in fast kicks" },
          { name: "Landmine Rotational Press", sets: "3", reps: "6/side", rest: "75s", cue: "Drive from the hip, press and rotate — one fluid movement", why: "Integrated rotational power from ground up, like a turning kick" },
          { name: "Hanging Knee Raise", sets: "3", reps: "12", rest: "45s", cue: "Curl pelvis up, don't just swing legs — control the descent", why: "Hip flexor strength for fast knee drive in kicks" },
          { name: "Band Resisted Shuffle", sets: "3", reps: "10/direction", rest: "45s", cue: "Stay low, push off aggressively, don't let feet click together", why: "Lateral footwork speed and hip stability for ring movement" },
        ]},
        { name: "Friday", type: "strength", exercises: [
          { name: "Bench Press", sets: "4", reps: "8", rest: "2min", cue: "Controlled descent, pause at chest, drive up fast", why: "Upper body pushing power for punch combinations and clinch pushes" },
          { name: "Front-Foot Elevated Split Squat", sets: "3", reps: "8/side", rest: "90s", cue: "Front foot on 5cm plate — deeper range, more quad and hip flexor work", why: "Increased range of motion strengthens kick chamber position" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "8", rest: "60s", cue: "Squeeze glutes, roll out only as far as you can control", why: "Anti-extension core strength prevents overarching during kicks" },
          { name: "Prone Y-Raise", sets: "3", reps: "12", rest: "30s", cue: "Thumbs up, lift arms in Y shape, hold 2 sec at top", why: "Lower trap activation for shoulder health and overhead guard position" },
        ]},
      ]
    },
    {
      weekNum: 4, phase: "Accumulation", phaseColor: "bg-primary/15 text-primary", focus: "Peak volume week — highest training load before deload",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "10", rest: "2min", cue: "Highest reps this block — stay tight, every rep looks the same", why: "Peak volume creates maximum strength adaptation stimulus" },
          { name: "Romanian Deadlift", sets: "4", reps: "10", rest: "90s", cue: "Extra set — hamstrings should be working hard by set 3", why: "Volume accumulation for hamstring resilience" },
          { name: "Side Plank + Hip Abduction", sets: "3", reps: "10/side", rest: "45s", cue: "Hold plank, lift top leg 10 times — control both", why: "Targets glute medius and hip stability for kick balance" },
          { name: "Dumbbell Row", sets: "4", reps: "10/side", rest: "60s", cue: "Extra set — upper back can handle volume well", why: "Building pulling strength for clinch and posture endurance" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Depth Jump to Broad Jump", sets: "5", reps: "4", rest: "2min", cue: "Extra set — quality is non-negotiable, rest fully", why: "Peak reactive power volume" },
          { name: "Landmine Rotational Press", sets: "4", reps: "6/side", rest: "75s", cue: "Add slight load if form allows — maintain speed", why: "Progressive loading of rotational pattern" },
          { name: "Hanging Leg Raise (straight leg)", sets: "3", reps: "10", rest: "60s", cue: "Straight legs now — harder hip flexion demand", why: "Progressing hip flexor strength for higher kicks" },
          { name: "Agility Ladder (in-in-out-out)", sets: "4", reps: "6 runs", rest: "45s", cue: "Max speed through the ladder, focus on foot contact time", why: "Coordination and footwork speed at high fatigue" },
        ]},
        { name: "Friday", type: "strength", exercises: [
          { name: "Bench Press", sets: "4", reps: "10", rest: "2min", cue: "Highest volume — maintain bar path and control", why: "Peak pressing volume for strength gains" },
          { name: "Front-Foot Elevated Split Squat", sets: "4", reps: "8/side", rest: "90s", cue: "Extra set — this is the hardest week, embrace it", why: "Maximum unilateral volume before deload" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "10", rest: "60s", cue: "2 more reps — go slightly further if you can maintain position", why: "Core endurance under increasing demand" },
          { name: "Prone Y-Raise + T-Raise Superset", sets: "3", reps: "10+10", rest: "30s", cue: "Y-raises then immediately T-raises — shoulder circuit", why: "Comprehensive rotator cuff and scapular stability" },
        ]},
      ]
    },
    {
      weekNum: 5, phase: "Deload", phaseColor: "bg-speed/15 text-speed", focus: "Reduce volume 40%, maintain intensity — recover and adapt",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Back Squat", sets: "2", reps: "6", rest: "2min", cue: "Same weight as week 4, half the sets — feel strong, not tired", why: "Maintains neural patterns while allowing tissue recovery" },
          { name: "Single-Leg RDL", sets: "2", reps: "8/side", rest: "60s", cue: "Light load, focus on balance and control", why: "Movement quality maintenance without fatigue accumulation" },
          { name: "Band Pull-Apart", sets: "2", reps: "15", rest: "30s", cue: "Easy prehab — just get blood flowing", why: "Active recovery for shoulders" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Box Jump (step down)", sets: "3", reps: "3", rest: "2min", cue: "Low reps, high intent — feel fast, not fatigued", why: "Keeps CNS primed without adding stress" },
          { name: "Med Ball Slam", sets: "3", reps: "5", rest: "60s", cue: "Explosive slam, let the frustration of deload week out", why: "Maintains power output capacity with minimal volume" },
          { name: "Dead Bug", sets: "2", reps: "8/side", rest: "30s", cue: "Slow and controlled — this is active recovery", why: "Core activation without loading" },
        ]},
        { name: "Friday", type: "recovery", exercises: [
          { name: "Foam Rolling (full body)", sets: "1", reps: "10min", rest: "—", cue: "Spend 60s per area — quads, adductors, lats, calves, glutes", why: "Tissue quality maintenance for next training block" },
          { name: "90/90 Hip Stretch", sets: "2", reps: "60s/side", rest: "—", cue: "Relax into the stretch, breathe deep, don't force range", why: "Hip mobility restoration after 4 weeks of heavy loading" },
          { name: "Band Dislocates", sets: "2", reps: "10", rest: "—", cue: "Slow, controlled, full range overhead and behind", why: "Shoulder mobility reset for guard position comfort" },
        ]},
      ]
    },
    {
      weekNum: 6, phase: "Intensification", phaseColor: "bg-accent/15 text-accent", focus: "Reduce volume, increase intensity — heavier loads, fewer reps",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "5", rest: "3min", cue: "Heavier now — brace like your life depends on it, controlled descent", why: "Maximal strength development with reduced volume" },
          { name: "Trap Bar Deadlift", sets: "3", reps: "5", rest: "2min", cue: "Push the floor away, lock out hard — don't round your back", why: "Total body strength with lower back-friendly mechanics" },
          { name: "Weighted Copenhagen Plank", sets: "3", reps: "15s/side", rest: "45s", cue: "Heavier plate, shorter hold — intensity over duration", why: "Adductor strength at higher intensity for injury resilience" },
          { name: "Weighted Pull-Up (or lat pulldown)", sets: "3", reps: "6", rest: "90s", cue: "Add weight if possible — pull chin over bar, slow descent", why: "Upper back and lat strength for clinch dominance" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Depth Drop to Vertical Jump", sets: "4", reps: "4", rest: "2min", cue: "Higher box now — absorb and redirect faster", why: "Advanced reactive strength for explosive kick initiation" },
          { name: "Rotational Med Ball Slam", sets: "4", reps: "5/side", rest: "75s", cue: "Maximal velocity — rotate and slam as hard as possible", why: "Peak rotational power output for turning kicks" },
          { name: "Hanging Windshield Wiper", sets: "3", reps: "6/side", rest: "60s", cue: "Legs together, rotate side to side with control", why: "Advanced rotational core strength at high demand" },
          { name: "Reactive Lateral Bound", sets: "4", reps: "5/side", rest: "60s", cue: "Bound laterally, stick the landing 1 sec, bound back", why: "Lateral explosive power for cutting and angle changes" },
        ]},
        { name: "Friday", type: "strength", exercises: [
          { name: "Close-Grip Bench Press", sets: "4", reps: "5", rest: "2min", cue: "Hands shoulder-width, elbows tucked — tricep dominant pressing", why: "Tricep and anterior deltoid strength for punching power" },
          { name: "Rear-Foot Elevated Split Squat (loaded)", sets: "3", reps: "6/side", rest: "90s", cue: "Hold dumbbells, go heavy — this is your primary leg exercise today", why: "Heavy unilateral loading for single-leg power development" },
          { name: "Dragon Flag (or eccentric only)", sets: "3", reps: "5", rest: "60s", cue: "Lower your body as one unit — only go as far as you can control", why: "Elite-level anti-extension core strength" },
          { name: "External Rotation (cable/band)", sets: "3", reps: "12/side", rest: "30s", cue: "Elbow pinned to side, rotate outward, control the return", why: "Rotator cuff injury prevention for repetitive arm movements" },
        ]},
      ]
    },
    {
      weekNum: 7, phase: "Intensification", phaseColor: "bg-accent/15 text-accent", focus: "Peak intensity — heaviest loads of the program",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Back Squat", sets: "5", reps: "3", rest: "3min", cue: "Heaviest squat of the program — singles mentality on every rep", why: "Near-maximal strength drives neural adaptations for power output" },
          { name: "Trap Bar Deadlift", sets: "4", reps: "3", rest: "2.5min", cue: "Heavy triples — keep the bar moving fast, bail if speed drops", why: "Peak hip extension strength for explosive movement" },
          { name: "Pallof Press (heavy band)", sets: "3", reps: "8/side", rest: "45s", cue: "Thickest band — resist rotation under real load", why: "Anti-rotation at match-relevant intensity" },
          { name: "Weighted Pull-Up", sets: "4", reps: "4", rest: "2min", cue: "Add more weight — pull fast, control descent 3 seconds", why: "Peak upper body pulling strength" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Depth Jump to Max Vertical", sets: "5", reps: "3", rest: "2.5min", cue: "Maximum height every rep — full recovery between sets", why: "Peak reactive power output — fight-speed movement" },
          { name: "Shot Put Throw (med ball)", sets: "4", reps: "5/side", rest: "75s", cue: "Step, rotate, launch — full body power chain", why: "Total body power integration for striking" },
          { name: "Hanging L-Sit Hold", sets: "3", reps: "15s", rest: "60s", cue: "Legs straight at 90°, squeeze everything — no swinging", why: "Hip flexor and core endurance at peak isometric strength" },
          { name: "5-10-5 Shuttle Sprint", sets: "5", reps: "1", rest: "90s", cue: "Max effort — aggressive deceleration and re-acceleration", why: "Change of direction speed for ring movement and angle cutting" },
        ]},
        { name: "Friday", type: "strength", exercises: [
          { name: "Close-Grip Bench Press", sets: "4", reps: "4", rest: "2.5min", cue: "Heaviest pressing of the program — full control, fast concentric", why: "Peak pressing strength for striking power" },
          { name: "Rear-Foot Elevated Split Squat", sets: "4", reps: "5/side", rest: "2min", cue: "Heavier than week 6 — own every rep on each leg", why: "Peak unilateral strength for kick power" },
          { name: "Dragon Flag", sets: "3", reps: "6", rest: "60s", cue: "One more rep than week 6 — earn it with control", why: "Core strength progression at peak program intensity" },
          { name: "Shoulder Pre-hab Circuit", sets: "2", reps: "10 each", rest: "30s", cue: "Y-raise, T-raise, external rotation — light, controlled, preventive", why: "Maintenance prehab under high training load" },
        ]},
      ]
    },
    {
      weekNum: 8, phase: "Peaking / Taper", phaseColor: "bg-explosive/15 text-explosive", focus: "Reduce volume drastically, maintain speed — competition ready",
      days: [
        { name: "Monday", type: "strength", exercises: [
          { name: "Back Squat", sets: "3", reps: "2", rest: "3min", cue: "Heavy doubles — fast and crisp, feel powerful not tired", why: "Maintains peak neural drive with minimal fatigue cost" },
          { name: "Power Clean (or Hang Clean)", sets: "3", reps: "2", rest: "2.5min", cue: "Explosive triple extension — catch it clean, stand up fast", why: "Full-body explosive coordination — peak fight readiness" },
          { name: "Band Pull-Apart", sets: "2", reps: "15", rest: "30s", cue: "Light prehab — keep the shoulders healthy going into competition", why: "Maintenance work to enter competition healthy" },
        ]},
        { name: "Wednesday", type: "power", exercises: [
          { name: "Depth Jump (low box)", sets: "3", reps: "3", rest: "2.5min", cue: "Lower box, maximal intent — feel springy, not heavy", why: "Reactive power priming without CNS fatigue" },
          { name: "Med Ball Rotational Throw", sets: "3", reps: "4/side", rest: "75s", cue: "Maximal velocity — imagine throwing through a target", why: "Rotational power tuning for competition kicks" },
          { name: "Light Core Circuit", sets: "2", reps: "8 each", rest: "30s", cue: "Dead bug, bird dog, plank — just activate, don't fatigue", why: "Core activation without accumulating fatigue" },
        ]},
        { name: "Friday", type: "recovery", exercises: [
          { name: "Foam Rolling + Stretching", sets: "1", reps: "15min", rest: "—", cue: "Full body, gentle — this is preparation, not training", why: "Tissue preparation for competition day" },
          { name: "Visualization + Breathing", sets: "1", reps: "10min", rest: "—", cue: "Close your eyes, breathe 4-4-4, visualize your fights round by round", why: "Mental preparation is physical preparation — prime your nervous system" },
          { name: "Light Walk or Swim", sets: "1", reps: "20min", rest: "—", cue: "Easy movement — flush the system, stay loose", why: "Active recovery to maintain mobility without any training stress" },
        ]},
      ]
    },
  ],
  da: [
    {
      weekNum: 1, phase: "Anatomisk tilpasning", phaseColor: "bg-muted text-muted-foreground", focus: "Opbyg arbejdskapacitet, bevægelseskvalitet, sene-forberedelse",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Goblet Squat", sets: "3", reps: "10", rest: "90s", cue: "Sæt dig mellem hofterne, bryst op — fuld dybde hver rep", why: "Opbygger squat-mønster og hoftemobilitet til dybe kammer-positioner" },
          { name: "Etbens RDL", sets: "3", reps: "8/side", rest: "60s", cue: "Hængsel fra hoften, hold bagbenet i linje med overkroppen", why: "Udvikler posterior kæde-balance — afgørende for spark-recovery og standstabilitet" },
          { name: "Copenhagen Plank", sets: "3", reps: "20s/side", rest: "45s", cue: "Øverste ben på bænk, pres adduktorerne hårdt, ingen hoftefald", why: "Styrker adduktorerne for at forebygge lyskeskader ved høje spark" },
          { name: "Band Pull-Apart", sets: "3", reps: "15", rest: "30s", cue: "Klem skulderbladene sammen, kontrollér tilbagegangen", why: "Modvirker rundet holdning fra guard-position, støtter skuldersundhed" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Box Jump (step ned)", sets: "4", reps: "5", rest: "90s", cue: "Eksplodér op, land blødt og stille — step ned, hop ikke", why: "Træner tredobbelt extension uden excentrisk stress" },
          { name: "Medicinbold Rotationskast", sets: "3", reps: "6/side", rest: "60s", cue: "Load baghoften, rotér gennem core, slip ved brysthøjde", why: "Efterligner rotationskraft brugt i rundkick og drejespark" },
          { name: "Pallof Press", sets: "3", reps: "10/side", rest: "45s", cue: "Pres langsomt ud, modstå rotation — lad ikke båndet trække dig", why: "Anti-rotations core-styrke for balance under spark" },
          { name: "Ankel Båndet Walks", sets: "2", reps: "15/retning", rest: "30s", cue: "Små skridt, knæ over tæer, bliv lav", why: "Forebyggelse af ankelskader — det mest almindelige skadested i TKD" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Push-Up (tempo 3-1-1)", sets: "3", reps: "10", rest: "60s", cue: "3 sek ned, 1 sek pause, 1 sek op — fuld range", why: "Opbygger pres-udholdenhed og skulderstabilitet til clinch" },
          { name: "Bulgarian Split Squat", sets: "3", reps: "8/side", rest: "90s", cue: "Forknæ over tæer, bagfod forhøjet, bliv oprejst", why: "Ensidig benstyrke der overføres direkte til spark-kraft" },
          { name: "Dead Bug", sets: "3", reps: "8/side", rest: "45s", cue: "Pres lænden i gulvet, modsatte arm/ben strækkes sammen", why: "Lærer core bracing under bevægelse — grundlæggende for spark-kontrol" },
          { name: "Face Pull", sets: "3", reps: "12", rest: "30s", cue: "Træk til pandhøjde, ekstern rotation til slut", why: "Balancerer skuldermuskler for at forebygge impingement" },
        ]},
      ]
    },
    {
      weekNum: 2, phase: "Anatomisk tilpasning", phaseColor: "bg-muted text-muted-foreground", focus: "Øg volumen lidt, forbedr bevægelsesmønstre",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Goblet Squat", sets: "3", reps: "12", rest: "90s", cue: "2 ekstra reps fra uge 1 — samme dybde, samme tempo", why: "Progressiv overload gennem volumen før intensitet tilføjes" },
          { name: "Etbens RDL", sets: "3", reps: "10/side", rest: "60s", cue: "Brug en let håndvægt nu hvis kropsvægt føles nemt", why: "Belastning af mønsteret når bevægelseskvaliteten er etableret" },
          { name: "Copenhagen Plank", sets: "3", reps: "25s/side", rest: "45s", cue: "5 sekunder længere — bevar alignment hele vejen", why: "Time under tension progression for senetilpasning" },
          { name: "Band Pull-Apart", sets: "3", reps: "18", rest: "30s", cue: "Øg reps, bevar squeeze ved end range", why: "Volumenbaseret progression for holdningsudholdenhed" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Box Jump (step ned)", sets: "4", reps: "5", rest: "90s", cue: "Samme højde — fokus på hurtigere afsæt, ikke højere boks", why: "Rate of force development over absolut højde" },
          { name: "Medicinbold Rotationskast", sets: "4", reps: "6/side", rest: "60s", cue: "Et ekstra sæt — bevar max intent på hvert kast", why: "Volumenøgning i power-arbejde bygger power-udholdenhed" },
          { name: "Pallof Press + Hold", sets: "3", reps: "8/side + 5s hold", rest: "45s", cue: "Tilføj 5 sek hold ved fuld extension hver rep", why: "Isometrisk komponent udfordrer anti-rotation under udmattelse" },
          { name: "Etbens Tåhæv", sets: "3", reps: "12/side", rest: "30s", cue: "Fuld range — 2 sek op, 2 sek ned, pause i top", why: "Læg/achilles kapacitet til gentaget bounce og fodarbejde" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Push-Up (tempo 3-1-1)", sets: "4", reps: "10", rest: "60s", cue: "Ekstra sæt — bevar tempodisciplin, ingen slappe hofter", why: "Volumenprogression i presmønster" },
          { name: "Bulgarian Split Squat", sets: "3", reps: "10/side", rest: "90s", cue: "2 flere reps per side — hold overkroppen lodret", why: "Progressiv overload gennem rep-øgning" },
          { name: "Dead Bug + Bånd", sets: "3", reps: "8/side", rest: "45s", cue: "Hold et let bånd mellem hænder og knæ for modstand", why: "Ekstern belastning udfordrer core-stabiliteten yderligere" },
          { name: "Face Pull", sets: "3", reps: "15", rest: "30s", cue: "Flere reps, lettere vægt om nødvendigt — kvalitet over ego", why: "High-rep skuldersundhedsarbejde akkumulerer over tid" },
        ]},
      ]
    },
    {
      weekNum: 3, phase: "Akkumulation", phaseColor: "bg-primary/15 text-primary", focus: "Øg træningsvolumen, byg styrkebase",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "8", rest: "2min", cue: "Vægtstang nu — brace hårdt, ramm parallel, driv gennem hælene", why: "Primær underkropsstyrke — hofte- og knæextensionskraft" },
          { name: "Rumænsk Dødløft", sets: "3", reps: "10", rest: "90s", cue: "Stangen tæt på benene, hængsel til hamstring-stræk, klem balderne op", why: "Posterior kæde-styrke for spark-kammer hastighed og landingsstabilitet" },
          { name: "Copenhagen Plank (vægtet)", sets: "3", reps: "20s/side", rest: "45s", cue: "Tilføj en lille plade på hoften — samme alignment-standarder", why: "Progressiv belastning af adduktorer til skadeforebyggelse" },
          { name: "Håndvægt Row", sets: "3", reps: "10/side", rest: "60s", cue: "Træk til hoften, klem lat, kontrollér negativen 2 sekunder", why: "Øvre ryg-styrke for guard-position udholdenhed og clinch" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump til Længdespring", sets: "4", reps: "4", rest: "2min", cue: "Step af 30cm boks, absorber, eksplodér straks fremad", why: "Reaktiv styrke — træner stretch-shortening cyklus brugt i hurtige spark" },
          { name: "Landmine Rotationspres", sets: "3", reps: "6/side", rest: "75s", cue: "Driv fra hoften, pres og rotér — én flydende bevægelse", why: "Integreret rotationskraft fra gulvet op, som et drejespark" },
          { name: "Hængende Knæløft", sets: "3", reps: "12", rest: "45s", cue: "Krul bækkenet op, sving ikke bare benene — kontrollér nedsænkningen", why: "Hoftefleksor-styrke til hurtigt knæ-drive i spark" },
          { name: "Bånd Modstands-Shuffle", sets: "3", reps: "10/retning", rest: "45s", cue: "Bliv lav, skub aggressivt af, lad ikke fødderne klikke sammen", why: "Lateral fodarbejdshastighed og hoftestabilitet for ringbevægelse" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Bænkpres", sets: "4", reps: "8", rest: "2min", cue: "Kontrolleret nedsænkning, pause ved brystet, driv hurtigt op", why: "Overkrops-pres kraft til slagkombinationer og clinch-skub" },
          { name: "Forfod-Forhøjet Split Squat", sets: "3", reps: "8/side", rest: "90s", cue: "Forfod på 5cm plade — dybere range, mere quad og hoftefleksorarbejde", why: "Øget bevægelsesrange styrker spark-kammer position" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "8", rest: "60s", cue: "Klem balderne, rul kun så langt du kan kontrollere", why: "Anti-extension core-styrke forhindrer overbuning under spark" },
          { name: "Prone Y-Raise", sets: "3", reps: "12", rest: "30s", cue: "Tommelfingre op, løft armene i Y-form, hold 2 sek i top", why: "Nedre trap aktivering for skuldersundhed og overhead guard-position" },
        ]},
      ]
    },
    {
      weekNum: 4, phase: "Akkumulation", phaseColor: "bg-primary/15 text-primary", focus: "Peak volumen-uge — højeste træningsmængde før deload",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "10", rest: "2min", cue: "Flest reps denne blok — hold dig stram, hver rep ser ens ud", why: "Peak volumen skaber maksimal styrketilpasningsstimulus" },
          { name: "Rumænsk Dødløft", sets: "4", reps: "10", rest: "90s", cue: "Ekstra sæt — hamstrings bør arbejde hårdt ved sæt 3", why: "Volumenakkumulation for hamstring-robusthed" },
          { name: "Sideplanke + Hofteabduktion", sets: "3", reps: "10/side", rest: "45s", cue: "Hold planke, løft øverste ben 10 gange — kontrollér begge", why: "Målretter glute medius og hoftestabilitet for spark-balance" },
          { name: "Håndvægt Row", sets: "4", reps: "10/side", rest: "60s", cue: "Ekstra sæt — øvre ryg kan håndtere volumen godt", why: "Opbygning af trækstyrke til clinch og holdningsudholdenhed" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump til Længdespring", sets: "5", reps: "4", rest: "2min", cue: "Ekstra sæt — kvalitet er ikke til forhandling, hvil fuldt", why: "Peak reaktiv power-volumen" },
          { name: "Landmine Rotationspres", sets: "4", reps: "6/side", rest: "75s", cue: "Tilføj let belastning hvis form tillader — bevar hastighed", why: "Progressiv belastning af rotationsmønster" },
          { name: "Hængende Benløft (strakte ben)", sets: "3", reps: "10", rest: "60s", cue: "Strakte ben nu — hårdere hoftefleksionskrav", why: "Progression af hoftefleksorstyrke til højere spark" },
          { name: "Agility Ladder (ind-ind-ud-ud)", sets: "4", reps: "6 løb", rest: "45s", cue: "Max hastighed gennem stigen, fokus på fod-kontakttid", why: "Koordination og fodarbejdshastighed ved høj udmattelse" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Bænkpres", sets: "4", reps: "10", rest: "2min", cue: "Højeste volumen — bevar bar-bane og kontrol", why: "Peak presmængde for styrkegevinster" },
          { name: "Forfod-Forhøjet Split Squat", sets: "4", reps: "8/side", rest: "90s", cue: "Ekstra sæt — dette er den hårdeste uge, omfavn det", why: "Maksimal ensidig volumen før deload" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "10", rest: "60s", cue: "2 flere reps — gå lidt længere hvis du kan bevare positionen", why: "Core-udholdenhed under stigende krav" },
          { name: "Prone Y-Raise + T-Raise Supersæt", sets: "3", reps: "10+10", rest: "30s", cue: "Y-raises derefter straks T-raises — skulder-circuit", why: "Omfattende rotator cuff og scapulær stabilitet" },
        ]},
      ]
    },
    {
      weekNum: 5, phase: "Deload", phaseColor: "bg-speed/15 text-speed", focus: "Reducér volumen 40%, bevar intensitet — restituer og tilpas",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Back Squat", sets: "2", reps: "6", rest: "2min", cue: "Samme vægt som uge 4, halvdelen af sættene — føl dig stærk, ikke træt", why: "Bevarer neurale mønstre mens vævsrestitution tillades" },
          { name: "Etbens RDL", sets: "2", reps: "8/side", rest: "60s", cue: "Let belastning, fokus på balance og kontrol", why: "Bevægelseskvalitetsvedligeholdelse uden træthed" },
          { name: "Band Pull-Apart", sets: "2", reps: "15", rest: "30s", cue: "Let prehab — bare få blod til at flyde", why: "Aktiv restitution for skuldrene" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Box Jump (step ned)", sets: "3", reps: "3", rest: "2min", cue: "Lave reps, høj intent — føl dig hurtig, ikke udmattet", why: "Holder CNS primet uden at tilføje stress" },
          { name: "Medicinbold Slam", sets: "3", reps: "5", rest: "60s", cue: "Eksplosiv slam, lad frustrationen fra deload-ugen ud", why: "Bevarer power-output kapacitet med minimal volumen" },
          { name: "Dead Bug", sets: "2", reps: "8/side", rest: "30s", cue: "Langsomt og kontrolleret — dette er aktiv restitution", why: "Core-aktivering uden belastning" },
        ]},
        { name: "Fredag", type: "recovery", exercises: [
          { name: "Foam Rolling (hele kroppen)", sets: "1", reps: "10min", rest: "—", cue: "Brug 60s per område — quads, adduktorer, lats, lægge, balderne", why: "Vævskvalitetsvedligeholdelse til næste træningsblok" },
          { name: "90/90 Hoftestretch", sets: "2", reps: "60s/side", rest: "—", cue: "Slap af i stretch, træk vejret dybt, tving ikke range", why: "Hoftemobilitetsgenoprettelse efter 4 ugers tung belastning" },
          { name: "Band Dislocates", sets: "2", reps: "10", rest: "—", cue: "Langsom, kontrolleret, fuld range over hovedet og bagved", why: "Skuldermobilitets-reset for guard-position komfort" },
        ]},
      ]
    },
    {
      weekNum: 6, phase: "Intensifikation", phaseColor: "bg-accent/15 text-accent", focus: "Reducér volumen, øg intensitet — tungere belastninger, færre reps",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "5", rest: "3min", cue: "Tungere nu — brace som dit liv afhænger af det", why: "Maksimal styrkeudvikling med reduceret volumen" },
          { name: "Trap Bar Dødløft", sets: "3", reps: "5", rest: "2min", cue: "Skub gulvet væk, lås ud hårdt — rund ikke ryggen", why: "Helkropsstyrke med lændevenlig mekanik" },
          { name: "Vægtet Copenhagen Plank", sets: "3", reps: "15s/side", rest: "45s", cue: "Tungere plade, kortere hold — intensitet over varighed", why: "Adduktorstyrke ved højere intensitet for skaderesistens" },
          { name: "Vægtet Pull-Up (eller lat pulldown)", sets: "3", reps: "6", rest: "90s", cue: "Tilføj vægt — træk hagen over stangen, langsom nedsænkning", why: "Øvre ryg og lat-styrke for clinch-dominans" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Drop til Vertikalt Spring", sets: "4", reps: "4", rest: "2min", cue: "Højere boks nu — absorber og omdirigér hurtigere", why: "Avanceret reaktiv styrke for eksplosiv sparkinitiering" },
          { name: "Rotations Medicinbold Slam", sets: "4", reps: "5/side", rest: "75s", cue: "Maksimal hastighed — rotér og slam så hårdt som muligt", why: "Peak rotationskraft output til drejespark" },
          { name: "Hængende Vinduesviskere", sets: "3", reps: "6/side", rest: "60s", cue: "Ben samlet, rotér side til side med kontrol", why: "Avanceret rotations core-styrke ved højt krav" },
          { name: "Reaktive Laterale Spring", sets: "4", reps: "5/side", rest: "60s", cue: "Spring lateralt, stick landing 1 sek, spring tilbage", why: "Lateral eksplosiv kraft til udskæringer og vinkelændringer" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Smal-Greb Bænkpres", sets: "4", reps: "5", rest: "2min", cue: "Hænder skulderbredde, albuer tucked — triceps-dominant pres", why: "Triceps og anterior deltoid styrke til slagkraft" },
          { name: "Bagfod-Forhøjet Split Squat (belastet)", sets: "3", reps: "6/side", rest: "90s", cue: "Hold håndvægte, gå tungt — dette er din primære benøvelse i dag", why: "Tung ensidig belastning for etbens kraftudvikling" },
          { name: "Dragon Flag (eller excentrisk kun)", sets: "3", reps: "5", rest: "60s", cue: "Sænk kroppen som én enhed — gå kun så langt du kan kontrollere", why: "Elite-niveau anti-extension core-styrke" },
          { name: "Ekstern Rotation (kabel/bånd)", sets: "3", reps: "12/side", rest: "30s", cue: "Albue fastholdende ved siden, rotér udad, kontrollér tilbagegangen", why: "Rotator cuff skadeforebyggelse for gentagne armbevægelser" },
        ]},
      ]
    },
    {
      weekNum: 7, phase: "Intensifikation", phaseColor: "bg-accent/15 text-accent", focus: "Peak intensitet — tungeste belastninger i programmet",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Back Squat", sets: "5", reps: "3", rest: "3min", cue: "Tungeste squat i programmet — singles-mentalitet på hver rep", why: "Nær-maksimal styrke driver neurale tilpasninger for power output" },
          { name: "Trap Bar Dødløft", sets: "4", reps: "3", rest: "2.5min", cue: "Tunge triples — hold stangen i bevægelse hurtigt, stop hvis hastighed falder", why: "Peak hofteextensionsstyrke for eksplosiv bevægelse" },
          { name: "Pallof Press (tungt bånd)", sets: "3", reps: "8/side", rest: "45s", cue: "Tykkeste bånd — modstå rotation under reel belastning", why: "Anti-rotation ved kamp-relevant intensitet" },
          { name: "Vægtet Pull-Up", sets: "4", reps: "4", rest: "2min", cue: "Tilføj mere vægt — træk hurtigt, kontrollér nedsænkning 3 sekunder", why: "Peak overkrops trækstyrke" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump til Max Vertikalt", sets: "5", reps: "3", rest: "2.5min", cue: "Maksimal højde hver rep — fuld restitution mellem sæt", why: "Peak reaktiv power output — kamphastigheds-bevægelse" },
          { name: "Shot Put Kast (medicinbold)", sets: "4", reps: "5/side", rest: "75s", cue: "Step, rotér, kast — fuld krops power-kæde", why: "Total krops power-integration for slagudførelse" },
          { name: "Hængende L-Sit Hold", sets: "3", reps: "15s", rest: "60s", cue: "Ben strakte ved 90°, klem alt — ingen svingning", why: "Hoftefleksor og core-udholdenhed ved peak isometrisk styrke" },
          { name: "5-10-5 Shuttle Sprint", sets: "5", reps: "1", rest: "90s", cue: "Max indsats — aggressiv deceleration og re-acceleration", why: "Retningsskiftehastighed til ringbevægelse og vinkeldækning" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Smal-Greb Bænkpres", sets: "4", reps: "4", rest: "2.5min", cue: "Tungeste pres i programmet — fuld kontrol, hurtig koncentrisk", why: "Peak presstyrke for slagkraft" },
          { name: "Bagfod-Forhøjet Split Squat", sets: "4", reps: "5/side", rest: "2min", cue: "Tungere end uge 6 — ej hver rep på hvert ben", why: "Peak ensidig styrke for spark-kraft" },
          { name: "Dragon Flag", sets: "3", reps: "6", rest: "60s", cue: "En rep mere end uge 6 — fortjen det med kontrol", why: "Core-styrkeprogression ved peak program-intensitet" },
          { name: "Skulder Prehab-Circuit", sets: "2", reps: "10 hver", rest: "30s", cue: "Y-raise, T-raise, ekstern rotation — let, kontrolleret, forebyggende", why: "Vedligeholdelsesprehab under høj træningsmængde" },
        ]},
      ]
    },
    {
      weekNum: 8, phase: "Peaking / Taper", phaseColor: "bg-explosive/15 text-explosive", focus: "Reducér volumen drastisk, bevar hastighed — kampklar",
      days: [
        { name: "Mandag", type: "strength", exercises: [
          { name: "Back Squat", sets: "3", reps: "2", rest: "3min", cue: "Tunge doubles — hurtige og skarpe, føl dig kraftfuld ikke træt", why: "Bevarer peak neural drive med minimal træthedskostnad" },
          { name: "Power Clean (eller Hang Clean)", sets: "3", reps: "2", rest: "2.5min", cue: "Eksplosiv tredobbelt extension — fang den rent, rejs dig hurtigt", why: "Helkrops eksplosiv koordination — peak kampparathed" },
          { name: "Band Pull-Apart", sets: "2", reps: "15", rest: "30s", cue: "Let prehab — hold skuldrene sunde ind til konkurrence", why: "Vedligeholdelsesarbejde for at gå sundt ind i konkurrence" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump (lav boks)", sets: "3", reps: "3", rest: "2.5min", cue: "Lavere boks, maksimal intent — føl dig fjedrende, ikke tung", why: "Reaktiv power-priming uden CNS-træthed" },
          { name: "Medicinbold Rotationskast", sets: "3", reps: "4/side", rest: "75s", cue: "Maksimal hastighed — forestil dig at kaste gennem et mål", why: "Rotationskraft-tuning til konkurrence-spark" },
          { name: "Let Core Circuit", sets: "2", reps: "8 hver", rest: "30s", cue: "Dead bug, bird dog, planke — bare aktivér, udmat ikke", why: "Core-aktivering uden at akkumulere træthed" },
        ]},
        { name: "Fredag", type: "recovery", exercises: [
          { name: "Foam Rolling + Udstrækning", sets: "1", reps: "15min", rest: "—", cue: "Hele kroppen, blidt — dette er forberedelse, ikke træning", why: "Vævsforberedelse til kampdag" },
          { name: "Visualisering + Vejrtrækning", sets: "1", reps: "10min", rest: "—", cue: "Luk øjnene, træk vejret 4-4-4, visualisér dine kampe runde for runde", why: "Mental forberedelse er fysisk forberedelse — prim dit nervesystem" },
          { name: "Let Gåtur eller Svømning", sets: "1", reps: "20min", rest: "—", cue: "Let bevægelse — flush systemet, bliv løs", why: "Aktiv restitution for at bevare mobilitet uden træningstress" },
        ]},
      ]
    },
  ],
  sv: [
    {
      weekNum: 1, phase: "Anatomisk anpassning", phaseColor: "bg-muted text-muted-foreground", focus: "Bygg arbetskapacitet, rörelsekvalitet, senförberedelse",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Goblet Squat", sets: "3", reps: "10", rest: "90s", cue: "Sitt mellan höfterna, bröst upp — fullt djup varje rep", why: "Bygger knäböjningsmönster och höftrörlighet för djupa kammerpositioner" },
          { name: "Enbens RDL", sets: "3", reps: "8/sida", rest: "60s", cue: "Gångjärn från höften, håll bakbenet i linje med överkroppen", why: "Utvecklar posterior kedja-balans — avgörande för spark-recovery och ståstabilitet" },
          { name: "Copenhagen Plank", sets: "3", reps: "20s/sida", rest: "45s", cue: "Övre benet på bänk, pressa adduktorerna hårt, inget höftfall", why: "Stärker adduktorerna för att förebygga ljumskskador vid höga sparkar" },
          { name: "Band Pull-Apart", sets: "3", reps: "15", rest: "30s", cue: "Kläm ihop skulderbladen, kontrollera returen", why: "Motverkar rundad hållning från guard-position, stödjer axelhälsa" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Box Jump (steg ner)", sets: "4", reps: "5", rest: "90s", cue: "Explodera upp, landa mjukt och tyst — steg ner, hoppa inte", why: "Tränar trippelextension utan excentrisk stress" },
          { name: "Medicinboll Rotationskast", sets: "3", reps: "6/sida", rest: "60s", cue: "Ladda bakhöften, rotera genom core, släpp vid brösthöjd", why: "Efterliknar rotationskraft i rundspark och vändningssparkar" },
          { name: "Pallof Press", sets: "3", reps: "10/sida", rest: "45s", cue: "Tryck ut långsamt, motstå rotation — låt inte bandet dra dig", why: "Anti-rotations core-styrka för balans under sparkar" },
          { name: "Ankel Band Walks", sets: "2", reps: "15/riktning", rest: "30s", cue: "Små steg, knän spårar tårna, håll dig låg", why: "Förebyggande av fotledsskador — vanligaste skadestället i TKD" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Push-Up (tempo 3-1-1)", sets: "3", reps: "10", rest: "60s", cue: "3 sek ner, 1 sek paus, 1 sek upp — fullt rörelseomfång", why: "Bygger pressuthållighet och axelstabilitet för clinch-arbete" },
          { name: "Bulgarian Split Squat", sets: "3", reps: "8/sida", rest: "90s", cue: "Framknä spårar tårna, bakfot förhöjd, håll dig upprätt", why: "Ensidig benstyrka som överförs direkt till spark-kraft" },
          { name: "Dead Bug", sets: "3", reps: "8/sida", rest: "45s", cue: "Tryck nedre ryggen i golvet, motsatta arm/ben sträcks tillsammans", why: "Lär core bracing under rörelse — grundläggande för spark-kontroll" },
          { name: "Face Pull", sets: "3", reps: "12", rest: "30s", cue: "Dra till pannhöjd, extern rotation i slutet", why: "Balanserar axelmuskler för att förebygga impingement" },
        ]},
      ]
    },
    {
      weekNum: 2, phase: "Anatomisk anpassning", phaseColor: "bg-muted text-muted-foreground", focus: "Öka volymen något, förbättra rörelsemönster",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Goblet Squat", sets: "3", reps: "12", rest: "90s", cue: "2 extra reps från vecka 1 — samma djup, samma tempo", why: "Progressiv överbelastning genom volym innan intensitet läggs till" },
          { name: "Enbens RDL", sets: "3", reps: "10/sida", rest: "60s", cue: "Använd en lätt hantel nu om kroppsvikt känns enkelt", why: "Belastning av mönstret när rörelsekvaliteten är etablerad" },
          { name: "Copenhagen Plank", sets: "3", reps: "25s/sida", rest: "45s", cue: "5 sekunder längre — bibehåll alignment hela vägen", why: "Time under tension progression för senanpassning" },
          { name: "Band Pull-Apart", sets: "3", reps: "18", rest: "30s", cue: "Öka reps, behåll squeeze vid slutposition", why: "Volymbaserad progression för hållningsuthållighet" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Box Jump (steg ner)", sets: "4", reps: "5", rest: "90s", cue: "Samma höjd — fokus på snabbare avhopp, inte högre låda", why: "Rate of force development framför absolut höjd" },
          { name: "Medicinboll Rotationskast", sets: "4", reps: "6/sida", rest: "60s", cue: "Ett extra set — behåll max intent på varje kast", why: "Volymökning i power-arbete bygger power-uthållighet" },
          { name: "Pallof Press + Håll", sets: "3", reps: "8/sida + 5s håll", rest: "45s", cue: "Lägg till 5 sek håll vid full extension varje rep", why: "Isometrisk komponent utmanar anti-rotation under trötthet" },
          { name: "Enbens Tåhäv", sets: "3", reps: "12/sida", rest: "30s", cue: "Fullt rörelseomfång — 2 sek upp, 2 sek ner, paus i toppen", why: "Vad/hälsena kapacitet för upprepad studs och fotarbete" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Push-Up (tempo 3-1-1)", sets: "4", reps: "10", rest: "60s", cue: "Extra set — behåll tempodisciplin, inga slappa höfter", why: "Volymprogression i pressmönster" },
          { name: "Bulgarian Split Squat", sets: "3", reps: "10/sida", rest: "90s", cue: "2 fler reps per sida — håll överkroppen vertikal", why: "Progressiv överbelastning genom rep-ökning" },
          { name: "Dead Bug + Band", sets: "3", reps: "8/sida", rest: "45s", cue: "Håll ett lätt band mellan händer och knän för motstånd", why: "Extern belastning utmanar core-stabiliteten ytterligare" },
          { name: "Face Pull", sets: "3", reps: "15", rest: "30s", cue: "Fler reps, lättare vikt om nödvändigt — kvalitet framför ego", why: "High-rep axelhälsoarbete ackumuleras över tid" },
        ]},
      ]
    },
    {
      weekNum: 3, phase: "Ackumulation", phaseColor: "bg-primary/15 text-primary", focus: "Öka träningsvolymen, bygg styrkegrund",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "8", rest: "2min", cue: "Skivstång nu — brace hårt, nå parallell, driv genom hälarna", why: "Primär underkroppsstyrka — höft- och knäextensionskraft" },
          { name: "Rumänsk Marklyft", sets: "3", reps: "10", rest: "90s", cue: "Stången nära benen, gångjärn till hamstring-stretch, kläm skinkorna uppåt", why: "Posterior kedjestyrka för spark-kammarhastighet och landningsstabilitet" },
          { name: "Copenhagen Plank (viktad)", sets: "3", reps: "20s/sida", rest: "45s", cue: "Lägg en liten platta på höften — samma alignment-standarder", why: "Progressiv belastning av adduktorer för skadeförebyggande" },
          { name: "Hantel Rodd", sets: "3", reps: "10/sida", rest: "60s", cue: "Dra till höften, kläm lat, kontrollera negativen 2 sekunder", why: "Övre ryggstyrka för guard-position uthållighet och clinch" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump till Längdhopp", sets: "4", reps: "4", rest: "2min", cue: "Steg av 30cm låda, absorbera, explodera framåt direkt", why: "Reaktiv styrka — tränar stretch-shortening cykeln i snabba sparkar" },
          { name: "Landmine Rotationspress", sets: "3", reps: "6/sida", rest: "75s", cue: "Driv från höften, tryck och rotera — en flytande rörelse", why: "Integrerad rotationskraft från golvet upp, som en vändningsspark" },
          { name: "Hängande Knälyft", sets: "3", reps: "12", rest: "45s", cue: "Rulla bäckenet uppåt, svinga inte bara benen — kontrollera nedsänkningen", why: "Höftflexorstyrka för snabb knädrivning i sparkar" },
          { name: "Band Motstånd-Shuffle", sets: "3", reps: "10/riktning", rest: "45s", cue: "Håll dig låg, skjut av aggressivt, låt inte fötterna klicka ihop", why: "Lateral fotarbetshastighet och höftstabilitet för ringrörelser" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Bänkpress", sets: "4", reps: "8", rest: "2min", cue: "Kontrollerad nedsänkning, paus vid bröst, driv upp snabbt", why: "Överkroppens presskraft för slagkombinationer och clinch-push" },
          { name: "Framfot-Förhöjd Split Squat", sets: "3", reps: "8/sida", rest: "90s", cue: "Framfot på 5cm platta — djupare range, mer quad och höftflexorarbete", why: "Ökat rörelseomfång stärker spark-kammarposition" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "8", rest: "60s", cue: "Kläm skinkorna, rulla ut bara så långt du kan kontrollera", why: "Anti-extension core-styrka förhindrar svank under sparkar" },
          { name: "Prone Y-Raise", sets: "3", reps: "12", rest: "30s", cue: "Tummar upp, lyft armarna i Y-form, håll 2 sek i toppen", why: "Nedre trap aktivering för axelhälsa och overhead guard-position" },
        ]},
      ]
    },
    {
      weekNum: 4, phase: "Ackumulation", phaseColor: "bg-primary/15 text-primary", focus: "Toppvolym-vecka — högsta träningsbelastning innan deload",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "10", rest: "2min", cue: "Flest reps denna block — håll dig tight, varje rep ser likadan ut", why: "Toppvolym skapar maximal styrketillväxtstimulus" },
          { name: "Rumänsk Marklyft", sets: "4", reps: "10", rest: "90s", cue: "Extra set — hamstrings bör arbeta hårt vid set 3", why: "Volymackumulation för hamstring-tålighet" },
          { name: "Sidoplanka + Höftabduktion", sets: "3", reps: "10/sida", rest: "45s", cue: "Håll planka, lyft övre benet 10 gånger — kontrollera båda", why: "Riktar sig mot glute medius och höftstabilitet för spark-balans" },
          { name: "Hantel Rodd", sets: "4", reps: "10/sida", rest: "60s", cue: "Extra set — övre ryggen klarar volym bra", why: "Bygga dragstyrka för clinch och hållningsuthållighet" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump till Längdhopp", sets: "5", reps: "4", rest: "2min", cue: "Extra set — kvalitet är inte förhandlingsbar, vila fullt", why: "Topp reaktiv power-volym" },
          { name: "Landmine Rotationspress", sets: "4", reps: "6/sida", rest: "75s", cue: "Lägg till lätt belastning om formen tillåter — behåll hastighet", why: "Progressiv belastning av rotationsmönster" },
          { name: "Hängande Benlyft (raka ben)", sets: "3", reps: "10", rest: "60s", cue: "Raka ben nu — hårdare höftflexionskrav", why: "Progression av höftflexorstyrka för högre sparkar" },
          { name: "Agility Ladder (in-in-ut-ut)", sets: "4", reps: "6 löpningar", rest: "45s", cue: "Max hastighet genom stegen, fokus på fotkontakttid", why: "Koordination och fotarbetshastighet vid hög trötthet" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Bänkpress", sets: "4", reps: "10", rest: "2min", cue: "Högsta volymen — behåll stångbana och kontroll", why: "Topp pressvolym för styrkevinster" },
          { name: "Framfot-Förhöjd Split Squat", sets: "4", reps: "8/sida", rest: "90s", cue: "Extra set — detta är den tuffaste veckan, omfamna det", why: "Maximal ensidig volym innan deload" },
          { name: "Ab Wheel Rollout", sets: "3", reps: "10", rest: "60s", cue: "2 fler reps — gå lite längre om du kan behålla positionen", why: "Core-uthållighet under ökande krav" },
          { name: "Prone Y-Raise + T-Raise Superset", sets: "3", reps: "10+10", rest: "30s", cue: "Y-raises sedan direkt T-raises — axelcirkel", why: "Omfattande rotator cuff och scapulär stabilitet" },
        ]},
      ]
    },
    {
      weekNum: 5, phase: "Deload", phaseColor: "bg-speed/15 text-speed", focus: "Reducera volymen 40%, behåll intensitet — återhämta och anpassa",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Back Squat", sets: "2", reps: "6", rest: "2min", cue: "Samma vikt som vecka 4, hälften av seten — känn dig stark, inte trött", why: "Behåller neurala mönster medan vävnadsåterhämtning tillåts" },
          { name: "Enbens RDL", sets: "2", reps: "8/sida", rest: "60s", cue: "Lätt belastning, fokus på balans och kontroll", why: "Rörelsekvalitetsunderhåll utan trötthetsackumulering" },
          { name: "Band Pull-Apart", sets: "2", reps: "15", rest: "30s", cue: "Lätt prehab — bara få blod att flöda", why: "Aktiv återhämtning för axlarna" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Box Jump (steg ner)", sets: "3", reps: "3", rest: "2min", cue: "Låga reps, hög intent — känn dig snabb, inte utmattad", why: "Håller CNS primad utan att lägga till stress" },
          { name: "Medicinboll Slam", sets: "3", reps: "5", rest: "60s", cue: "Explosiv slam, släpp ut frustrationen från deload-veckan", why: "Behåller power-output kapacitet med minimal volym" },
          { name: "Dead Bug", sets: "2", reps: "8/sida", rest: "30s", cue: "Långsamt och kontrollerat — detta är aktiv återhämtning", why: "Core-aktivering utan belastning" },
        ]},
        { name: "Fredag", type: "recovery", exercises: [
          { name: "Foam Rolling (hela kroppen)", sets: "1", reps: "10min", rest: "—", cue: "Spendera 60s per område — quads, adduktorer, lats, vader, skinkor", why: "Vävnadskvalitetsunderhåll för nästa träningsblock" },
          { name: "90/90 Höftstretch", sets: "2", reps: "60s/sida", rest: "—", cue: "Slappna av i stretchen, andas djupt, tvinga inte range", why: "Höftrörlighetsåterställning efter 4 veckors tung belastning" },
          { name: "Band Dislocates", sets: "2", reps: "10", rest: "—", cue: "Långsam, kontrollerad, fullt rörelseomfång över huvudet och bakom", why: "Axelrörlighets-reset för guard-position komfort" },
        ]},
      ]
    },
    {
      weekNum: 6, phase: "Intensifiering", phaseColor: "bg-accent/15 text-accent", focus: "Reducera volym, öka intensitet — tyngre belastningar, färre reps",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Back Squat", sets: "4", reps: "5", rest: "3min", cue: "Tyngre nu — brace som ditt liv beror på det", why: "Maximal styrkeutveckling med reducerad volym" },
          { name: "Trap Bar Marklyft", sets: "3", reps: "5", rest: "2min", cue: "Skjut golvet bort, lås ut hårt — runda inte ryggen", why: "Helkroppsstyrka med ländryggensvänlig mekanik" },
          { name: "Viktad Copenhagen Plank", sets: "3", reps: "15s/sida", rest: "45s", cue: "Tyngre platta, kortare håll — intensitet framför duration", why: "Adduktorstyrka vid högre intensitet för skadetålighet" },
          { name: "Viktad Pull-Up (eller lat pulldown)", sets: "3", reps: "6", rest: "90s", cue: "Lägg till vikt — dra hakan över stången, långsam nedsänkning", why: "Övre rygg och lat-styrka för clinch-dominans" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Drop till Vertikalt Hopp", sets: "4", reps: "4", rest: "2min", cue: "Högre låda nu — absorbera och omdirigera snabbare", why: "Avancerad reaktiv styrka för explosiv sparkinitiering" },
          { name: "Rotations Medicinboll Slam", sets: "4", reps: "5/sida", rest: "75s", cue: "Maximal hastighet — rotera och slamma så hårt som möjligt", why: "Topp rotationskraft output för vändningssparkar" },
          { name: "Hängande Vindrutetorkare", sets: "3", reps: "6/sida", rest: "60s", cue: "Ben ihop, rotera sida till sida med kontroll", why: "Avancerad rotations core-styrka vid högt krav" },
          { name: "Reaktiva Laterala Hopp", sets: "4", reps: "5/sida", rest: "60s", cue: "Hoppa lateralt, stick landningen 1 sek, hoppa tillbaka", why: "Lateral explosiv kraft för utskärningar och vinkeländringar" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Smalgreppsbänkpress", sets: "4", reps: "5", rest: "2min", cue: "Händer axelbredd, armbågar intill — triceps-dominant pressning", why: "Triceps och anterior deltoid styrka för slagkraft" },
          { name: "Bakfot-Förhöjd Split Squat (belastad)", sets: "3", reps: "6/sida", rest: "90s", cue: "Håll hantlar, gå tungt — detta är din primära benövning idag", why: "Tung ensidig belastning för enbens kraftutveckling" },
          { name: "Dragon Flag (eller excentrisk bara)", sets: "3", reps: "5", rest: "60s", cue: "Sänk kroppen som en enhet — gå bara så långt du kan kontrollera", why: "Elitnivå anti-extension core-styrka" },
          { name: "Extern Rotation (kabel/band)", sets: "3", reps: "12/sida", rest: "30s", cue: "Armbåge fäst vid sidan, rotera utåt, kontrollera returen", why: "Rotator cuff skadeförebyggande för repetitiva armrörelser" },
        ]},
      ]
    },
    {
      weekNum: 7, phase: "Intensifiering", phaseColor: "bg-accent/15 text-accent", focus: "Toppintensitet — tyngsta belastningarna i programmet",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Back Squat", sets: "5", reps: "3", rest: "3min", cue: "Tyngsta knäböj i programmet — singelmentalitet på varje rep", why: "Nära-maximal styrka driver neurala anpassningar för kraftutput" },
          { name: "Trap Bar Marklyft", sets: "4", reps: "3", rest: "2.5min", cue: "Tunga tripplar — håll stången i rörelse snabbt, avbryt om hastighet sjunker", why: "Topp höftextensionsstyrka för explosiv rörelse" },
          { name: "Pallof Press (tungt band)", sets: "3", reps: "8/sida", rest: "45s", cue: "Tjockaste bandet — motstå rotation under verklig belastning", why: "Anti-rotation vid matchrelevant intensitet" },
          { name: "Viktad Pull-Up", sets: "4", reps: "4", rest: "2min", cue: "Lägg till mer vikt — dra snabbt, kontrollera nedsänkning 3 sekunder", why: "Topp överkroppens dragstyrka" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump till Max Vertikalt", sets: "5", reps: "3", rest: "2.5min", cue: "Maximal höjd varje rep — full återhämtning mellan set", why: "Topp reaktiv kraftutput — matchhastighetens rörelse" },
          { name: "Shot Put Kast (medicinboll)", sets: "4", reps: "5/sida", rest: "75s", cue: "Steg, rotera, kasta — hela kroppens kraftkedja", why: "Total kroppskraftintegration för slag" },
          { name: "Hängande L-Sit Håll", sets: "3", reps: "15s", rest: "60s", cue: "Ben raka vid 90°, kläm allt — inget svängande", why: "Höftflexor och core-uthållighet vid topp isometrisk styrka" },
          { name: "5-10-5 Shuttle Sprint", sets: "5", reps: "1", rest: "90s", cue: "Max ansträngning — aggressiv deceleration och re-acceleration", why: "Riktningsändringshastighet för ringrörelser och vinkelskärning" },
        ]},
        { name: "Fredag", type: "strength", exercises: [
          { name: "Smalgreppsbänkpress", sets: "4", reps: "4", rest: "2.5min", cue: "Tyngsta pressningen i programmet — full kontroll, snabb koncentrisk", why: "Topp pressstyrka för slagkraft" },
          { name: "Bakfot-Förhöjd Split Squat", sets: "4", reps: "5/sida", rest: "2min", cue: "Tyngre än vecka 6 — äg varje rep på varje ben", why: "Topp ensidig styrka för spark-kraft" },
          { name: "Dragon Flag", sets: "3", reps: "6", rest: "60s", cue: "En rep mer än vecka 6 — förtjäna det med kontroll", why: "Core-styrkeprogression vid topp programintensitet" },
          { name: "Axel Prehab-Cirkel", sets: "2", reps: "10 varje", rest: "30s", cue: "Y-raise, T-raise, extern rotation — lätt, kontrollerat, förebyggande", why: "Underhållsprehab under hög träningsbelastning" },
        ]},
      ]
    },
    {
      weekNum: 8, phase: "Peaking / Nedtrappning", phaseColor: "bg-explosive/15 text-explosive", focus: "Reducera volymen drastiskt, behåll hastighet — tävlingsklar",
      days: [
        { name: "Måndag", type: "strength", exercises: [
          { name: "Back Squat", sets: "3", reps: "2", rest: "3min", cue: "Tunga dubbletter — snabba och skarpa, känn dig kraftfull inte trött", why: "Behåller topp neural drive med minimal trötthetskostnad" },
          { name: "Power Clean (eller Hang Clean)", sets: "3", reps: "2", rest: "2.5min", cue: "Explosiv trippelextension — fånga den rent, res dig snabbt", why: "Helkropps explosiv koordination — topp matchberedskap" },
          { name: "Band Pull-Apart", sets: "2", reps: "15", rest: "30s", cue: "Lätt prehab — håll axlarna friska inför tävling", why: "Underhållsarbete för att gå in frisk i tävling" },
        ]},
        { name: "Onsdag", type: "power", exercises: [
          { name: "Depth Jump (låg låda)", sets: "3", reps: "3", rest: "2.5min", cue: "Lägre låda, maximal intent — känn dig fjädrande, inte tung", why: "Reaktiv power-priming utan CNS-trötthet" },
          { name: "Medicinboll Rotationskast", sets: "3", reps: "4/sida", rest: "75s", cue: "Maximal hastighet — föreställ dig att kasta genom ett mål", why: "Rotationskraft-tuning för tävlingssparkar" },
          { name: "Lätt Core Cirkel", sets: "2", reps: "8 varje", rest: "30s", cue: "Dead bug, bird dog, planka — bara aktivera, tröttas inte ut", why: "Core-aktivering utan att ackumulera trötthet" },
        ]},
        { name: "Fredag", type: "recovery", exercises: [
          { name: "Foam Rolling + Stretching", sets: "1", reps: "15min", rest: "—", cue: "Hela kroppen, försiktigt — detta är förberedelse, inte träning", why: "Vävnadsförberedelse för tävlingsdag" },
          { name: "Visualisering + Andning", sets: "1", reps: "10min", rest: "—", cue: "Blunda, andas 4-4-4, visualisera dina matcher runda för runda", why: "Mental förberedelse är fysisk förberedelse — prima ditt nervsystem" },
          { name: "Lätt Promenad eller Simning", sets: "1", reps: "20min", rest: "—", cue: "Lätt rörelse — spola systemet, håll dig lös", why: "Aktiv återhämtning för att behålla rörlighet utan träningsstress" },
        ]},
      ]
    },
  ],
};

const TYPE_ICONS = {
  strength: Dumbbell,
  tkd: Shield,
  power: Zap,
  recovery: Battery,
};

const TYPE_COLORS = {
  strength: "text-primary",
  tkd: "text-accent",
  power: "text-destructive",
  recovery: "text-muted-foreground",
};

const LABELS: Record<string, Record<string, string>> = {
  en: { title: "8-Week Sparring Preparation Program", btnLabel: "See full program", sets: "Sets", reps: "Reps", rest: "Rest", coachingCue: "Coaching cue", tkdRelevance: "TKD relevance", week: "Week", phase: "Phase" },
  da: { title: "8-Ugers Sparring Forberedelsesprogram", btnLabel: "Se fuldt program", sets: "Sæt", reps: "Reps", rest: "Hvile", coachingCue: "Coaching cue", tkdRelevance: "TKD-relevans", week: "Uge", phase: "Fase" },
  sv: { title: "8-Veckors Sparring Förberedningsprogram", btnLabel: "Se fullt program", sets: "Set", reps: "Reps", rest: "Vila", coachingCue: "Coaching cue", tkdRelevance: "TKD-relevans", week: "Vecka", phase: "Fas" },
};

export function SampleProgramDialog() {
  const { locale } = useLanguage();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const weeks = PROGRAM[locale] || PROGRAM.en;
  const labels = LABELS[locale] || LABELS.en;
  const week = weeks[selectedWeek];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4 font-semibold text-xs border-primary/30 text-primary hover:bg-primary/10">
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          {labels.btnLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
          <DialogTitle className="text-base font-black tracking-tight">{labels.title}</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          {/* Week selector - timeline */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {weeks.map((w, i) => (
              <button
                key={i}
                onClick={() => { setSelectedWeek(i); setExpandedExercise(null); }}
                className={cn(
                  "flex-shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer",
                  selectedWeek === i
                    ? `${w.phaseColor} border-current`
                    : "bg-secondary/30 text-muted-foreground border-border hover:bg-secondary/60"
                )}
              >
                {labels.week} {w.weekNum}
              </button>
            ))}
          </div>

          {/* Phase info */}
          <div className={cn("rounded-lg border px-4 py-3", week.phaseColor)}>
            <p className="text-xs font-bold uppercase tracking-wider">{labels.phase}: {week.phase}</p>
            <p className="text-xs opacity-80 mt-1">{week.focus}</p>
          </div>

          {/* Days */}
          <div className="space-y-4">
            {week.days.map((day) => {
              const DayIcon = TYPE_ICONS[day.type];
              return (
                <div key={day.name} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-secondary/20 border-b border-border">
                    <DayIcon className={cn("h-4 w-4", TYPE_COLORS[day.type])} />
                    <span className="text-sm font-bold text-foreground">{day.name}</span>
                    <Badge variant="outline" className="ml-auto text-[9px] uppercase tracking-wider">
                      {day.type}
                    </Badge>
                  </div>

                  <div className="divide-y divide-border">
                    {day.exercises.map((ex, ei) => {
                      const exKey = `${day.name}-${ei}`;
                      const isOpen = expandedExercise === exKey;
                      return (
                        <button
                          key={ei}
                          onClick={() => setExpandedExercise(isOpen ? null : exKey)}
                          className="w-full text-left px-4 py-2.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-muted-foreground w-5">{String(ei + 1).padStart(2, "0")}</span>
                            <span className="text-xs font-semibold text-foreground flex-1">{ex.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                              {ex.sets}×{ex.reps}
                            </span>
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>

                          {isOpen && (
                            <div className="mt-2.5 ml-8 space-y-2 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-4 text-[10px] text-muted-foreground">
                                <span><strong>{labels.sets}:</strong> {ex.sets}</span>
                                <span><strong>{labels.reps}:</strong> {ex.reps}</span>
                                <span><strong>{labels.rest}:</strong> {ex.rest}</span>
                              </div>
                              <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                                  <Info className="h-3 w-3" /> {labels.coachingCue}
                                </p>
                                <p className="text-xs text-foreground/80 leading-relaxed">{ex.cue}</p>
                              </div>
                              <div className="rounded-lg bg-accent/5 border border-accent/10 p-2.5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground mb-1">
                                  🥋 {labels.tkdRelevance}
                                </p>
                                <p className="text-xs text-foreground/80 leading-relaxed">{ex.why}</p>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
