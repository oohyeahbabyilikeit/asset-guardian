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
    if (status === 'critical') return 'hsl(0 55% 48%)';
    if (status === 'warning') return 'hsl(32 65% 48%)';
    return 'hsl(158 45% 42%)';
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
      "command-card p-3",
      status === 'critical' && "border-red-500/30",
      status === 'warning' && "border-amber-500/30"
    )}>
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center",
            status === 'critical' && "bg-red-500/15",
            status === 'warning' && "bg-amber-500/15",
            status === 'optimal' && "bg-emerald-500/15"
          )}>
            <Activity className={cn(
              "w-3 h-3",
              status === 'critical' && "text-red-400",
              status === 'warning' && "text-amber-400",
              status === 'optimal' && "text-emerald-400"
            )} />
          </div>
          <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
            System Health
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-lg font-bold font-data", getStatusColor())}>
            {score}
          </span>
          <span className="text-[8px] text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Health Bar */}
      <div className="relative h-3 rounded-full bg-secondary/50 overflow-hidden mb-2">
        <div 
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
            status === 'critical' && "bg-gradient-to-r from-red-600 to-red-400",
            status === 'warning' && "bg-gradient-to-r from-amber-600 to-amber-400",
            status === 'optimal' && "bg-gradient-to-r from-emerald-600 to-emerald-400"
          )}
          style={{ 
            width: `${score}%`,
            boxShadow: `0 0 12px ${getRingColor()}40`
          }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex justify-between px-[1px]">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-px h-full bg-background/20" />
          ))}
        </div>
      </div>

      {/* Status Label */}
      <div className={cn("text-[10px] font-bold uppercase tracking-wider text-center mb-2", getStatusColor())}>
        {riskStatus}
      </div>

      {/* Primary Alert */}
      {score < 50 && primaryStressor && (
        <div className="mb-2 py-1.5 px-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
            <span className="text-[10px] font-semibold text-red-400">
              {primaryStressor}
            </span>
          </div>
        </div>
      )}

      {/* Location Context */}
      <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-secondary/30">
        <div className={cn(
          "w-6 h-6 rounded flex items-center justify-center shrink-0",
          riskLevel >= 3 
            ? "bg-red-500/15 border border-red-500/20" 
            : "bg-amber-500/15 border border-amber-500/20"
        )}>
          <MapPin className={cn(
            "w-3 h-3",
            riskLevel >= 3 ? "text-red-400" : "text-amber-400"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-foreground">
              {location}
            </span>
            <span className={cn(
              "text-[8px] font-bold uppercase px-1 py-0.5 rounded",
              riskLevel >= 3 
                ? "bg-red-500/20 text-red-400" 
                : "bg-amber-500/20 text-amber-400"
            )}>
              {riskInfo.label}
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground">
            {riskLevel >= 3 && estDamageCost 
              ? `Leak risk: ~$${estDamageCost.toLocaleString()} damage`
              : riskInfo.description}
          </p>
        </div>
      </div>
    </div>
  );
}
