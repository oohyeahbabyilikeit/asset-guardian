import { AlertCircle, CheckCircle2, TrendingUp, MapPin, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  type HealthScore as HealthScoreType, 
  getBurstCostByLocation, 
  formatCurrency 
} from '@/data/mockAsset';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
  location: string;
}

export function HealthGauge({ healthScore, location }: HealthGaugeProps) {
  const { score, status, failureProbability } = healthScore;
  const burstCost = getBurstCostByLocation(location);
  
  // Calculate stroke dash offset for the ring
  const circumference = 351;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusBadge = () => {
    if (status === 'critical') {
      return (
        <div className="status-badge-critical px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          CRITICAL RISK DETECTED
        </div>
      );
    }
    if (status === 'warning') {
      return (
        <div className="status-badge-warning px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          ATTENTION REQUIRED
        </div>
      );
    }
    return (
      <div className="status-badge-optimal px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        SYSTEM HEALTHY
      </div>
    );
  };

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
    <div className="clean-card relative overflow-hidden mx-4 mt-4 tech-corners">
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
        <div className="flex items-center gap-2 mb-6 self-start">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-data">
            System Diagnostics
          </span>
        </div>

        {/* Score Ring */}
        <div className={cn("relative mb-4 rounded-full", getGlowClass())}>
          <div className="w-36 h-36 rounded-full border-[8px] border-secondary flex items-center justify-center bg-card">
            <div className="text-center">
              <span className="block text-4xl font-black text-foreground tracking-tight font-data">
                {score}
              </span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">/ 100</span>
            </div>
          </div>
          
          {/* Colored Progress Ring */}
          <svg 
            className="absolute top-0 left-0 w-36 h-36 -rotate-90"
            style={{
              filter: `drop-shadow(0 0 12px ${getRingColor()})`,
            }}
          >
            <circle 
              cx="72" 
              cy="72" 
              r="56" 
              fill="none" 
              stroke={getRingColor()} 
              strokeWidth="8" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          {getStatusBadge()}
        </div>

        {/* Risk Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* Failure Probability */}
          <div className="data-box data-box-critical">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Failure Risk
              </span>
            </div>
            <div className="text-2xl font-black text-red-400 font-data">
              {failureProbability}%
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Annual probability
            </div>
          </div>

          {/* Worst Case Cost */}
          <div className="data-box data-box-warning">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Burst Cost
              </span>
            </div>
            <div className="text-xl font-black text-amber-400 font-data">
              {formatCurrency(burstCost.scenarioB.max)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Worst case estimate
            </div>
          </div>
        </div>

        {/* Location & Context */}
        <div className="w-full mt-4 p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-start gap-2 text-left">
            <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 font-data">
                {burstCost.label}
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {burstCost.whyCostJumps}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
