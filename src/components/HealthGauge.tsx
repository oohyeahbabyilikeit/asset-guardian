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
      "command-card p-5",
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
        <div className="flex items-center justify-center gap-6 w-full mb-4">
          {/* Score Ring */}
          <div className={cn("relative rounded-full", getGlowClass())}>
            <div className="w-28 h-28 rounded-full border-[6px] border-secondary/60 flex items-center justify-center bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <span className="block text-3xl font-black text-foreground tracking-tight font-data">
                  {score}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            
            {/* Colored Progress Ring */}
            <svg 
              className="absolute top-0 left-0 w-28 h-28 -rotate-90"
              style={{
                filter: `drop-shadow(0 0 12px ${getRingColor()})`,
              }}
            >
              <circle 
                cx="56" 
                cy="56" 
                r="50" 
                fill="none" 
                stroke={getRingColor()} 
                strokeWidth="6" 
                strokeDasharray={314} 
                strokeDashoffset={314 - (score / 100) * 314} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-3">
            {/* Failure Probability */}
            <div className="data-box data-box-critical py-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Failure Rate
                </span>
              </div>
              <div className="text-xl font-black text-red-400 font-data">
                {failureProbability === 'FAIL' 
                  ? 'FAIL' 
                  : `${typeof failureProbability === 'number' ? failureProbability.toFixed(1) : failureProbability}%`}
              </div>
            </div>

            {/* Location Risk Level */}
            <div className={cn(
              "data-box py-3 px-4",
              riskLevel >= 3 ? "data-box-critical" : "data-box-warning"
            )}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={cn("w-3.5 h-3.5", riskLevel >= 3 ? "text-red-400" : "text-amber-400")} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Location Risk
                </span>
              </div>
              <div className={cn(
                "text-xl font-black font-data",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {riskInfo.label}
              </div>
            </div>
          </div>
        </div>

        {/* Location Context */}
        <div className="w-full data-display-lg">
          <div className="flex items-start gap-3 text-left">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              riskLevel >= 3 
                ? "bg-red-500/10 border border-red-500/20" 
                : "bg-amber-500/10 border border-amber-500/20"
            )}>
              <MapPin className={cn(
                "w-4 h-4",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider font-data",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {location} Installation
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
