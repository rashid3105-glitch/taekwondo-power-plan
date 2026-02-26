import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { WeekSchedulePicker, type DaySchedule } from "@/components/WeekSchedulePicker";

const BELT_LEVELS = ["white", "yellow", "green", "blue", "red", "black"];
const GOAL_OPTIONS = [
  "Faster kicks",
  "More explosive footwork",
  "Competition prep",
  "Build lean muscle",
  "Injury prevention",
  "Improve flexibility",
  "General fitness",
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday", type: "tkd" },
  { day: "Tuesday", type: "gym" },
  { day: "Wednesday", type: "tkd" },
  { day: "Thursday", type: "gym" },
  { day: "Friday", type: "tkd" },
  { day: "Saturday", type: "gym" },
  { day: "Sunday", type: "rest" },
];

export default function ProfileSetup() {
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [belt, setBelt] = useState("white");
  const [experience, setExperience] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const tkdCount = schedule.filter((s) => s.type === "tkd").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").update({
        age: age ? parseInt(age) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        belt_level: belt,
        experience_years: experience ? parseInt(experience) : null,
        tkd_sessions_per_week: tkdCount,
        goals,
        weekly_schedule: schedule as any,
      }).eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Profile saved!" });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-energy mb-3">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">Athlete Profile</h1>
          <p className="text-sm text-muted-foreground">Tell us about yourself so we can build your perfect plan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="belt">Belt Level</Label>
              <select
                id="belt"
                value={belt}
                onChange={(e) => setBelt(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {BELT_LEVELS.map((b) => (
                  <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)} Belt</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="exp">Years of Experience</Label>
              <Input id="exp" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="3" />
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <Label>Weekly Schedule</Label>
            <p className="text-xs text-muted-foreground mb-2">Tap each day to cycle between TKD, Gym, and Rest</p>
            <WeekSchedulePicker schedule={schedule} onChange={setSchedule} />
          </div>

          <div>
            <Label>Training Goals</Label>
            <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  data-active={goals.includes(goal)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium border border-border transition-colors cursor-pointer
                    data-[active=true]:bg-primary data-[active=true]:text-primary-foreground
                    data-[active=false]:text-muted-foreground hover:text-foreground"
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Profile & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
