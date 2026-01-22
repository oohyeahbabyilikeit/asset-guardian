import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface HealthScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
  if (score >= 40) return 'text-orange-700 bg-orange-50 border-orange-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function HealthScoreBadge({ score, showLabel = true }: HealthScoreBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
      getScoreColor(score)
    )}>
      <Activity className="w-3 h-3" />
      <span className="font-bold">{score}</span>
      {showLabel && <span className="opacity-60">/100</span>}
    </div>
  );
}
