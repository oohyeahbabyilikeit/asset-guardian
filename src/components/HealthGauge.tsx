import { AlertCircle, CheckCircle2, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';
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
  
  // Calculate stroke dash offset for the ring (circumference = 2 * PI * r = 2 * 3.14159 * 56 ≈ 351)
  const circumference = 351;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusBadge = () => {
    if (status === 'critical') {
      return (
        <div className="status-badge-critical px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          CRITICAL RISK DETECTED
        </div>
      );
    }
    if (status === 'warning') {
      return (
        <div className="status-badge-warning px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          ATTENTION REQUIRED
        </div>
      );
    }
    return (
      <div className="status-badge-optimal px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2">
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

  const getGlowStyle = () => {
    if (status === 'critical') return 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)]';
    if (status === 'warning') return 'shadow-[0_0_30px_-5px_rgba(245,158,11,0.4)]';
    return 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]';
  };

  const getRiskBoxStyle = () => {
    if (status === 'critical') return 'bg-red-50 border-l-4 border-red-500';
    if (status === 'warning') return 'bg-amber-50 border-l-4 border-amber-500';
    return 'bg-green-50 border-l-4 border-green-500';
  };

  return (
    <div className="clean-card flex flex-col items-center text-center relative overflow-hidden mx-4 mt-4">
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-400 to-green-500" />
      
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 mt-2">
        System Health Score
      </span>

      {/* Score Ring */}
      <div className={cn("relative mb-4 rounded-full", getGlowStyle())}>
        <div className="w-32 h-32 rounded-full border-[8px] border-muted/50 flex items-center justify-center bg-card">
          <div className="text-center">
            <span className="block text-4xl font-black text-foreground tracking-tight">
              {score}
            </span>
            <span className="text-xs text-muted-foreground font-bold">/ 100</span>
          </div>
        </div>
        
        {/* Colored Progress Ring */}
        <svg className="absolute top-0 left-0 w-32 h-32 -rotate-90 drop-shadow-lg">
          <circle 
            cx="64" 
            cy="64" 
            r="56" 
            fill="none" 
            stroke={getRingColor()} 
            strokeWidth="8" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
          />
        </svg>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        {getStatusBadge()}
      </div>

      {/* Risk Stats Grid */}
      <div className="w-full px-4 pb-4 space-y-3">
        {/* Failure Probability */}
        <div className={cn("p-3 rounded-lg text-left", getRiskBoxStyle())}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-muted-foreground uppercase">Annual Failure Risk</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{failureProbability}%</span>
            <span className="text-xs text-muted-foreground">probability this year</span>
          </div>
        </div>

        {/* Burst Cost Estimate */}
        <div className={cn("p-3 rounded-lg text-left", getRiskBoxStyle())}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-red-600 uppercase">{location} Installation</span>
          </div>
          
          <div className="text-xs font-semibold text-muted-foreground mb-2">If Tank Bursts:</div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Best Case</div>
              <div className="text-lg font-bold text-amber-600">
                {formatCurrency(burstCost.scenarioA.min)} - {formatCurrency(burstCost.scenarioA.max)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Worst Case</div>
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(burstCost.scenarioB.min)} - {formatCurrency(burstCost.scenarioB.max)}+
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 pt-2 border-t border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              {burstCost.whyCostJumps}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
