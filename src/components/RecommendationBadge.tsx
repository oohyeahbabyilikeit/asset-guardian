import { AlertTriangle, Shield, Clock, Wrench, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Recommendation, type RecommendationBadge as BadgeType } from '@/lib/opterraAlgorithm';

interface RecommendationBadgeProps {
  recommendation: Recommendation;
  className?: string;
}

const badgeIcons: Record<BadgeType, React.ReactNode> = {
  LIABILITY_RISK: <AlertTriangle className="w-4 h-4" />,
  FINANCIAL_RISK: <AlertTriangle className="w-4 h-4" />,
  ACTUARIAL_EXPIRY: <Clock className="w-4 h-4" />,
  UNSERVICEABLE: <Wrench className="w-4 h-4" />,
  MONITOR: <CheckCircle2 className="w-4 h-4" />,
};

const badgeStyles: Record<BadgeType, string> = {
  LIABILITY_RISK: 'bg-red-500/20 border-red-500/50 text-red-400',
  FINANCIAL_RISK: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  ACTUARIAL_EXPIRY: 'bg-red-500/20 border-red-500/50 text-red-400',
  UNSERVICEABLE: 'bg-red-500/20 border-red-500/50 text-red-400',
  MONITOR: 'bg-green-500/20 border-green-500/50 text-green-400',
};

export function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Badge */}
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-sm uppercase tracking-wider",
        badgeStyles[recommendation.badge]
      )}>
        {badgeIcons[recommendation.badge]}
        <span>{recommendation.badgeLabel.replace(/^[🔴🟠🟢🛑]\s*/, '')}</span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "px-3 py-1 rounded text-xs font-black uppercase tracking-widest",
          recommendation.action === 'REPLACE' && "bg-red-500 text-white",
          recommendation.action === 'MONITOR' && "bg-green-500 text-white",
          recommendation.action === 'REPAIR' && "bg-amber-500 text-black"
        )}>
          {recommendation.action}
        </div>
        
        {!recommendation.canRepair && recommendation.action === 'REPLACE' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Repairs Locked</span>
          </div>
        )}
      </div>

      {/* Script */}
      <p className="text-sm text-muted-foreground leading-relaxed italic">
        "{recommendation.script}"
      </p>

      {/* Rule trigger */}
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-data">
        Triggered by: {recommendation.triggerRule}
      </div>
    </div>
  );
}
