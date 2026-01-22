import { cn } from '@/lib/utils';

interface HealthScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

function getScoreStyle(score: number) {
  if (score < 40) return 'text-rose-600';
  if (score < 60) return 'text-orange-600';
  if (score < 80) return 'text-amber-600';
  return 'text-emerald-600';
}

export function HealthScoreBadge({ score, showLabel = true }: HealthScoreBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className={cn('font-semibold tabular-nums', getScoreStyle(score))}>
        {score}
      </span>
      {showLabel && <span className="text-gray-400">/100</span>}
    </div>
  );
}
