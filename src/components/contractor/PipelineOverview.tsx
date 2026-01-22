import { TrendingUp, DollarSign } from 'lucide-react';
import { mockPipeline } from '@/data/mockContractorData';

export function PipelineOverview() {
  const { stages, conversionRate, totalRevenue } = mockPipeline;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Lead Pipeline</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          <span>{formatCurrency(totalRevenue)} potential</span>
        </div>
      </div>
      
      {/* Pipeline Stages */}
      <div className="grid grid-cols-4 gap-2">
        {stages.map((stage, index) => (
          <div 
            key={stage.name} 
            className="text-center p-3 rounded-lg bg-muted/50 relative"
          >
            <div className="text-2xl font-bold text-foreground">{stage.count}</div>
            <div className="text-xs text-muted-foreground">{stage.name}</div>
            <div className="text-[10px] text-primary mt-1">
              {formatCurrency(stage.revenue)}
            </div>
            
            {/* Connector arrow (except last) */}
            {index < stages.length - 1 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-muted-foreground/30 z-10">
                →
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Conversion Rate Bar */}
      <div className="mt-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" 
            style={{ width: `${conversionRate}%` }} 
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            {conversionRate}% conversion rate
          </p>
          <p className="text-xs text-muted-foreground">
            {stages[stages.length - 1].count} closed this month
          </p>
        </div>
      </div>
    </div>
  );
}
