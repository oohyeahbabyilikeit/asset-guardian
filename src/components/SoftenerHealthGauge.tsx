import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Wrench, Droplets, Gauge, Zap } from 'lucide-react';

interface SoftenerHealthGaugeProps {
  resinHealth: number;
  odometer: number;
  action: string;
  badge: string;
  reason: string;
}

const badgeConfig: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  HEALTHY: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Healthy',
  },
  SEAL_WEAR: {
    icon: Wrench,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Seal Wear',
  },
  RESIN_FAILURE: {
    icon: Droplets,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Resin Failure',
  },
  MECHANICAL_FAILURE: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Mechanical Failure',
  },
  HIGH_WASTE: {
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'High Waste',
  },
  RESIN_DEGRADED: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Resin Degraded',
  },
};

export function SoftenerHealthGauge({
  resinHealth,
  odometer,
  action,
  badge,
  reason,
}: SoftenerHealthGaugeProps) {
  const config = badgeConfig[badge] || badgeConfig.HEALTHY;
  const Icon = config.icon;

  // Calculate overall score (weighted average)
  const odometerScore = Math.max(0, 100 - (odometer / 15)); // 0 at 1500 cycles
  const overallScore = Math.round((resinHealth * 0.6) + (odometerScore * 0.4));

  // Determine ring color based on score
  const getRingColor = () => {
    if (overallScore >= 70) return '#22c55e';
    if (overallScore >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <Card className={`p-6 ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-center gap-6">
        {/* Circular Gauge */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
              opacity="0.3"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={getRingColor()}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-700"
            />
            {/* Center score */}
            <text
              x="60"
              y="55"
              textAnchor="middle"
              fill="currentColor"
              className="text-3xl font-bold"
            >
              {overallScore}
            </text>
            <text
              x="60"
              y="75"
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              className="text-xs"
            >
              SCORE
            </text>
          </svg>
        </div>

        {/* Status Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <Badge variant="outline" className={`${config.color} border-current`}>
              {config.label}
            </Badge>
          </div>
          
          <p className="text-sm text-foreground font-medium mb-1">
            {reason}
          </p>
          
          <div className="flex gap-4 mt-3">
            <div className="text-xs">
              <span className="text-muted-foreground">Resin: </span>
              <span className={resinHealth >= 50 ? 'text-green-400' : 'text-red-400'}>
                {resinHealth}%
              </span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Cycles: </span>
              <span className={odometer < 600 ? 'text-green-400' : odometer < 1500 ? 'text-yellow-400' : 'text-red-400'}>
                {odometer.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
