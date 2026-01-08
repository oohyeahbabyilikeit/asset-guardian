import { Clock, Zap } from 'lucide-react';

interface RiskComparisonChartProps {
  biologicalAge: number;
  calendarAge: number;
}

export function RiskComparisonChart({ biologicalAge, calendarAge }: RiskComparisonChartProps) {
  const displayBioAge = Math.round(biologicalAge * 10) / 10;
  const agingFactor = (biologicalAge / calendarAge).toFixed(1);
  const yearsDifference = Math.round((biologicalAge - calendarAge) * 10) / 10;
  
  const maxAge = Math.max(biologicalAge, calendarAge) * 1.1;
  const bioBarWidth = (biologicalAge / maxAge) * 100;
  const calendarBarWidth = (calendarAge / maxAge) * 100;

  const isAccelerated = biologicalAge > calendarAge + 0.5;

  return (
    <div className="mx-4">
      <div className="clean-card relative overflow-hidden tech-corners">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/50 via-cyan-500/50 to-amber-500/50" />
        {/* Tech grid overlay */}
        <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-data">
                Age Comparison
              </span>
            </div>
            <span className="text-xs text-amber-400 font-data font-bold">{agingFactor}x Aging Rate</span>
          </div>

          {/* Comparison Bars */}
          <div className="space-y-4">
            {/* Biological Age */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Biological Age</span>
                <span className="font-data font-bold text-amber-400">{displayBioAge} yrs</span>
              </div>
              <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-500/70 transition-all duration-700 ease-out"
                  style={{ 
                    width: `${bioBarWidth}%`,
                    boxShadow: '0 0 12px hsl(38 92% 50% / 0.4)'
                  }}
                />
              </div>
            </div>

            {/* Calendar Age */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Calendar Age</span>
                <span className="font-data font-bold text-muted-foreground">{calendarAge} yrs</span>
              </div>
              <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full rounded-full bg-muted-foreground/40 transition-all duration-700 ease-out"
                  style={{ width: `${calendarBarWidth}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comparison Result */}
          {isAccelerated && (
            <div 
              className="mt-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-950/40 border border-amber-800/50"
              style={{ boxShadow: '0 0 16px -4px rgba(245, 158, 11, 0.3)' }}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">
                Aging {yearsDifference} years faster than expected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
