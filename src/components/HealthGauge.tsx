import { cn } from '@/lib/utils';
import { getStatusClass, getGlowClass, type HealthScore as HealthScoreType } from '@/data/mockAsset';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
}

export function HealthGauge({ healthScore }: HealthGaugeProps) {
  const { score, status } = healthScore;
  
  // Calculate rotation for gauge needle (-135 to 135 degrees)
  const rotation = -135 + (score / 100) * 270;
  
  // Get status label
  const getStatusLabel = () => {
    if (score <= 25) return 'CRITICAL FAILURE RISK';
    if (score <= 50) return 'ELEVATED RISK';
    if (score <= 75) return 'FAIR CONDITION';
    return 'OPTIMAL HEALTH';
  };

  const getStatusMessage = () => {
    if (score <= 25) return 'Actuarial Expiry Detected. Liability High.';
    if (score <= 50) return 'Multiple issues require attention.';
    if (score <= 75) return 'Minor maintenance recommended.';
    return 'System operating within parameters.';
  };

  return (
    <div className="flex flex-col items-center py-6">
      {/* Gauge Container */}
      <div className={cn("relative w-48 h-48", getGlowClass(status))}>
        {/* Background Ring */}
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Outer glow ring */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border/30"
          />
          
          {/* Gauge track */}
          <path
            d="M 30 140 A 80 80 0 1 1 170 140"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted"
          />
          
          {/* Gauge progress - colored by status */}
          <path
            d="M 30 140 A 80 80 0 1 1 170 140"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 251.2} 251.2`}
            className={cn(
              status === 'critical' && 'text-status-critical',
              status === 'warning' && 'text-status-warning',
              status === 'optimal' && 'text-status-optimal'
            )}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = -135 + (tick / 100) * 270;
            const radian = (angle * Math.PI) / 180;
            const innerR = 70;
            const outerR = 78;
            const x1 = 100 + innerR * Math.cos(radian);
            const y1 = 100 + innerR * Math.sin(radian);
            const x2 = 100 + outerR * Math.cos(radian);
            const y2 = 100 + outerR * Math.sin(radian);
            
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/50"
              />
            );
          })}
        </svg>

        {/* Center Score Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "font-mono text-5xl font-bold",
            getStatusClass(status)
          )}>
            {score}
          </span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>

        {/* Needle */}
        <div 
          className="absolute top-1/2 left-1/2 w-1 h-16 origin-bottom"
          style={{ 
            transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
            transition: 'transform 1s ease-out'
          }}
        >
          <div className={cn(
            "w-full h-full rounded-full",
            status === 'critical' && 'bg-status-critical',
            status === 'warning' && 'bg-status-warning',
            status === 'optimal' && 'bg-status-optimal'
          )} />
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card border-2 border-muted" />
      </div>

      {/* Status Label */}
      <h2 className={cn(
        "mt-4 text-lg font-semibold tracking-wide",
        getStatusClass(status)
      )}>
        {getStatusLabel()}
      </h2>

      {/* Status Message */}
      <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs italic">
        "{getStatusMessage()}"
      </p>
    </div>
  );
}
