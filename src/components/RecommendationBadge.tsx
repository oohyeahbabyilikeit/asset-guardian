import { AlertTriangle, Shield, Clock, Wrench, CheckCircle2, AlertOctagon, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Recommendation, type RecommendationBadge as BadgeType, type RecommendationAction } from '@/lib/opterraAlgorithm';

interface RecommendationBadgeProps {
  recommendation: Recommendation;
  className?: string;
}

// v4.0 badge icons mapped to new badge types
const badgeIcons: Record<BadgeType, React.ReactNode> = {
  CONTAINMENT_BREACH: <AlertOctagon className="w-4 h-4" />,
  SAFETY_HAZARD: <AlertOctagon className="w-4 h-4" />,
  STRUCTURAL_FATIGUE: <AlertTriangle className="w-4 h-4" />,
  SEDIMENT_LOCKOUT: <Droplets className="w-4 h-4" />,
  ACTUARIAL_EXPIRY: <Clock className="w-4 h-4" />,
  LIABILITY_RISK: <AlertTriangle className="w-4 h-4" />,
  STATISTICAL_FAILURE: <AlertTriangle className="w-4 h-4" />,
  WARRANTY_VOID: <Wrench className="w-4 h-4" />,
  CODE_VIOLATION: <Wrench className="w-4 h-4" />,
  PASS: <CheckCircle2 className="w-4 h-4" />,
};

// v4.0 badge styles mapped to new badge types
const badgeStyles: Record<BadgeType, string> = {
  CONTAINMENT_BREACH: 'bg-red-500/20 border-red-500/50 text-red-400',
  SAFETY_HAZARD: 'bg-red-500/20 border-red-500/50 text-red-400',
  STRUCTURAL_FATIGUE: 'bg-red-500/20 border-red-500/50 text-red-400',
  SEDIMENT_LOCKOUT: 'bg-red-500/20 border-red-500/50 text-red-400',
  ACTUARIAL_EXPIRY: 'bg-red-500/20 border-red-500/50 text-red-400',
  LIABILITY_RISK: 'bg-red-500/20 border-red-500/50 text-red-400',
  STATISTICAL_FAILURE: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  WARRANTY_VOID: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  CODE_VIOLATION: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  PASS: 'bg-green-500/20 border-green-500/50 text-green-400',
};

// Helper to check if action requires replacement
const isReplaceAction = (action: RecommendationAction): boolean => {
  return action.startsWith('REPLACE_');
};

// Get action style based on v4.0 action types
const getActionStyle = (action: RecommendationAction): string => {
  if (action === 'MONITOR') return 'bg-green-500 text-white';
  if (action === 'INSTALL_PRV' || action === 'INSTALL_EXP_TANK') return 'bg-amber-500 text-black';
  if (isReplaceAction(action)) return 'bg-red-500 text-white';
  return 'bg-muted text-foreground';
};

// Format action for display
const formatAction = (action: RecommendationAction): string => {
  if (action === 'INSTALL_PRV') return 'INSTALL PRV';
  if (action === 'INSTALL_EXP_TANK') return 'INSTALL EXP TANK';
  if (action === 'MONITOR') return 'MONITOR';
  // Convert REPLACE_URGENT -> REPLACE, etc.
  if (action.startsWith('REPLACE_')) return 'REPLACE';
  return action;
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
        <span>{recommendation.badgeLabel.replace(/^[🆘🔴🟠🟢🛑🛡️🔧✅]\s*/, '')}</span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "px-3 py-1 rounded text-xs font-black uppercase tracking-widest",
          getActionStyle(recommendation.action)
        )}>
          {formatAction(recommendation.action)}
        </div>
        
        {!recommendation.canRepair && isReplaceAction(recommendation.action) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Repairs Locked</span>
          </div>
        )}
      </div>

      {/* Details */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {recommendation.script}
      </p>

      {/* Rule trigger */}
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-data">
        Triggered by: {recommendation.triggerRule}
      </div>
    </div>
  );
}
