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
    <div className={cn(
      "command-card p-4",
      status === 'critical' && "border-red-500/30",
      status === 'warning' && "border-amber-500/30"
    )}>

      <div className="flex flex-col items-center text-center">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4 self-start">
          <div className={cn(
            "command-icon-sm",
            status === 'critical' && "command-icon-critical",
            status === 'warning' && "command-icon-warning",
            status === 'optimal' && "command-icon-success"
          )}>
            <Activity className={cn(
              "w-4 h-4",
              status === 'critical' && "text-red-400",
              status === 'warning' && "text-amber-400",
              status === 'optimal' && "text-emerald-400"
            )} />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            System Diagnostics
          </span>
        </div>

        {/* Score Ring + Stats Row */}
        <div className="flex items-center justify-center gap-4 w-full mb-3">
          {/* Score Ring */}
          <div className={cn("relative rounded-full", getGlowClass())}>
            <div className="w-20 h-20 rounded-full border-[5px] border-secondary/60 flex items-center justify-center bg-card/80">
              <div className="text-center">
                <span className="block text-2xl font-bold text-foreground font-data">
                  {score}
                </span>
                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">/ 100</span>
              </div>
            </div>
            
            {/* Colored Progress Ring */}
            <svg 
              className="absolute top-0 left-0 w-20 h-20 -rotate-90"
              style={{
                filter: `drop-shadow(0 0 8px ${getRingColor()})`,
              }}
            >
              <circle 
                cx="40" 
                cy="40" 
                r="35" 
                fill="none" 
                stroke={getRingColor()} 
                strokeWidth="5" 
                strokeDasharray={220} 
                strokeDashoffset={220 - (score / 100) * 220} 
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
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Failure Rate
                </span>
              </div>
              <div className="text-base font-bold text-red-400 font-data">
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
                <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  Location Risk
                </span>
              </div>
              <div className={cn(
                "text-base font-bold font-data",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {riskInfo.label}
              </div>
            </div>
          </div>
        </div>

        {/* Location Context */}
        <div className="w-full data-display-lg py-2 px-3">
          <div className="flex items-start gap-2 text-left">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
              riskLevel >= 3 
                ? "bg-red-500/10 border border-red-500/20" 
                : "bg-amber-500/10 border border-amber-500/20"
            )}>
              <MapPin className={cn(
                "w-3 h-3",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wide font-data",
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
      <p className="text-[9px] text-muted-foreground/50 text-center mt-3">
        Statistics based on industry data for similar units.
      </p>
    </div>
  );
}
