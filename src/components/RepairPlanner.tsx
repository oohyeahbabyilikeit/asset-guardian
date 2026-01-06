import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, Sparkles, Wrench, AlertTriangle, CheckCircle2, TrendingDown, Calendar, ChevronDown, ChevronUp, Info } from 'lucide-react';
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

  // Calculate metrics
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { bioAge, failProb, agingRate } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;

  const currentScore = failProbToHealthScore(failProb);
  const currentAgingFactor = bioAge / currentInputs.calendarAge;
  const currentFailureProb = Math.round(failProb * 10) / 10;

  const replacementRequired = recommendation.action === 'REPLACE';
  const availableRepairs = getAvailableRepairs(currentInputs, opterraResult.metrics, recommendation);

  // Auto-select replacement if required
  useEffect(() => {
    if (replacementRequired && !selectedIds.has('replace')) {
      setSelectedIds(new Set(['replace']));
    }
  }, [replacementRequired]);

  const fullReplacement = availableRepairs.find(r => r.isFullReplacement);
  const individualRepairs = availableRepairs.filter(r => !r.isFullReplacement);
  const isReplacementSelected = selectedIds.has('replace');

  const toggleRepair = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (id === 'replace') {
        if (next.has('replace')) {
          next.delete('replace');
        } else {
          next.clear();
          next.add('replace');
        }
      } else {
        next.delete('replace');
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  };

  const selectedRepairs = availableRepairs.filter(r => selectedIds.has(r.id));

  // Simulate impact in real-time
  const result = useMemo(() => 
    simulateRepairs(currentScore, currentAgingFactor, currentFailureProb, selectedRepairs),
    [currentScore, currentAgingFactor, currentFailureProb, selectedRepairs]
  );

  const animatedNewScore = useAnimatedNumber(selectedRepairs.length > 0 ? result.newScore : currentScore);
  const scoreImprovement = result.newScore - currentScore;

  // Do Nothing projections
  const projection6 = projectFutureHealth(bioAge, agingRate, 6);
  const projection12 = projectFutureHealth(bioAge, agingRate, 12);
  const projection24 = projectFutureHealth(bioAge, agingRate, 24);

  const getStatusColor = (status: 'critical' | 'warning' | 'optimal') => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'optimal': return 'text-green-400';
    }
  };

  const getStatusBg = (status: 'critical' | 'warning' | 'optimal') => {
    switch (status) {
      case 'critical': return 'bg-red-500/20 border-red-500/30';
      case 'warning': return 'bg-amber-500/20 border-amber-500/30';
      case 'optimal': return 'bg-green-500/20 border-green-500/30';
    }
  };

  const currentStatus = failProb >= 20 ? 'critical' : failProb >= 10 ? 'warning' : 'optimal';
  const projectedStatus = selectedRepairs.length > 0 ? result.newStatus : currentStatus;

  // Handle "No Repairs Needed" state
  if (recommendation.action === 'PASS' && availableRepairs.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

        <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-foreground">System Status</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="relative p-6 max-w-md mx-auto text-center py-16">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-3">No Repairs Needed</h2>
          <p className="text-muted-foreground mb-8">
            Your water heater is operating within safe parameters. Continue regular maintenance to keep it healthy.
          </p>
          <Button onClick={onBack} variant="outline" className="w-full max-w-xs">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-foreground">Plan Your Repairs</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">
        {/* Sticky Impact Preview */}
        <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-4 bg-background/95 backdrop-blur-sm">
          <div className="clean-card border-primary/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 text-center">Impact Preview</p>
            
            <div className="flex items-center justify-center gap-4">
              {/* Current Score */}
              <div className="text-center">
                <div className={`w-16 h-16 rounded-xl border-2 ${getStatusBg(currentStatus)} flex flex-col items-center justify-center`}>
                  <span className={`text-xl font-bold font-data ${getStatusColor(currentStatus)}`}>{currentScore}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Now</p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center">
                <div className={`text-xl transition-colors duration-300 ${selectedRepairs.length > 0 ? 'text-primary' : 'text-muted-foreground/30'}`}>→</div>
                {selectedRepairs.length > 0 && scoreImprovement > 0 && (
                  <span className="text-xs text-green-400 font-medium">+{scoreImprovement}</span>
                )}
              </div>

              {/* Projected Score */}
              <div className="text-center">
                <div 
                  className={`w-16 h-16 rounded-xl border-2 transition-all duration-300 ${getStatusBg(projectedStatus)} flex flex-col items-center justify-center`}
                  style={{
                    boxShadow: selectedRepairs.length > 0 && projectedStatus === 'optimal' 
                      ? '0 0 20px -4px rgba(34, 197, 94, 0.4)' 
                      : undefined
                  }}
                >
                  <span className={`text-xl font-bold font-data transition-colors duration-300 ${getStatusColor(projectedStatus)}`}>
                    {animatedNewScore}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">After</p>
              </div>
            </div>

            {selectedRepairs.length > 0 && !isReplacementSelected && (
              <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                <span className="text-muted-foreground">
                  <TrendingDown className="w-3 h-3 inline mr-1" />
                  Aging: <span className="text-green-400">{result.newAgingFactor.toFixed(1)}x</span>
                </span>
                <span className="text-muted-foreground">
                  Risk: <span className="text-green-400">{result.newFailureProb.toFixed(1)}%</span>
                </span>
              </div>
            )}

            {isReplacementSelected && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Sparkles className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">All risks eliminated with new unit</span>
              </div>
            )}
          </div>
        </div>

        {/* Replacement Required Banner */}
        {replacementRequired && (
          <div className="mb-4 p-4 rounded-xl border-2 border-red-500/50 bg-red-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-400 text-sm mb-1">Replacement Required</p>
                <p className="text-xs text-muted-foreground">
                  {recommendation.reason} Individual repairs are not available for this unit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Full Replacement Option - Only when required */}
        {fullReplacement && replacementRequired && (
          <button
            onClick={() => toggleRepair(fullReplacement.id)}
            className={`w-full text-left mb-4 p-4 rounded-xl border-2 transition-all ${
              isReplacementSelected
                ? 'border-red-500 bg-red-500/10'
                : 'border-red-500/50 bg-red-500/5 hover:border-red-500/70'
            }`}
            style={{
              boxShadow: isReplacementSelected ? '0 0 20px -4px rgba(239, 68, 68, 0.4)' : undefined,
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isReplacementSelected ? 'border-red-500 bg-red-500 text-white' : 'border-red-500/50'
              }`}>
                {isReplacementSelected && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">{fullReplacement.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{fullReplacement.description}</p>
              </div>
            </div>
          </button>
        )}

        {/* Individual Repairs */}
        {!replacementRequired && individualRepairs.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Repairs</p>
            {individualRepairs.map((repair) => {
              const isSelected = selectedIds.has(repair.id);
              return (
                <button
                  key={repair.id}
                  onClick={() => toggleRepair(repair.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/50 hover:border-muted-foreground/50'
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
                                <div className="pt-1.5 border-t border-border mt-1.5">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Est. Lifespan Ext.</span>
                                    <span className="text-primary font-medium">+{Math.round(repair.impact.agingFactorReduction / 10)}-{Math.round(repair.impact.agingFactorReduction / 6)} mo</span>
                                  </div>
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
        )}

        {/* Do Nothing Projection - Collapsible */}
        {!replacementRequired && (
          <Collapsible open={doNothingOpen} onOpenChange={setDoNothingOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full clean-card border-red-500/30 bg-red-500/5 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-foreground">If You Do Nothing</span>
                  </div>
                  {doNothingOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="clean-card border-red-500/30 bg-red-500/5 mb-4 -mt-2">
                <p className="text-xs text-muted-foreground mb-4">
                  Without repairs, your water heater will continue to degrade:
                </p>
                <div className="space-y-3">
                  {[
                    { months: 6, ...projection6 },
                    { months: 12, ...projection12 },
                    { months: 24, ...projection24 },
                  ].map((projection) => (
                    <div key={projection.months} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">In {projection.months} months</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`text-sm font-bold font-data ${projection.healthScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {projection.healthScore}
                          </span>
                          <span className="text-xs text-muted-foreground"> score</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-data text-red-400">
                            {projection.failProb.toFixed(0)}%
                          </span>
                          <span className="text-xs text-muted-foreground"> risk</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Cost Estimate */}
        {selectedRepairs.length > 0 && (
          <div className="clean-card mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
              <span className="font-semibold text-foreground">
                ${result.totalCostMin.toLocaleString()} - ${result.totalCostMax.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Warning Note */}
        {selectedRepairs.length > 0 && !isReplacementSelected && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              These repairs extend life but don't reset the {currentInputs.calendarAge}-year paper age.
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => onSchedule(selectedRepairs)}
            disabled={selectedRepairs.length === 0}
            className="w-full h-14 text-base font-semibold"
          >
            {isReplacementSelected ? 'Request Replacement Quote' : 'Schedule These Repairs'}
          </Button>
        </div>
      </div>
    </div>
  );
}
