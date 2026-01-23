import { cn } from '@/lib/utils';
import { DollarSign, Zap, Trophy, Target } from 'lucide-react';

interface MoneyDashboardProps {
  todayActionCount: number;
  pipelineValue: number; // 1-4 scale based on replacement count
  activeSequences: number;
  thisWeekWins: number;
}

export function MoneyDashboard({
  todayActionCount,
  pipelineValue,
  activeSequences,
  thisWeekWins,
}: MoneyDashboardProps) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-emerald-950/40 via-card to-amber-950/30 p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Today's Priority */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            todayActionCount > 0 
              ? 'bg-rose-500/20 animate-pulse' 
              : 'bg-muted'
          )}>
            <Target className={cn(
              'w-4 h-4',
              todayActionCount > 0 ? 'text-rose-400' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Today</p>
            <p className={cn(
              'text-sm font-bold',
              todayActionCount > 0 ? 'text-rose-400' : 'text-foreground'
            )}>
              {todayActionCount} {todayActionCount === 1 ? 'action' : 'actions'}
            </p>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4].map((level) => (
              <DollarSign
                key={level}
                className={cn(
                  'w-3.5 h-3.5 transition-all',
                  level <= pipelineValue
                    ? 'text-emerald-400'
                    : 'text-muted-foreground/30'
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">Pipeline</span>
        </div>

        {/* Active Sequences */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-500/20">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-violet-400">{activeSequences}</p>
            <p className="text-[9px] text-muted-foreground leading-none">Active</p>
          </div>
        </div>

        {/* This Week Wins */}
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'flex items-center justify-center w-6 h-6 rounded-md',
            thisWeekWins > 0 ? 'bg-amber-500/20' : 'bg-muted'
          )}>
            <Trophy className={cn(
              'w-3.5 h-3.5',
              thisWeekWins > 0 ? 'text-amber-400' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className={cn(
              'text-sm font-bold',
              thisWeekWins > 0 ? 'text-amber-400' : 'text-foreground'
            )}>
              {thisWeekWins}
            </p>
            <p className="text-[9px] text-muted-foreground leading-none">Won</p>
          </div>
        </div>
      </div>
    </div>
  );
}
