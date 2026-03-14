import { useNavigate } from "react-router-dom";
import { Dumbbell, Brain, UtensilsCrossed, ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const libraries = [
  {
    id: "exercise",
    label: "Exercises",
    description: "Taekwondo-focused exercises with video demos",
    icon: Dumbbell,
    color: "text-primary",
    bgClass: "bg-primary/10 border-primary/20 hover:border-primary/40",
  },
  {
    id: "mental",
    label: "Mental Training",
    description: "Focus, visualization & mental toughness drills",
    icon: Brain,
    color: "text-tab-mental",
    bgClass: "bg-tab-mental/10 border-tab-mental/20 hover:border-tab-mental/40",
  },
  {
    id: "nutrition",
    label: "Nutrition & Recipes",
    description: "Athlete-focused meals and meal planning",
    icon: UtensilsCrossed,
    color: "text-tab-nutrition",
    bgClass: "bg-tab-nutrition/10 border-tab-nutrition/20 hover:border-tab-nutrition/40",
  },
];

export default function LibraryChooser() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold text-foreground">Library</span>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-2">Choose a Library</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Browse exercises, mental training drills, or nutrition recipes.
        </p>

        <div className="grid gap-4">
          {libraries.map((lib) => (
            <button
              key={lib.id}
              onClick={() => navigate(`/library/${lib.id}`)}
              className={`flex items-center gap-4 p-5 rounded-xl border transition-all cursor-pointer text-left ${lib.bgClass}`}
            >
              <div className={`h-12 w-12 rounded-lg bg-card flex items-center justify-center shrink-0`}>
                <lib.icon className={`h-6 w-6 ${lib.color}`} />
              </div>
              <div>
                <div className="font-bold text-foreground text-base">{lib.label}</div>
                <div className="text-sm text-muted-foreground">{lib.description}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
