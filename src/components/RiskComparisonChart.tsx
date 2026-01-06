import { industryBaseline, type BaselineRisk } from '@/lib/opterraAlgorithm';
import { TrendingUp, TrendingDown, Equal, BarChart3 } from 'lucide-react';

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
    <div className="mx-4">
      <div className="clean-card relative overflow-hidden tech-corners">
        {/* Tech grid overlay */}
        <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-data">
                Risk vs Industry Baseline
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-data">{baseline.ageRange}</span>
          </div>

          {/* Comparison Bars */}
          <div className="space-y-4">
            {/* Your Risk */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Your Unit</span>
                <span className="font-data font-bold text-primary">{calculatedRisk.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                  style={{ 
                    width: `${yourBarWidth}%`,
                    boxShadow: '0 0 12px hsl(var(--primary) / 0.4)'
                  }}
                />
              </div>
            </div>

            {/* Industry Baseline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Industry Avg</span>
                <span className="font-data font-bold text-muted-foreground">{baseline.failureProb}%</span>
              </div>
              <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full rounded-full bg-muted-foreground/40 transition-all duration-700 ease-out"
                  style={{ width: `${baselineBarWidth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comparison Result */}
          <div className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-lg ${
            isLower ? 'bg-green-950/40 border border-green-800/50' :
            isHigher ? 'bg-red-950/40 border border-red-800/50' :
            'bg-secondary/50 border border-border'
          }`}
          style={{
            boxShadow: isLower 
              ? '0 0 16px -4px rgba(34, 197, 94, 0.3)' 
              : isHigher 
                ? '0 0 16px -4px rgba(239, 68, 68, 0.3)' 
                : 'none'
          }}
          >
            {isLower && <TrendingDown className="w-4 h-4 text-green-400" />}
            {isHigher && <TrendingUp className="w-4 h-4 text-red-400" />}
            {isSimilar && <Equal className="w-4 h-4 text-muted-foreground" />}
            
            <span className={`text-xs font-semibold ${
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
    </div>
  );
}
