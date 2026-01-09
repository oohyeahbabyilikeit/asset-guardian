import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, Sparkles, Wrench, AlertTriangle, TrendingDown, Calendar, ChevronDown, ChevronUp, Info, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOption, getAvailableRepairs, simulateRepairs } from '@/data/repairOptions';
import { calculateOpterraRisk, failProbToHealthScore, projectFutureHealth, ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { PlumberContactForm } from './PlumberContactForm';
import { SafetyReplacementAlert } from './SafetyReplacementAlert';
import { PriceBreakdown } from './PriceBreakdown';
import { usePricing } from '@/hooks/usePricing';
// Helper function to convert metrics to stress factor format for SafetyReplacementAlert
function convertMetricsToStressFactors(metrics: OpterraMetrics): { name: string; level: 'low' | 'moderate' | 'elevated' | 'critical'; value: number; description: string }[] {
  const factors: { name: string; level: 'low' | 'moderate' | 'elevated' | 'critical'; value: number; description: string }[] = [];
  
  const getLevel = (value: number): 'low' | 'moderate' | 'elevated' | 'critical' => {
    if (value >= 2.0) return 'critical';
    if (value >= 1.5) return 'elevated';
    if (value >= 1.2) return 'moderate';
    return 'low';
  };

  if (metrics.stressFactors.pressure > 1.0) {
    factors.push({ name: 'Water Pressure', level: getLevel(metrics.stressFactors.pressure), value: metrics.stressFactors.pressure, description: `Pressure stress factor of ${metrics.stressFactors.pressure.toFixed(2)}x` });
  }
  if (metrics.stressFactors.sediment > 1.0) {
    factors.push({ name: 'Sediment Buildup', level: metrics.sedimentLbs > 15 ? 'critical' : metrics.sedimentLbs > 8 ? 'elevated' : 'moderate', value: metrics.stressFactors.sediment, description: `${metrics.sedimentLbs.toFixed(1)} lbs accumulated` });
  }
  if (metrics.stressFactors.temp > 1.0) {
    factors.push({ name: 'Temperature Stress', level: getLevel(metrics.stressFactors.temp), value: metrics.stressFactors.temp, description: `Temperature stress factor of ${metrics.stressFactors.temp.toFixed(2)}x` });
  }
  if (metrics.stressFactors.loop > 1.0) {
    factors.push({ name: 'Thermal Expansion', level: getLevel(metrics.stressFactors.loop), value: metrics.stressFactors.loop, description: 'Missing expansion tank causes pressure spikes' });
  }
  if (metrics.stressFactors.circ > 1.0) {
    factors.push({ name: 'Recirculation Loop', level: getLevel(metrics.stressFactors.circ), value: metrics.stressFactors.circ, description: 'Continuous circulation increases wear' });
  }
  if (metrics.shieldLife <= 0) {
    factors.push({ name: 'Anode Depletion', level: 'critical', value: 0, description: 'Sacrificial anode is fully depleted' });
  } else if (metrics.shieldLife < 2) {
    factors.push({ name: 'Anode Depletion', level: 'elevated', value: metrics.shieldLife, description: `Only ${metrics.shieldLife.toFixed(1)} years protection remaining` });
  }
  return factors;
}

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
  const [selectedTimeline, setSelectedTimeline] = useState<'now' | 'later' | 'chances' | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [doNothingOpen, setDoNothingOpen] = useState(false);

  // Real-time pricing from database
  const { quote, unitPrice, loading: priceLoading, error: priceError } = usePricing({
    inputs: currentInputs,
    complexity: 'STANDARD',
    enabled: true,
  });
  // Calculate metrics
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { bioAge, failProb, agingRate } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;
  const financial = opterraResult.financial;

  const currentScore = failProbToHealthScore(failProb);
  const currentAgingFactor = bioAge / currentInputs.calendarAge;
  const currentFailureProb = Math.round(failProb * 10) / 10;

  const replacementRequired = recommendation.action === 'REPLACE';
  
  // Distinguish between safety replacement and economic replacement
  const isSafetyReplacement = replacementRequired && recommendation.badge === 'CRITICAL';
  const isEconomicReplacement = replacementRequired && recommendation.badge !== 'CRITICAL';
  
  const availableRepairs = getAvailableRepairs(currentInputs, opterraResult.metrics, recommendation);

  // Auto-select replacement if required (safety only)
  useEffect(() => {
    if (isSafetyReplacement && !selectedIds.has('replace')) {
      setSelectedIds(new Set(['replace']));
    }
  }, [isSafetyReplacement]);

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

  // If unit is healthy (PASS), redirect should happen at parent level
  // This component now focuses purely on repair/replacement flows

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
          <h1 className="font-bold text-foreground">
            {isEconomicReplacement ? 'Plan Your Upgrade' : 'Understanding Your Options'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">

        {/* Replacement Banner - Enhanced for Safety Replacement */}
        {isSafetyReplacement && (
          <div className="mb-4">
            <SafetyReplacementAlert
              reason={recommendation.reason}
              location={currentInputs.location}
              stressFactors={convertMetricsToStressFactors(opterraResult.metrics)}
              agingRate={agingRate}
              bioAge={bioAge}
              chronoAge={currentInputs.calendarAge}
              breachDetected={currentInputs.isLeaking || currentInputs.visualRust}
            />
          </div>
        )}

        {/* Economic Replacement - Proactive Planning Framing */}
        {isEconomicReplacement && (
          <>
            {/* Upgrade Recommended Banner */}
            <div className="mb-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-primary text-sm mb-1">Upgrade Recommended</p>
                  <p className="text-xs text-muted-foreground">
                    {recommendation.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Why Repairs Aren't Recommended */}
            <div className="clean-card mb-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-foreground">Why Repairs Aren't Recommended</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-muted-foreground">Unit is aging at <strong className="text-foreground">{agingRate.toFixed(1)}x</strong> normal rate</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-muted-foreground">Biological wear: <strong className="text-foreground">{Math.round(bioAge)} years</strong> on a {currentInputs.calendarAge}-year unit</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-muted-foreground">Repairs would extend life by only <strong className="text-foreground">1-2 years</strong> at current wear rate</span>
                </div>
              </div>
            </div>

            {/* Your Replacement Options - Real Pricing Integration */}
            <div className="clean-card mb-4 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Your Replacement Options</span>
              </div>
              
              {/* Detected Tier Badge */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Current Unit:</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                  {financial.currentTier.tierLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({financial.currentTier.warrantyYears}-yr warranty)
                </span>
              </div>
              
              {/* Real-Time Price Breakdown */}
              {priceLoading ? (
                <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading real-time pricing...</span>
                </div>
              ) : quote ? (
                <div className="space-y-3">
                  <PriceBreakdown 
                    quote={quote} 
                    unitPrice={unitPrice} 
                    loading={false} 
                    error={priceError} 
                  />
                </div>
              ) : (
                /* Fallback to hardcoded if no real price available */
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-foreground">Match Current Quality</span>
                      <p className="text-xs text-muted-foreground">{financial.currentTier.tierLabel} replacement</p>
                    </div>
                    <span className="font-bold text-foreground">${financial.likeForLikeCost.toLocaleString()}</span>
                  </div>
                  
                  {/* Upgrade Option (if available) */}
                  {financial.upgradeTier && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Upgrade to {financial.upgradeTier.tierLabel}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            BETTER VALUE
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{financial.upgradeValueProp}</p>
                      </div>
                      <span className="font-bold text-green-400">${financial.upgradeCost?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                {financial.recommendation}
              </p>
            </div>

            {/* Timeline Options */}
            <div className="space-y-3 mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Choose Your Timeline</p>
              
              {/* Option 1: Replace Now */}
              <button
                onClick={() => {
                  setSelectedTimeline('now');
                  setSelectedIds(new Set(['replace']));
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTimeline === 'now'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card/50 hover:border-primary/50'
                }`}
                style={{
                  boxShadow: selectedTimeline === 'now' ? '0 0 20px -4px hsl(var(--primary) / 0.4)' : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedTimeline === 'now' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                  }`}>
                    {selectedTimeline === 'now' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">Replace Now</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Schedule on your terms, avoid emergency pricing</p>
                    <p className="text-xs text-green-400 mt-1.5">Best for peace of mind</p>
                  </div>
                </div>
              </button>
              
              {/* Option 2: Replace Within 12 Months */}
              <button
                onClick={() => {
                  setSelectedTimeline('later');
                  setSelectedIds(new Set(['replace']));
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTimeline === 'later'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card/50 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedTimeline === 'later' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                  }`}>
                    {selectedTimeline === 'later' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground mb-1">Replace Within 12 Months</div>
                    <p className="text-sm text-muted-foreground">Start saving now, schedule when ready</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Save <span className="text-primary font-medium">${financial.monthlyBudget}/mo</span> to prepare
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 3: I'll Take My Chances */}
              <button
                onClick={() => {
                  setSelectedTimeline('chances');
                  setSelectedIds(new Set());
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTimeline === 'chances'
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedTimeline === 'chances' ? 'border-amber-500 bg-amber-500 text-white' : 'border-muted-foreground/30'
                  }`}>
                    {selectedTimeline === 'chances' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-muted-foreground mb-1">I'll Take My Chances</div>
                    <p className="text-sm text-muted-foreground">Continue monitoring, no action now</p>
                  </div>
                </div>
              </button>

              {/* Show projections when "chances" is selected */}
              {selectedTimeline === 'chances' && (
                <div className="clean-card border-red-500/30 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-foreground">Projected Decline</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Without replacement, here's what to expect:
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
                  <div className="mt-4 pt-3 border-t border-red-500/20">
                    <p className="text-xs text-red-400">
                      At {agingRate.toFixed(1)}x aging rate, failure risk increases significantly each year.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Full Replacement Option - Only for SAFETY replacement */}
        {fullReplacement && isSafetyReplacement && (
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

        {/* Continue Monitoring Projection - Collapsible */}
        {!replacementRequired && (
          <Collapsible open={doNothingOpen} onOpenChange={setDoNothingOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full clean-card border-zinc-700/50 bg-zinc-900/30 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">If You Continue Monitoring</span>
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
              <div className="clean-card border-zinc-700/50 bg-zinc-900/30 mb-4 -mt-2">
                <p className="text-xs text-muted-foreground mb-4">
                  Without maintenance, here's the projected timeline:
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

      {/* Fixed Bottom Action - Only show when an option is selected */}
      {(isEconomicReplacement ? selectedTimeline !== null : selectedRepairs.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="max-w-md mx-auto">
            <Button
              onClick={() => {
                if (isEconomicReplacement) {
                  if (selectedTimeline === 'chances') {
                    onBack();
                  } else {
                    setShowContactForm(true);
                  }
                } else {
                  onSchedule(selectedRepairs);
                }
              }}
              className="w-full h-14 text-base font-semibold"
              variant={selectedTimeline === 'chances' ? 'outline' : 'default'}
            >
              {isEconomicReplacement 
                ? (selectedTimeline === 'now' 
                    ? 'Schedule Replacement' 
                    : selectedTimeline === 'chances'
                      ? 'Continue Monitoring'
                      : 'Speak with a Plumber')
                : isReplacementSelected 
                  ? 'Request Replacement Quote' 
                  : 'Schedule These Repairs'}
            </Button>
          </div>
        </div>
      )}

      <PlumberContactForm
        open={showContactForm}
        onOpenChange={setShowContactForm}
        onSubmit={(data) => {
          toast.success(`Thanks ${data.name}! A plumber will call you soon.`);
          setShowContactForm(false);
        }}
      />
    </div>
  );
}
