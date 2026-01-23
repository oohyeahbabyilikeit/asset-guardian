import { Trophy, CalendarCheck, DollarSign, Bot, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';

interface StatRowProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  isLoading: boolean;
  color?: string;
}

function StatRow({ icon: Icon, label, value, isLoading, color = 'text-foreground' }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-5 w-12" />
      ) : (
        <span className={cn('text-sm font-semibold', color)}>{value}</span>
      )}
    </div>
  );
}

export function WeeklyStatsCard() {
  const { data: stats, isLoading } = useWeeklyStats();

  return (
    <div className={cn(
      'rounded-xl p-5 border border-border bg-card',
      'shadow-sm'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-semibold text-foreground">This Week</h3>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        <StatRow
          icon={CalendarCheck}
          label="Jobs Booked"
          value={stats?.jobsBooked ?? 0}
          isLoading={isLoading}
        />
        <StatRow
          icon={DollarSign}
          label="Revenue"
          value={`$${(stats?.revenue ?? 0).toLocaleString()}`}
          isLoading={isLoading}
          color="text-emerald-400"
        />
        <StatRow
          icon={Bot}
          label="From Automation"
          value={stats?.fromAutomation ?? 0}
          isLoading={isLoading}
          color="text-violet-400"
        />
      </div>

      {/* Trend */}
      {stats && stats.trend > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+{stats.trend}% vs last week</span>
          </div>
        </div>
      )}
    </div>
  );
}
