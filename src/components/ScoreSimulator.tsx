import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, AlertTriangle, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOption, simulateRepairs, SimulatedResult } from '@/data/repairOptions';
import { formatCurrency } from '@/data/mockAsset';
import { calculateOpterraRisk, failProbToHealthScore, projectFutureHealth, ForensicInputs } from '@/lib/opterraAlgorithm';

interface ScoreSimulatorProps {
  selectedRepairs: RepairOption[];
  onBack: () => void;
  onSchedule: () => void;
  currentInputs: ForensicInputs;
}

function useAnimatedNumber(target: number, duration: number = 1500, startFrom: number = 0) {
  const [current, setCurrent] = useState(startFrom);

  useEffect(() => {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startFrom + (target - startFrom) * eased;
      
      setCurrent(Math.round(value * 10) / 10);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, startFrom]);

  return current;
}

function useDelayedAnimatedNumber(target: number, startFrom: number, delay: number, duration: number = 800) {
  const [current, setCurrent] = useState(startFrom);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Dramatic easing - slow start, fast middle, slow end
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const value = startFrom + (target - startFrom) * eased;
      setCurrent(Math.round(value * 10) / 10);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [started, target, startFrom, duration]);

  return current;
}

export function ScoreSimulator({ selectedRepairs, onBack, onSchedule, currentInputs }: ScoreSimulatorProps) {
  // Calculate health score dynamically from CURRENT inputs
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { bioAge, failProb } = opterraResult.metrics;
  
  const dynamicHealthScore = {
    score: failProbToHealthScore(failProb),
    status: (failProb >= 20 ? 'critical' : failProb >= 10 ? 'warning' : 'optimal') as 'critical' | 'warning' | 'optimal',
    failureProbability: Math.round(failProb * 10) / 10,
  };

  const currentAgingFactor = bioAge / currentInputs.calendarAge;
  
  const result: SimulatedResult = simulateRepairs(
    dynamicHealthScore.score,
    currentAgingFactor,
    dynamicHealthScore.failureProbability,
    selectedRepairs
  );

  const animatedNewScore = useAnimatedNumber(result.newScore);
  const animatedAgingFactor = useAnimatedNumber(result.newAgingFactor);
  const animatedFailureProb = useAnimatedNumber(result.newFailureProb);

  const isFullReplacement = selectedRepairs.some(r => r.isFullReplacement);

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

  const scoreImprovement = result.newScore - dynamicHealthScore.score;
  const agingImprovement = Math.round((1 - result.newAgingFactor / currentAgingFactor) * 100);
  const failureImprovement = Math.round((1 - result.newFailureProb / dynamicHealthScore.failureProbability) * 100);

  // "Do Nothing" projection - use actual algorithm
  const agingRate = opterraResult.metrics.agingRate;
  const currentBioAge = opterraResult.metrics.bioAge;
  
  const projection6 = projectFutureHealth(currentBioAge, agingRate, 6);
  const projection12 = projectFutureHealth(currentBioAge, agingRate, 12);
  const projection24 = projectFutureHealth(currentBioAge, agingRate, 24);
  
  const doNothingTargets = [
    { months: 6, score: projection6.healthScore, failureProb: projection6.failProb },
    { months: 12, score: projection12.healthScore, failureProb: projection12.failProb },
    { months: 24, score: projection24.healthScore, failureProb: projection24.failProb },
  ];

  // Animated "Do Nothing" values with staggered delays
  const doNothing6Score = useDelayedAnimatedNumber(doNothingTargets[0].score, dynamicHealthScore.score, 500, 600);
  const doNothing6Risk = useDelayedAnimatedNumber(doNothingTargets[0].failureProb, dynamicHealthScore.failureProbability, 500, 600);
  const doNothing12Score = useDelayedAnimatedNumber(doNothingTargets[1].score, dynamicHealthScore.score, 900, 700);
  const doNothing12Risk = useDelayedAnimatedNumber(doNothingTargets[1].failureProb, dynamicHealthScore.failureProbability, 900, 700);
  const doNothing24Score = useDelayedAnimatedNumber(doNothingTargets[2].score, dynamicHealthScore.score, 1300, 800);
  const doNothing24Risk = useDelayedAnimatedNumber(doNothingTargets[2].failureProb, dynamicHealthScore.failureProbability, 1300, 800);

  const animatedDoNothing = [
    { months: 6, score: doNothing6Score, failureProb: doNothing6Risk },
    { months: 12, score: doNothing12Score, failureProb: doNothing12Risk },
    { months: 24, score: doNothing24Score, failureProb: doNothing24Risk },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-foreground">Simulated Impact</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative p-6 max-w-md mx-auto pb-32">
        {/* For Full Replacement: Show Risk Mitigation + Benefits instead of score animation */}
        {isFullReplacement ? (
          <>
            {/* Risk Eliminated Banner */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 mb-4">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-green-400 font-semibold">All Current Risks Eliminated</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Replacement removes all degradation and failure risk from your current unit.
              </p>
            </div>

            {/* Real-World Risks Being Eliminated */}
            <div className="clean-card mb-4 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-foreground">Risks You're Eliminating</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <div>
                    <span className="text-sm text-foreground font-medium">Emergency Service Fees</span>
                    <p className="text-xs text-muted-foreground">After-hours and weekend calls cost 2-3x normal rates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <div>
                    <span className="text-sm text-foreground font-medium">Water Damage to Home</span>
                    <p className="text-xs text-muted-foreground">Average tank failure causes $5,000-$15,000 in damage</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <div>
                    <span className="text-sm text-foreground font-medium">Damaged Belongings</span>
                    <p className="text-xs text-muted-foreground">Flooded storage, ruined furniture, personal items</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <div>
                    <span className="text-sm text-foreground font-medium">Days Without Hot Water</span>
                    <p className="text-xs text-muted-foreground">Emergency replacements can take 3-5 days to schedule</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Score Comparison - Only for repairs */}
            <div className="text-center mb-8">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Your Health Score</p>
              
              <div className="flex items-center justify-center gap-6">
                {/* Current Score */}
                <div className="text-center">
                  <div className={`w-24 h-24 rounded-2xl border-2 ${getStatusBg(dynamicHealthScore.status)} flex flex-col items-center justify-center`}>
                    <span className={`text-3xl font-bold font-data ${getStatusColor(dynamicHealthScore.status)}`}>
                      {dynamicHealthScore.score}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 uppercase">{dynamicHealthScore.status}</p>
                  <p className="text-[10px] text-muted-foreground">Now</p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center">
                  <div className="text-2xl text-primary animate-pulse">→</div>
                  <span className="text-xs text-green-400 font-medium">+{scoreImprovement}</span>
                </div>

                {/* New Score */}
                <div className="text-center">
                  <div 
                    className={`w-24 h-24 rounded-2xl border-2 ${getStatusBg(result.newStatus)} flex flex-col items-center justify-center`}
                    style={{
                      boxShadow: result.newStatus === 'optimal' 
                        ? '0 0 30px -4px rgba(34, 197, 94, 0.4)' 
                        : result.newStatus === 'warning'
                        ? '0 0 30px -4px rgba(245, 158, 11, 0.4)'
                        : undefined
                    }}
                  >
                    <span className={`text-3xl font-bold font-data ${getStatusColor(result.newStatus)}`}>
                      {Math.round(animatedNewScore)}
                    </span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <p className={`text-xs mt-2 uppercase ${getStatusColor(result.newStatus)}`}>{result.newStatus}</p>
                  <p className="text-[10px] text-muted-foreground">After</p>
                </div>
              </div>
            </div>

            {/* Aging Factor */}
            <div className="clean-card mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Aging Factor</span>
                <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {agingImprovement}% improvement
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-data text-red-400">{currentAgingFactor.toFixed(1)}x</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-data text-green-400">{animatedAgingFactor.toFixed(1)}x</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all duration-1000"
                      style={{ width: `${100 - (result.newAgingFactor / currentAgingFactor) * 100 + 40}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Your water heater would age {agingImprovement}% slower with these repairs
              </p>
            </div>
          </>
        )}


        {/* Do Nothing Projection - Only show for repairs, not replacement */}
        {!isFullReplacement && (
          <div className="clean-card mb-4 border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-foreground">If You Do Nothing</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Without repairs, your water heater will continue to degrade:
            </p>
            <div className="space-y-3">
              {animatedDoNothing.map((projection) => (
                <div key={projection.months} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">In {projection.months} months</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className={`text-sm font-bold font-data ${projection.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {projection.score}
                      </span>
                      <span className="text-xs text-muted-foreground"> score</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-data text-red-400">
                        {projection.failureProb}%
                      </span>
                      <span className="text-xs text-muted-foreground"> risk</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-red-500/20">
              <p className="text-xs text-red-400">
                {projection24.failProb >= 50 
                  ? `At ${agingRate.toFixed(1)}x aging rate, failure becomes statistically likely within 24 months`
                  : projection12.failProb >= 30
                    ? `At ${agingRate.toFixed(1)}x aging rate, significant risk develops within 12-24 months`
                    : `Monitor closely - aging at ${agingRate.toFixed(1)}x normal rate`
                }
              </p>
            </div>
          </div>
        )}

        {/* New System Benefits - Only show for replacement */}
        {isFullReplacement && (
          <div className="clean-card mb-4 border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-foreground">What You'll Gain</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="text-sm text-foreground font-medium">Lower Utility Bills</span>
                  <p className="text-xs text-muted-foreground">Modern units are 10-20% more efficient than older models</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="text-sm text-foreground font-medium">More Hot Water</span>
                  <p className="text-xs text-muted-foreground">Faster recovery rate means hot water when you need it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="text-sm text-foreground font-medium">Full Warranty Protection</span>
                  <p className="text-xs text-muted-foreground">6-12 year manufacturer coverage on parts and tank</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                <div>
                  <span className="text-sm text-foreground font-medium">Peace of Mind</span>
                  <p className="text-xs text-muted-foreground">No surprise failures, no water damage risk</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Items Summary */}
        <div className="clean-card mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {isFullReplacement ? 'Selected Option' : 'Selected Repairs'}
          </p>
          <div className="space-y-2">
            {selectedRepairs.map(repair => (
              <div key={repair.id} className="flex items-center">
                <span className="text-sm text-foreground">• {repair.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Note (only for non-replacement) */}
        {!isFullReplacement && (
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
            onClick={onSchedule}
            className="w-full h-14 text-base font-semibold"
          >
            {isFullReplacement ? 'Request Replacement Quote' : 'Schedule These Repairs'}
          </Button>
        </div>
      </div>
    </div>
  );
}