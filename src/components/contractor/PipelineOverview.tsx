import { TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Lead Pipeline</h3>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
          <DollarSign className="w-3 h-3 text-emerald-600" />
          <span className="font-medium text-emerald-700">{formatCurrency(totalRevenue)}</span>
          <span>potential</span>
        </div>
      </div>
      
      {/* Pipeline Stages */}
      <div className="grid grid-cols-4 gap-1">
        {stages.map((stage, index) => (
          <div 
            key={stage.name} 
            className="text-center p-3 rounded-lg bg-slate-50 relative"
          >
            <div className="text-2xl font-bold text-slate-800">{stage.count}</div>
            <div className="text-xs text-slate-500 font-medium">{stage.name}</div>
            <div className="text-[10px] text-blue-600 font-medium mt-1">
              {formatCurrency(stage.revenue)}
            </div>
            
            {/* Connector arrow (except last) */}
            {index < stages.length - 1 && (
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 text-slate-300 z-10" />
            )}
          </div>
        ))}
      </div>
      
      {/* Conversion Rate Bar */}
      <div className="mt-4">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" 
            style={{ width: `${conversionRate}%` }} 
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-slate-600 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">{conversionRate}%</span> conversion rate
          </p>
          <p className="text-xs text-slate-500">
            {stages[stages.length - 1].count} closed this month
          </p>
        </div>
      </div>
    </div>
  );
}
