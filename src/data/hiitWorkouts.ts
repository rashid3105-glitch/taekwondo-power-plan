export interface HiitInterval {
  name: string;
  korean?: string;
  type: "WORK" | "REST";
  duration: number; // seconds
  description?: string;
}

export interface HiitWorkout {
  id: string;
  name: string;
  category: "kicks" | "conditioning" | "footwork" | "sparring";
  level: "beginner" | "intermediate" | "advanced";
  description: string;
  intervals: HiitInterval[];
}

const REST = (duration = 15): HiitInterval => ({
  name: "Rest",
  korean: "회복",
  type: "REST",
  duration,
  description: "Light footwork, breathe",
});

export const HIIT_WORKOUTS: HiitWorkout[] = [
  {
    id: "tabata-kicks",
    name: "Tabata Kicks",
    category: "kicks",
    level: "intermediate",
    description: "Classic 8-round Tabata with alternating roundhouse kicks. 20s max effort, 10s rest.",
    intervals: Array.from({ length: 8 }).flatMap((_, i) => [
      {
        name: "Dollyo Chagi",
        korean: "돌려차기",
        type: "WORK" as const,
        duration: 20,
        description: "Roundhouse kicks, alternate legs, max speed",
      },
      { ...REST(10) },
    ]),
  },
  {
    id: "olympic-blitz",
    name: "Olympic Blitz",
    category: "kicks",
    level: "advanced",
    description: "Five Olympic-style techniques back-to-back. Build explosive power and stamina.",
    intervals: [
      { name: "Ap Chagi Blitz", korean: "앞차기", type: "WORK", duration: 30, description: "Explosive front kicks, alternate legs" },
      REST(15),
      { name: "Dollyo Chagi Combos", korean: "돌려차기", type: "WORK", duration: 30, description: "3-kick roundhouse combos, both sides" },
      REST(15),
      { name: "Dwi Chagi Power", korean: "뒤차기", type: "WORK", duration: 30, description: "Back kick explosions, drive heel through target" },
      REST(15),
      { name: "Narae Chagi", korean: "나래차기", type: "WORK", duration: 30, description: "Jump double kicks, explosive vertical" },
      REST(15),
      { name: "Gyeorugi Blitz", korean: "겨루기", type: "WORK", duration: 30, description: "Shadow sparring — full combinations" },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 30, description: "Deep breathing, light stretch" },
    ],
  },
  {
    id: "footwork-flow",
    name: "Footwork Flow",
    category: "footwork",
    level: "beginner",
    description: "Develop ring movement and rhythm. Light intervals focused on stance switching and angles.",
    intervals: [
      { name: "Switch Stance", korean: "스위치", type: "WORK", duration: 25, description: "Rapid stance switches in place" },
      REST(20),
      { name: "Lateral Slides", korean: "사이드", type: "WORK", duration: 25, description: "Side-to-side ring movement" },
      REST(20),
      { name: "Step-In Step-Out", korean: "스텝", type: "WORK", duration: 25, description: "Range control, in and out" },
      REST(20),
      { name: "Cut Step Drill", korean: "이단", type: "WORK", duration: 25, description: "Cut step into front leg attack" },
      REST(20),
      { name: "Pivot & Counter", korean: "피벗", type: "WORK", duration: 25, description: "Pivot off line, counter with round kick" },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 30, description: "Walk it out, deep breaths" },
    ],
  },
  {
    id: "sparring-rounds",
    name: "Sparring Rounds",
    category: "sparring",
    level: "advanced",
    description: "Three competition-length rounds (90s) with active recovery. Mimics match intensity.",
    intervals: [
      { name: "Round 1", korean: "1회전", type: "WORK", duration: 90, description: "Shadow sparring — open & score" },
      { name: "Active Rest", korean: "휴식", type: "REST", duration: 60, description: "Slow footwork, hydrate" },
      { name: "Round 2", korean: "2회전", type: "WORK", duration: 90, description: "Counter-attacks & defence" },
      { name: "Active Rest", korean: "휴식", type: "REST", duration: 60, description: "Slow footwork, hydrate" },
      { name: "Round 3", korean: "3회전", type: "WORK", duration: 90, description: "Empty the tank — full combinations" },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 60, description: "Deep breathing, stretch" },
    ],
  },
  {
    id: "conditioning-emom",
    name: "Conditioning EMOM",
    category: "conditioning",
    level: "intermediate",
    description: "Every minute on the minute: 40s burpees / kicks, 20s rest. Six tough rounds.",
    intervals: Array.from({ length: 6 }).flatMap((_, i) => [
      {
        name: i % 2 === 0 ? "Burpee Kicks" : "Squat Jumps",
        korean: i % 2 === 0 ? "버피" : "점프",
        type: "WORK" as const,
        duration: 40,
        description: i % 2 === 0 ? "Burpee + roundhouse kick" : "Explosive squat jumps",
      },
      { ...REST(20) },
    ]),
  },
  {
    id: "speed-spike",
    name: "Speed Spike",
    category: "kicks",
    level: "beginner",
    description: "Short 15s sprints of single technique. Perfect for warm-up or speed development.",
    intervals: [
      { name: "Front Leg Round", korean: "앞다리", type: "WORK", duration: 15, description: "Front leg roundhouse spam" },
      REST(15),
      { name: "Rear Leg Round", korean: "뒷다리", type: "WORK", duration: 15, description: "Rear leg roundhouse, full hip" },
      REST(15),
      { name: "Double Round", korean: "더블", type: "WORK", duration: 15, description: "Two kicks per side, alternate" },
      REST(15),
      { name: "Switch Round", korean: "스위치", type: "WORK", duration: 15, description: "Switch step into round kick" },
      REST(15),
      { name: "Push Kick", korean: "밀어차기", type: "WORK", duration: 15, description: "Push kick to break range" },
      REST(15),
      { name: "Spin Hook", korean: "뒤후려차기", type: "WORK", duration: 15, description: "Spin hook kick, controlled" },
      { name: "Cool Down", korean: "정리", type: "REST", duration: 30, description: "Stretch, breathe" },
    ],
  },
];

export const HIIT_CATEGORY_LABELS: Record<HiitWorkout["category"], string> = {
  kicks: "Kicks",
  conditioning: "Conditioning",
  footwork: "Footwork",
  sparring: "Sparring",
};
