import { AlertCircle, CheckCircle2, TrendingUp, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type HealthScore as HealthScoreType } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel } from '@/lib/opterraAlgorithm';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
  location: string;
  riskLevel: RiskLevel;
}

export function HealthGauge({ healthScore, location, riskLevel }: HealthGaugeProps) {
  const { score, status, failureProbability } = healthScore;
  const riskInfo = getRiskLevelInfo(riskLevel);

  const getRingColor = () => {
    if (status === 'critical') return '#EF4444';
    if (status === 'warning') return '#F59E0B';
    return '#22C55E';
  };

  const getGlowClass = () => {
    if (status === 'critical') return 'animate-critical-pulse';
    return '';
  };

  return (
    <div className="clean-card relative overflow-hidden tech-corners">
      {/* Tech grid overlay */}
      <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
      
      {/* Scan line effect for critical */}
      {status === 'critical' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-scan-line" />
        </div>
      )}
      
      {/* Radial glow background */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        status === 'critical' && "bg-gradient-radial from-red-950/30 to-transparent",
        status === 'warning' && "bg-gradient-radial from-amber-950/30 to-transparent",
        status === 'optimal' && "bg-gradient-radial from-green-950/30 to-transparent"
      )} />

      <div className="relative flex flex-col items-center text-center">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3 self-start">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            System Diagnostics
          </span>
        </div>

        {/* Score Ring + Stats Row */}
        <div className="flex items-center justify-center gap-6 w-full mb-4">
          {/* Score Ring */}
          <div className={cn("relative rounded-full", getGlowClass())}>
            <div className="w-24 h-24 rounded-full border-[5px] border-secondary flex items-center justify-center bg-card">
              <div className="text-center">
                <span className="block text-2xl font-black text-foreground tracking-tight font-data">
                  {score}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            
            {/* Colored Progress Ring */}
            <svg 
              className="absolute top-0 left-0 w-24 h-24 -rotate-90"
              style={{
                filter: `drop-shadow(0 0 8px ${getRingColor()})`,
              }}
            >
              <circle 
                cx="48" 
                cy="48" 
                r="42" 
                fill="none" 
                stroke={getRingColor()} 
                strokeWidth="5" 
                strokeDasharray={264} 
                strokeDashoffset={264 - (score / 100) * 264} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-2">
            {/* Failure Probability */}
            <div className="data-box data-box-critical py-2 px-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="w-3 h-3 text-red-400" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Failure Rate
                </span>
              </div>
              <div className="text-lg font-black text-red-400 font-data">
                {failureProbability === 'FAIL' 
                  ? 'FAIL' 
                  : `${typeof failureProbability === 'number' ? failureProbability.toFixed(1) : failureProbability}%`}
              </div>
            </div>

            {/* Location Risk Level */}
            <div className={cn(
              "data-box py-2 px-3",
              riskLevel >= 3 ? "data-box-critical" : "data-box-warning"
            )}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <AlertTriangle className={cn("w-3 h-3", riskLevel >= 3 ? "text-red-400" : "text-amber-400")} />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Location Risk
                </span>
              </div>
              <div className={cn(
                "text-lg font-black font-data",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {riskInfo.label}
              </div>
            </div>
          </div>
        </div>

        {/* Location Context */}
        <div className="w-full p-2.5 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-start gap-2 text-left">
            <MapPin className={cn(
              "w-3.5 h-3.5 mt-0.5 shrink-0",
              riskLevel >= 3 ? "text-red-400" : "text-amber-400"
            )} />
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider font-data",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {location} Installation
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                {riskInfo.description}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-[8px] text-muted-foreground/60 text-center mt-2">
        Statistics based on industry data for similar units.
      </p>
    </div>
  );
}
