import { industryBaseline, type BaselineRisk } from '@/lib/opterraAlgorithm';
import { TrendingUp, TrendingDown, Equal } from 'lucide-react';

interface RiskComparisonChartProps {
  calculatedRisk: number;
  biologicalAge: number;
}

function getBaselineForAge(bioAge: number): BaselineRisk {
  return industryBaseline.find(b => bioAge >= b.minAge && bioAge <= b.maxAge) 
    || industryBaseline[industryBaseline.length - 1];
}

export function RiskComparisonChart({ calculatedRisk, biologicalAge }: RiskComparisonChartProps) {
  const baseline = getBaselineForAge(biologicalAge);
  const difference = calculatedRisk - baseline.failureProb;
  const percentDiff = ((difference / baseline.failureProb) * 100).toFixed(0);
  
  const isLower = difference < -0.5;
  const isHigher = difference > 0.5;
  const isSimilar = !isLower && !isHigher;

  const maxRisk = Math.max(calculatedRisk, baseline.failureProb, 25);
  const yourBarWidth = (calculatedRisk / maxRisk) * 100;
  const baselineBarWidth = (baseline.failureProb / maxRisk) * 100;

  return (
    <div className="px-4">
      <div className="glass-card rounded-xl p-4 border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Risk vs Industry Baseline</h3>
          <span className="text-xs text-muted-foreground">{baseline.ageRange}</span>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-3">
          {/* Your Risk */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Your Unit</span>
              <span className="font-mono font-semibold text-foreground">{calculatedRisk.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                style={{ width: `${yourBarWidth}%` }}
              />
            </div>
          </div>

          {/* Industry Baseline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Industry Avg</span>
              <span className="font-mono font-semibold text-muted-foreground">{baseline.failureProb}%</span>
            </div>
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-muted-foreground/40 transition-all duration-700 ease-out"
                style={{ width: `${baselineBarWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Comparison Result */}
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-lg ${
          isLower ? 'bg-green-500/10 border border-green-500/20' :
          isHigher ? 'bg-red-500/10 border border-red-500/20' :
          'bg-muted/20 border border-border/30'
        }`}>
          {isLower && <TrendingDown className="w-4 h-4 text-green-400" />}
          {isHigher && <TrendingUp className="w-4 h-4 text-red-400" />}
          {isSimilar && <Equal className="w-4 h-4 text-muted-foreground" />}
          
          <span className={`text-xs font-medium ${
            isLower ? 'text-green-400' :
            isHigher ? 'text-red-400' :
            'text-muted-foreground'
          }`}>
            {isLower && `${Math.abs(Number(percentDiff))}% below average for ${baseline.ageRange.toLowerCase()}`}
            {isHigher && `${percentDiff}% above average for ${baseline.ageRange.toLowerCase()}`}
            {isSimilar && `On par with industry average for ${baseline.ageRange.toLowerCase()}`}
          </span>
        </div>
      </div>
    </div>
  );
}
