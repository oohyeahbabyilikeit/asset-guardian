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

  return (
    <div className="clean-card flex flex-col items-center text-center relative overflow-hidden mx-4 mt-4">
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-green-500 opacity-80" />
      
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6">
        System Health Score
      </span>

      {/* Score Ring */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full border-[8px] border-muted flex items-center justify-center">
          <div className="text-center">
            <span className="block text-5xl font-black text-foreground tracking-tight">
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
      <div className="mb-3">
        {getStatusBadge()}
      </div>
      
      {/* Status Message */}
      <p className="text-sm text-muted-foreground leading-relaxed px-4">
        {getStatusMessage()}
      </p>
    </div>
  );
}
