import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, Wrench, AlertTriangle, Calendar, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOption, getAvailableRepairs, simulateRepairs } from '@/data/repairOptions';
import { calculateOpterraRisk, failProbToHealthScore, projectFutureHealth, ForensicInputs } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RepairPlannerProps {
  onBack: () => void;
  onSchedule: (selectedRepairs: RepairOption[]) => void;
  currentInputs: ForensicInputs;
}

function useAnimatedNumber(target: number, duration: number = 400) {
  const [current, setCurrent] = useState(target);
  const [prevTarget, setPrevTarget] = useState(target);

  useEffect(() => {
    if (target === prevTarget) return;
    
    const startValue = current;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      
      setCurrent(Math.round(value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPrevTarget(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, prevTarget, current, duration]);

  return current;
}

export function RepairPlanner({ onBack, onSchedule, currentInputs }: RepairPlannerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [doNothingOpen, setDoNothingOpen] = useState(false);

  const opterraResult = calculateOpterraRisk(currentInputs);
  const { bioAge, failProb, agingRate } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;

  // If replacement is required, this component shouldn't be shown
  // Redirect back to dashboard (parent will route to correct screen)
  const replacementRequired = recommendation.action === 'REPLACE';
  
  useEffect(() => {
    if (replacementRequired) {
      onBack();
    }
  }, [replacementRequired, onBack]);

  const currentScore = failProbToHealthScore(failProb);
  const currentAgingFactor = bioAge / currentInputs.calendarAge;
  const currentFailureProb = Math.round(failProb * 10) / 10;

  const availableRepairs = getAvailableRepairs(currentInputs, opterraResult.metrics, recommendation);
  const individualRepairs = availableRepairs.filter(r => !r.isFullReplacement);

  const toggleRepair = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedRepairs = availableRepairs.filter(r => selectedIds.has(r.id));

  const result = useMemo(() => 
    simulateRepairs(currentScore, currentAgingFactor, currentFailureProb, selectedRepairs),
    [currentScore, currentAgingFactor, currentFailureProb, selectedRepairs]
  );

  const animatedNewScore = useAnimatedNumber(selectedRepairs.length > 0 ? result.newScore : currentScore);

  const projection6 = projectFutureHealth(bioAge, agingRate, 6);
  const projection12 = projectFutureHealth(bioAge, agingRate, 12);
  const projection24 = projectFutureHealth(bioAge, agingRate, 24);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Minimal Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-3 px-4">
        <div className="flex items-center max-w-md mx-auto">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">
        {/* Warm Intro */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground">Here's what needs attention</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A few targeted repairs can make a real difference
          </p>
        </div>

        {/* Health Score Card */}
        <div className="mb-6 p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Health</p>
              <p className="text-3xl font-bold text-foreground">{animatedNewScore}</p>
            </div>
            {selectedRepairs.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">After Repairs</p>
                <p className="text-lg font-semibold text-emerald-500">+{result.newScore - currentScore} pts</p>
              </div>
            )}
          </div>
          
          {/* Health Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full rounded-full transition-all ${
                animatedNewScore >= 70 ? 'bg-emerald-500' :
                animatedNewScore >= 50 ? 'bg-amber-500' :
                'bg-orange-500'
              }`}
              style={{ width: `${animatedNewScore}%` }}
            />
          </div>
        </div>

        {individualRepairs.length > 0 ? (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Repairs</p>
            {individualRepairs.map((repair) => {
              const isSelected = selectedIds.has(repair.id);
              return (
                <button
                  key={repair.id}
                  onClick={() => toggleRepair(repair.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card/50 hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{repair.name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px] p-3">
                              <p className="font-semibold text-foreground text-xs mb-2">Impact Breakdown</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Health Score</span>
                                  <span className="text-green-400">+{repair.impact.healthScoreBoost} pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Aging Slowdown</span>
                                  <span className="text-green-400">-{repair.impact.agingFactorReduction}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Failure Risk</span>
                                  <span className="text-green-400">-{repair.impact.failureProbReduction}%</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-xs text-green-400/80">+{repair.impact.healthScoreBoost} pts</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{repair.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-card border border-border text-center mb-4">
            <p className="text-muted-foreground">No repairs available for your current unit status.</p>
          </div>
        )}

        <Collapsible open={doNothingOpen} onOpenChange={setDoNothingOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full clean-card border-zinc-700/50 bg-zinc-900/30 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">If You Continue Monitoring</span>
                </div>
                {doNothingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="clean-card border-zinc-700/50 bg-zinc-900/30 mb-4 -mt-2">
              <p className="text-xs text-muted-foreground mb-4">Without maintenance, here's the projected timeline:</p>
              <div className="space-y-3">
                {[{ months: 6, ...projection6 }, { months: 12, ...projection12 }, { months: 24, ...projection24 }].map((projection) => (
                  <div key={projection.months} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">In {projection.months} months</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`text-sm font-bold font-data ${projection.healthScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{projection.healthScore}</span>
                        <span className="text-xs text-muted-foreground"> score</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold font-data text-red-400">{projection.failProb.toFixed(0)}%</span>
                        <span className="text-xs text-muted-foreground"> risk</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {selectedRepairs.length > 0 && (
          <div className="clean-card mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
              <span className="font-semibold text-foreground">${result.totalCostMin.toLocaleString()} - ${result.totalCostMax.toLocaleString()}</span>
            </div>
          </div>
        )}

        {selectedRepairs.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">These repairs extend life but don't reset the {currentInputs.calendarAge}-year paper age.</p>
          </div>
        )}
      </div>

      {selectedRepairs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="max-w-md mx-auto">
            <Button onClick={() => onSchedule(selectedRepairs)} className="w-full h-14 text-base font-semibold">
              Let's Get This Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}