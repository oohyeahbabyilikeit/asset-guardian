import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairOption, simulateRepairs, SimulatedResult } from '@/data/repairOptions';
import { demoHealthScore, demoAsset, formatCurrency } from '@/data/mockAsset';

interface ScoreSimulatorProps {
  selectedRepairs: RepairOption[];
  onBack: () => void;
  onSchedule: () => void;
}

function useAnimatedNumber(target: number, duration: number = 1500) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      
      setCurrent(Math.round(value * 10) / 10);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return current;
}

export function ScoreSimulator({ selectedRepairs, onBack, onSchedule }: ScoreSimulatorProps) {
  const currentAgingFactor = demoAsset.biologicalAge / demoAsset.paperAge;
  
  const result: SimulatedResult = simulateRepairs(
    demoHealthScore.score,
    currentAgingFactor,
    demoHealthScore.failureProbability,
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

  const scoreImprovement = result.newScore - demoHealthScore.score;
  const agingImprovement = Math.round((1 - result.newAgingFactor / currentAgingFactor) * 100);
  const failureImprovement = Math.round((1 - result.newFailureProb / demoHealthScore.failureProbability) * 100);

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
        {/* Score Comparison */}
        <div className="text-center mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Your Health Score</p>
          
          <div className="flex items-center justify-center gap-6">
            {/* Current Score */}
            <div className="text-center">
              <div className={`w-24 h-24 rounded-2xl border-2 ${getStatusBg(demoHealthScore.status)} flex flex-col items-center justify-center`}>
                <span className={`text-3xl font-bold font-data ${getStatusColor(demoHealthScore.status)}`}>
                  {demoHealthScore.score}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 uppercase">{demoHealthScore.status}</p>
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

        {/* Failure Probability */}
        <div className="clean-card mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Failure Probability</span>
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              {failureImprovement}% reduction
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-data text-red-400">{demoHealthScore.failureProbability}%</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-data text-green-400">{animatedFailureProb.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-1000"
                  style={{ width: `${100 - result.newFailureProb}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selected Repairs Summary */}
        <div className="clean-card mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Selected Repairs</p>
          <div className="space-y-2">
            {selectedRepairs.map(repair => (
              <div key={repair.id} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{repair.name}</span>
                <span className="text-sm text-muted-foreground font-data">
                  {formatCurrency(repair.costMin)} - {formatCurrency(repair.costMax)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total Estimate</span>
              <span className="font-bold text-primary font-data">
                {formatCurrency(result.totalCostMin)} - {formatCurrency(result.totalCostMax)}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Note (only for non-replacement) */}
        {!isFullReplacement && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              These repairs extend life but don't reset the {demoAsset.paperAge}-year paper age. For maximum protection, consider full replacement.
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
            Schedule These Repairs
          </Button>
        </div>
      </div>
    </div>
  );
}
