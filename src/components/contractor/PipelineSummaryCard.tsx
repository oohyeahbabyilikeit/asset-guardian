import { BarChart3, AlertTriangle, Wrench, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useContractorOpportunities, getClosesMetrics } from '@/hooks/useContractorOpportunities';

interface PipelineRowProps {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  isLoading: boolean;
}

function PipelineRow({ icon: Icon, label, count, color, isLoading }: PipelineRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className={cn('w-2 h-2 rounded-full', color)} />
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-5 w-8" />
      ) : (
        <span className="text-sm font-semibold text-foreground">{count}</span>
      )}
    </div>
  );
}

export function PipelineSummaryCard() {
  const { data: opportunities = [], isLoading } = useContractorOpportunities();
  
  const activeOpps = opportunities.filter(o => o.status !== 'dismissed' && o.status !== 'converted');
  const closesMetrics = getClosesMetrics(opportunities);
  
  // Estimate pipeline value (simple calculation)
  const estimatedValue = 
    (closesMetrics.replacements.total * 3500) + 
    (closesMetrics.codeFixes.total * 800) + 
    (closesMetrics.maintenance.total * 250);

  return (
    <div className={cn(
      'rounded-xl p-5 border border-border bg-card',
      'shadow-sm'
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
      </div>

      {/* Pipeline Breakdown */}
      <div className="space-y-1 mb-4">
        <PipelineRow
          icon={AlertTriangle}
          label="Replacements"
          count={closesMetrics.replacements.total}
          color="bg-rose-500"
          isLoading={isLoading}
        />
        <PipelineRow
          icon={Wrench}
          label="Code Fixes"
          count={closesMetrics.codeFixes.total}
          color="bg-amber-500"
          isLoading={isLoading}
        />
        <PipelineRow
          icon={Settings}
          label="Maintenance"
          count={closesMetrics.maintenance.total}
          color="bg-sky-500"
          isLoading={isLoading}
        />
      </div>

      {/* Total */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total Active</span>
          {isLoading ? (
            <Skeleton className="h-5 w-10" />
          ) : (
            <span className="text-sm font-bold text-foreground">{activeOpps.length}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">Est. Value</span>
          {isLoading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <span className="text-sm font-bold text-emerald-400">
              ~${estimatedValue.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
