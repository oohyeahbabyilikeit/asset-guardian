import { AlertTriangle, Shield, Wrench, Eye, Droplets, Clock, AlertOctagon, Gauge, CheckCircle2, TrendingUp } from 'lucide-react';
import { Recommendation, ActionType } from '@/lib/opterraAlgorithm';

interface RecommendationBannerProps {
  recommendation: Recommendation;
  className?: string;
}

// Map action types to icons
const getActionIcon = (action: ActionType, title: string) => {
  if (action === 'REPLACE') {
    if (title.includes('Breach') || title.includes('Leak')) return AlertOctagon;
    if (title.includes('Sediment')) return Droplets;
    if (title.includes('Fatigue')) return Gauge;
    if (title.includes('Liability')) return Shield;
    if (title.includes('Statistical')) return Clock;
    return AlertTriangle;
  }
  if (action === 'REPAIR') return Wrench;
  if (action === 'UPGRADE') return TrendingUp;
  if (action === 'MAINTAIN') return Wrench;
  if (action === 'PASS') return CheckCircle2;
  return Eye;
};

// Map badge colors to styles
const getBadgeStyle = (badgeColor: Recommendation['badgeColor']): string => {
  switch (badgeColor) {
    case 'red':
      return 'bg-destructive/10 border-destructive/30 text-destructive';
    case 'orange':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'yellow':
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    case 'blue':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    case 'green':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    default:
      return 'bg-muted border-border text-foreground';
  }
};

export function RecommendationBanner({ recommendation, className = '' }: RecommendationBannerProps) {
  const Icon = getActionIcon(recommendation.action, recommendation.title);
  const style = getBadgeStyle(recommendation.badgeColor);

  return (
    <div className={`mx-4 p-4 rounded-xl border ${style} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-background/50">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm uppercase tracking-wide">
              {recommendation.title}
            </span>
            {recommendation.urgent && recommendation.action === 'REPLACE' && (
              <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive">
                Urgent
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {recommendation.reason}
          </p>
        </div>
      </div>
    </div>
  );
}
