import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Zap, Target, Shield, Dumbbell, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) navigate("/dashboard");
      else setChecking(false);
    });
  }, [navigate]);

  if (checking) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg text-center space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-energy shadow-glow">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            TKD <span className="text-gradient-energy">POWER</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            AI-powered strength & conditioning for taekwondo athletes. Build explosive power, speed, and resilience — without getting slow.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Personalized</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Dumbbell className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">AI Generated</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <Shield className="h-5 w-5 text-speed mx-auto mb-1" />
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">TKD Specific</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/auth")} size="lg">
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/library")} size="lg">
              Browse Exercises
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          Built for taekwondo athletes. Train fast, stay fast.
        </p>
      </footer>
    </div>
  );
};

export default Index;
