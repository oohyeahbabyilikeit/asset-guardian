import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type HealthScore as HealthScoreType } from '@/data/mockAsset';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
}

export function HealthGauge({ healthScore }: HealthGaugeProps) {
  const { score, status } = healthScore;
  
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

  const getStatusMessage = () => {
    if (status === 'critical') {
      return (
        <>
          Actuarial expiry confirmed. Liability coverage is currently{' '}
          <span className="font-bold text-foreground">unverified</span>.
        </>
      );
    }
    if (status === 'warning') {
      return 'Some issues detected that require your attention.';
    }
    return 'Your system is operating within normal parameters.';
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

  return (
    <div className="clean-card flex flex-col items-center text-center relative overflow-hidden mx-4 mt-4">
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-400 to-green-500" />
      
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 mt-2">
        System Health Score
      </span>

      {/* Score Ring */}
      <div className={cn("relative mb-6 rounded-full", getGlowStyle())}>
        <div className="w-36 h-36 rounded-full border-[8px] border-muted/50 flex items-center justify-center bg-card">
          <div className="text-center">
            <span className="block text-5xl font-black text-foreground tracking-tight">
              {score}
            </span>
            <span className="text-xs text-muted-foreground font-bold">/ 100</span>
          </div>
        </div>
        
        {/* Colored Progress Ring */}
        <svg className="absolute top-0 left-0 w-36 h-36 -rotate-90 drop-shadow-lg">
          <circle 
            cx="72" 
            cy="72" 
            r="64" 
            fill="none" 
            stroke={getRingColor()} 
            strokeWidth="8" 
            strokeDasharray="402" 
            strokeDashoffset={402 - (score / 100) * 402} 
            strokeLinecap="round" 
          />
        </svg>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        {getStatusBadge()}
      </div>
      
      {/* Status Message */}
      <p className="text-sm text-muted-foreground leading-relaxed px-4 pb-2">
        {getStatusMessage()}
      </p>
    </div>
  );
}
