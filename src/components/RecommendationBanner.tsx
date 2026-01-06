import { AlertTriangle, Shield, Wrench, Eye } from 'lucide-react';
import { Recommendation } from '@/lib/opterraAlgorithm';

interface RecommendationBannerProps {
  recommendation: Recommendation;
  className?: string;
}

const actionIcons = {
  REPLACE: AlertTriangle,
  REPAIR: Wrench,
  MONITOR: Eye,
};

const actionStyles = {
  REPLACE: 'bg-destructive/10 border-destructive/30 text-destructive',
  REPAIR: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  MONITOR: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
};

export function RecommendationBanner({ recommendation, className = '' }: RecommendationBannerProps) {
  const Icon = actionIcons[recommendation.action];
  const style = actionStyles[recommendation.action];

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
            {!recommendation.canRepair && recommendation.action === 'REPLACE' && (
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
