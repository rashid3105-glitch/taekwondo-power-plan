import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, Droplet, Flame, Target, Trophy, Utensils } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  competitionName: string;
  plan: any;
}

export function CompetitionPlanDialog({ open, onOpenChange, competitionName, plan }: Props) {
  if (!plan || Object.keys(plan).length === 0) return null;
  const { warnings = [], taperSummary, weeklyTaper = [], weightCut = [], nutritionAdjustments, peakDayProtocol, meta } = plan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> {competitionName} — Peaking & Weight-Cut Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {meta && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Current {meta.currentKg} kg</Badge>
              <Badge variant="outline">Target {meta.targetKg} kg</Badge>
              <Badge variant="outline">Cut {meta.cutKg} kg</Badge>
              <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{meta.daysToEvent} days</Badge>
            </div>
          )}

          {warnings.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-4 space-y-1">
                {warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-destructive text-xs">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {taperSummary && (
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-1"><Target className="h-4 w-4 text-primary" /> Summary</h3>
              <p className="text-muted-foreground">{taperSummary}</p>
            </div>
          )}

          {weeklyTaper.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Flame className="h-4 w-4 text-primary" /> Weekly Taper</h3>
              <div className="space-y-2">
                {weeklyTaper.map((w: any, i: number) => (
                  <Card key={i}><CardContent className="pt-3 pb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Week {w.week}</span>
                      <Badge variant="outline" className="text-xs">{w.intensity} intensity</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{w.focus}</p>
                    <p className="text-xs"><span className="text-muted-foreground">Volume:</span> {w.volumeChange}</p>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {weightCut.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Droplet className="h-4 w-4 text-primary" /> Daily Weight-Cut Schedule</h3>
              <div className="space-y-2">
                {weightCut.map((d: any, i: number) => (
                  <Card key={i}><CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Day -{d.day}</span>
                      <Badge variant="secondary" className="text-xs">{d.targetKg} kg target</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div><span className="font-medium text-foreground">Calories:</span> {d.calorieAdjustment}</div>
                      <div><span className="font-medium text-foreground">Fluid:</span> {d.fluid}</div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </div>
          )}

          {nutritionAdjustments && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Utensils className="h-4 w-4 text-primary" /> Nutrition</h3>
              <Card><CardContent className="pt-3 pb-3 text-xs space-y-1">
                {nutritionAdjustments.dailyCalories && <div><span className="font-medium">Daily calories:</span> {nutritionAdjustments.dailyCalories} kcal</div>}
                {nutritionAdjustments.carbCycling && <div><span className="font-medium">Carb cycling:</span> {nutritionAdjustments.carbCycling}</div>}
                {nutritionAdjustments.hydration && <div><span className="font-medium">Hydration:</span> {nutritionAdjustments.hydration}</div>}
              </CardContent></Card>
            </div>
          )}

          {peakDayProtocol && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-1"><Trophy className="h-4 w-4 text-primary" /> Peak Day Protocol</h3>
              <Card><CardContent className="pt-3 pb-3 text-xs text-muted-foreground">{peakDayProtocol}</CardContent></Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
