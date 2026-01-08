import { AlertCircle, MapPin, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type HealthScore as HealthScoreType } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel } from '@/lib/opterraAlgorithm';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
  location: string;
  riskLevel: RiskLevel;
  primaryStressor?: string;
  estDamageCost?: number;
}

export function HealthGauge({ healthScore, location, riskLevel, primaryStressor, estDamageCost }: HealthGaugeProps) {
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

  // Convert failureProbability to medical terminology
  const getRiskStatus = () => {
    if (failureProbability === 'FAIL') return 'CRITICAL';
    const prob = typeof failureProbability === 'number' ? failureProbability : 0;
    if (prob >= 60) return 'HIGH';
    if (prob >= 30) return 'ELEVATED';
    return 'NORMAL';
  };

  const riskStatus = getRiskStatus();

  const getStatusColor = () => {
    if (riskStatus === 'CRITICAL' || riskStatus === 'HIGH') return 'text-red-400';
    if (riskStatus === 'ELEVATED') return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className={cn(
      "command-card p-5",
      status === 'critical' && "border-red-500/30",
      status === 'warning' && "border-amber-500/30"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
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

      {/* Hero Score Ring - Centered */}
      <div className="flex flex-col items-center mb-5">
        <div className={cn("relative rounded-full", getGlowClass())}>
          <div className="w-28 h-28 rounded-full border-[6px] border-secondary/40 flex items-center justify-center bg-card/80">
            <div className="text-center">
              <span className="block text-4xl font-bold text-foreground font-data">
                {score}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">/ 100</span>
            </div>
          </div>
          
          {/* Colored Progress Ring */}
          <svg 
            className="absolute top-0 left-0 w-28 h-28 -rotate-90"
            style={{ filter: `drop-shadow(0 0 10px ${getRingColor()})` }}
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

        {/* Status Badge - Single Line */}
        <div className={cn("mt-3 text-sm font-bold uppercase tracking-wider", getStatusColor())}>
          {riskStatus}
        </div>
      </div>

      {/* Primary Alert - Full Width Banner */}
      {score < 50 && primaryStressor && (
        <div className="mb-4 py-2.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs font-semibold text-red-400">
              {primaryStressor}
            </span>
          </div>
        </div>
      )}

      {/* Location Context - Simplified */}
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-secondary/30">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          riskLevel >= 3 
            ? "bg-red-500/15 border border-red-500/20" 
            : "bg-amber-500/15 border border-amber-500/20"
        )}>
          <MapPin className={cn(
            "w-4 h-4",
            riskLevel >= 3 ? "text-red-400" : "text-amber-400"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              {location}
            </span>
            <span className={cn(
              "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
              riskLevel >= 3 
                ? "bg-red-500/20 text-red-400" 
                : "bg-amber-500/20 text-amber-400"
            )}>
              {riskInfo.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {riskLevel >= 3 && estDamageCost 
              ? `Leak risk: ~$${estDamageCost.toLocaleString()} damage potential`
              : riskInfo.description}
          </p>
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-[9px] text-muted-foreground/50 text-center mt-4">
        Statistics based on industry data for similar units.
      </p>
    </div>
  );
}
