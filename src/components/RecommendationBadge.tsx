import { AlertTriangle, Shield, Clock, Wrench, CheckCircle2, AlertOctagon, Droplets, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Recommendation, type ActionType } from '@/lib/opterraAlgorithm';

interface RecommendationBadgeProps {
  recommendation: Recommendation;
  className?: string;
}

// Get icon based on action type and title
const getActionIcon = (action: ActionType, title: string) => {
  if (action === 'REPLACE') {
    if (title.includes('Breach') || title.includes('Leak')) return AlertOctagon;
    if (title.includes('Sediment')) return Droplets;
    if (title.includes('Fatigue')) return AlertTriangle;
    if (title.includes('Liability')) return Shield;
    if (title.includes('Statistical')) return Clock;
    return AlertTriangle;
  }
  if (action === 'REPAIR') return Wrench;
  if (action === 'UPGRADE') return TrendingUp;
  if (action === 'MAINTAIN') return Wrench;
  if (action === 'PASS') return CheckCircle2;
  return AlertTriangle;
};

// Get style based on badge color
const getBadgeStyle = (badgeColor: Recommendation['badgeColor']): string => {
  switch (badgeColor) {
    case 'red':
      return 'bg-red-500/20 border-red-500/50 text-red-400';
    case 'orange':
      return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
    case 'yellow':
      return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    case 'blue':
      return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    case 'green':
      return 'bg-green-500/20 border-green-500/50 text-green-400';
    default:
      return 'bg-muted border-border text-foreground';
  }
};

// Get action style
const getActionStyle = (action: ActionType): string => {
  switch (action) {
    case 'REPLACE':
      return 'bg-red-500 text-white';
    case 'REPAIR':
      return 'bg-amber-500 text-black';
    case 'UPGRADE':
      return 'bg-blue-500 text-white';
    case 'MAINTAIN':
      return 'bg-green-500 text-white';
    case 'PASS':
      return 'bg-green-500 text-white';
    default:
      return 'bg-muted text-foreground';
  }
};

export function RecommendationBadge({ recommendation, className }: RecommendationBadgeProps) {
  const Icon = getActionIcon(recommendation.action, recommendation.title);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Badge */}
      <div className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-bold text-sm uppercase tracking-wider",
        getBadgeStyle(recommendation.badgeColor)
      )}>
        <Icon className="w-4 h-4" />
        <span>{recommendation.title}</span>
      </div>

      {/* Action */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "px-3 py-1 rounded text-xs font-black uppercase tracking-widest",
          getActionStyle(recommendation.action)
        )}>
          {recommendation.action}
        </div>
        
        {recommendation.action === 'REPLACE' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Repairs Locked</span>
          </div>
        )}
      </div>

      {/* Details */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {recommendation.reason}
      </p>

      {/* Urgency indicator */}
      {recommendation.urgent && (
        <div className="text-[10px] uppercase tracking-widest text-destructive font-data font-bold">
          ⚠️ Urgent Action Required
        </div>
      )}
    </div>
  );
}
