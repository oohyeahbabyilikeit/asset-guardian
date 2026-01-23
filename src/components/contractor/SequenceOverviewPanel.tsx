import { cn } from '@/lib/utils';
import { Zap, Pause, CheckCircle, Activity } from 'lucide-react';
import { type SequenceStats } from '@/hooks/useNurturingSequences';

interface SequenceOverviewPanelProps {
  stats: SequenceStats;
}

export function SequenceOverviewPanel({ stats }: SequenceOverviewPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-medium text-foreground">
          Nurturing Sequences
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-3 h-3" />
            <span className="font-medium">{stats.active}</span>
          </div>
          <span className="text-muted-foreground">Active</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-amber-400">
            <Pause className="w-3 h-3" />
            <span className="font-medium">{stats.paused}</span>
          </div>
          <span className="text-muted-foreground">Paused</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle className="w-3 h-3" />
            <span className="font-medium">{stats.completed}</span>
          </div>
          <span className="text-muted-foreground">Done</span>
        </div>
      </div>
    </div>
  );
}
