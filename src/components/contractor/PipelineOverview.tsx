import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { MockOpportunity } from '@/data/mockContractorData';
import { getPipelineMetrics } from '@/hooks/useContractorOpportunities';

interface PipelineOverviewProps {
  compact?: boolean;
  opportunities: MockOpportunity[];
}

export function PipelineOverview({ compact = false, opportunities }: PipelineOverviewProps) {
  const { stages, conversionRate, closes } = getPipelineMetrics(opportunities);

  if (compact) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Pipeline</h3>
          <div className="flex items-center gap-1">
            <span className="text-xs text-emerald-300 font-medium">{closes.thisMonth} done</span>
            {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
            {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
          </div>
        </div>
        
        {/* Compact funnel */}
        <div className="flex items-center justify-between mb-3">
          {stages.map((stage, idx) => (
            <div key={stage.name} className="flex items-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">{stage.count}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{stage.name.slice(0, 4)}</div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/50 mx-1" />
              )}
            </div>
          ))}
        </div>
        
        {/* Mini progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-muted-foreground/60 rounded-full transition-all"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{conversionRate}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Lead Pipeline</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-foreground font-medium">{closes.thisMonth}</span>
          <span className="text-muted-foreground">completed</span>
          {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
          {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
        </div>
      </div>
      
      {/* Pipeline Stages */}
      <div className="grid grid-cols-4 gap-1">
        {stages.map((stage, index) => (
          <div 
            key={stage.name} 
            className="text-center p-3 rounded-lg bg-secondary/30 relative"
          >
            <div className="text-xl font-semibold text-foreground">{stage.count}</div>
            <div className="text-xs text-muted-foreground">{stage.name}</div>
            
            {/* Connector arrow (except last) */}
            {index < stages.length - 1 && (
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 text-muted-foreground/50 z-10" />
            )}
          </div>
        ))}
      </div>
      
      {/* Conversion Rate Bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-muted-foreground/60 rounded-full transition-all duration-500" 
            style={{ width: `${conversionRate}%` }} 
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/70" />
            <span className="font-medium text-foreground">{conversionRate}%</span> conversion
          </p>
          <p className="text-xs text-muted-foreground">
            {stages[stages.length - 1].count} completed this month
          </p>
        </div>
      </div>
    </div>
  );
}
