import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface HealthScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30';
  if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  if (score >= 40) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  return 'text-red-400 bg-red-500/10 border-red-500/30';
}

export function HealthScoreBadge({ score, showLabel = true }: HealthScoreBadgeProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
      getScoreColor(score)
    )}>
      <Activity className="w-3 h-3" />
      <span className="font-bold">{score}</span>
      {showLabel && <span className="opacity-70">/100</span>}
    </div>
  );
}
