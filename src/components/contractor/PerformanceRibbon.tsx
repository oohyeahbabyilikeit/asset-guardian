import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Flame, Phone, Zap, CheckCircle } from 'lucide-react';
import { type ClosesMetrics } from '@/hooks/useContractorOpportunities';

interface PerformanceRibbonProps {
  metrics: ClosesMetrics;
  sequenceStats: {
    active: number;
    paused: number;
    completed: number;
  };
}

export function PerformanceRibbon({ metrics, sequenceStats }: PerformanceRibbonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const trendIcon = metrics.trend === 'up' 
    ? <TrendingUp className="w-3 h-3 text-emerald-400" />
    : metrics.trend === 'down' 
    ? <TrendingDown className="w-3 h-3 text-rose-400" />
    : <Minus className="w-3 h-3 text-muted-foreground" />;

  const isHotStreak = metrics.thisMonth >= 3 && metrics.trend === 'up';
  
  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">This Week</span>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-foreground">{metrics.thisMonth} closes</span>
            {trendIcon}
          </div>
          {isHotStreak && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Hot streak</span>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Sequences */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-violet-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span className="font-bold text-lg">{sequenceStats.active + sequenceStats.completed}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Sequences Run</p>
            </div>
            
            {/* Conversion indicator */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-bold text-lg">{sequenceStats.completed}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Conversions</p>
            </div>
            
            {/* Response simulation */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-bold text-lg">67%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Response Rate</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
              Closes Breakdown
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-muted-foreground">Replacements:</span>
                <span className="font-medium text-foreground">{metrics.replacements.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-muted-foreground">Code Fixes:</span>
                <span className="font-medium text-foreground">{metrics.codeFixes.total}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="text-muted-foreground">Maintenance:</span>
                <span className="font-medium text-foreground">{metrics.maintenance.total}</span>
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
            <span className="text-muted-foreground">vs Last Week</span>
            <div className={cn(
              'flex items-center gap-1',
              metrics.trend === 'up' ? 'text-emerald-400' : 
              metrics.trend === 'down' ? 'text-rose-400' : 'text-muted-foreground'
            )}>
              {trendIcon}
              <span>
                {metrics.thisMonth > metrics.lastMonth 
                  ? `+${metrics.thisMonth - metrics.lastMonth}` 
                  : metrics.thisMonth < metrics.lastMonth 
                  ? `${metrics.thisMonth - metrics.lastMonth}`
                  : 'Same'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
