import { AlertTriangle, Shield, Wrench, Eye, Droplets, Clock, AlertOctagon } from 'lucide-react';
import { Recommendation, RecommendationAction } from '@/lib/opterraAlgorithm';

interface RecommendationBannerProps {
  recommendation: Recommendation;
  className?: string;
}

// Map v4.0 action types to icons
const actionIcons: Record<RecommendationAction, typeof AlertTriangle> = {
  REPLACE_URGENT: AlertOctagon,
  REPLACE_UNSERVICEABLE: Droplets,
  REPLACE_EXPIRED: Clock,
  REPLACE_LIABILITY: Shield,
  REPLACE_RISK: AlertTriangle,
  INSTALL_PRV: Wrench,
  MONITOR: Eye,
};

// Map v4.0 action types to styles
const actionStyles: Record<RecommendationAction, string> = {
  REPLACE_URGENT: 'bg-destructive/10 border-destructive/30 text-destructive',
  REPLACE_UNSERVICEABLE: 'bg-destructive/10 border-destructive/30 text-destructive',
  REPLACE_EXPIRED: 'bg-destructive/10 border-destructive/30 text-destructive',
  REPLACE_LIABILITY: 'bg-destructive/10 border-destructive/30 text-destructive',
  REPLACE_RISK: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  INSTALL_PRV: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  MONITOR: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
};

// Helper to check if action requires replacement
const isReplaceAction = (action: RecommendationAction): boolean => {
  return action.startsWith('REPLACE_');
};

export function RecommendationBanner({ recommendation, className = '' }: RecommendationBannerProps) {
  const Icon = actionIcons[recommendation.action] || AlertTriangle;
  const style = actionStyles[recommendation.action] || actionStyles.MONITOR;

  return (
    <div className={`mx-4 p-4 rounded-xl border ${style} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background/50">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm uppercase tracking-wide">
              {recommendation.badgeLabel}
            </span>
            {!recommendation.canRepair && isReplaceAction(recommendation.action) && (
              <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
                Required
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {recommendation.script}
          </p>
        </div>
      </div>
    </div>
  );
}
