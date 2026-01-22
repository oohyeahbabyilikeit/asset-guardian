import { Wrench, AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import type { MockOpportunity } from '@/data/mockContractorData';
import { getClosesMetrics } from '@/hooks/useContractorOpportunities';

interface CategoryRowProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  detail?: string;
}

function CategoryRow({ icon, label, count, detail }: CategoryRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">{label}</span>
          <span className="text-sm font-medium text-foreground">{count}</span>
        </div>
        {detail && (
          <p className="text-[11px] text-muted-foreground truncate">{detail}</p>
        )}
      </div>
    </div>
  );
}

interface ClosesBreakdownProps {
  compact?: boolean;
  opportunities: MockOpportunity[];
}

export function ClosesBreakdown({ compact = false, opportunities }: ClosesBreakdownProps) {
  const closes = getClosesMetrics(opportunities);
  
  const percentChange = closes.lastMonth > 0 
    ? Math.round(((closes.thisMonth - closes.lastMonth) / closes.lastMonth) * 100)
    : 0;

  if (compact) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-foreground">Completed</h3>
          <span className="text-sm text-foreground font-medium">{closes.thisMonth}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              {closes.maintenance.total}
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {closes.codeFixes.total}
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              {closes.replacements.total}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
            {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
            <span className={closes.trend === 'up' ? 'text-emerald-300' : closes.trend === 'down' ? 'text-rose-300' : ''}>
              {percentChange > 0 ? '+' : ''}{percentChange}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Completed Services</h3>
        <span className="text-sm text-foreground font-medium">{closes.thisMonth} total</span>
      </div>
      
      {/* Category rows */}
      <div className="space-y-2.5">
        <CategoryRow 
          icon={<Wrench className="w-4 h-4" />} 
          label="Maintenance" 
          count={closes.maintenance.total}
          detail={`${closes.maintenance.breakdown.flush} flush · ${closes.maintenance.breakdown.anode} anode · ${closes.maintenance.breakdown.descale} descale`}
        />
        <CategoryRow 
          icon={<AlertTriangle className="w-4 h-4" />} 
          label="Code Fixes" 
          count={closes.codeFixes.total}
          detail={`${closes.codeFixes.breakdown.expTank} exp tank · ${closes.codeFixes.breakdown.prv} PRV · ${closes.codeFixes.breakdown.softener} softener`}
        />
        <CategoryRow 
          icon={<RefreshCw className="w-4 h-4" />} 
          label="Replacements" 
          count={closes.replacements.total}
        />
      </div>
      
      {/* Trend footer */}
      <div className="mt-3 pt-2 border-t border-border flex items-center gap-1 text-xs text-muted-foreground">
        {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-400" />}
        <span className={closes.trend === 'up' ? 'text-emerald-300' : closes.trend === 'down' ? 'text-rose-300' : ''}>
          {percentChange > 0 ? '+' : ''}{percentChange}%
        </span>
        <span>vs last month ({closes.lastMonth})</span>
      </div>
    </div>
  );
}
