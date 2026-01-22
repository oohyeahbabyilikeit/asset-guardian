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
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700">Lead Pipeline</h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <DollarSign className="w-3 h-3" />
          <span className="text-gray-600">{formatCurrency(totalRevenue)}</span>
          <span>potential</span>
        </div>
      </div>
      
      {/* Pipeline Stages */}
      <div className="grid grid-cols-4 gap-1">
        {stages.map((stage, index) => (
          <div 
            key={stage.name} 
            className="text-center p-3 rounded-lg bg-gray-50/80 relative"
          >
            <div className="text-xl font-semibold text-gray-700">{stage.count}</div>
            <div className="text-xs text-gray-500">{stage.name}</div>
            <div className="text-[10px] text-gray-400 mt-1">
              {formatCurrency(stage.revenue)}
            </div>
            
            {/* Connector arrow (except last) */}
            {index < stages.length - 1 && (
              <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 text-gray-300 z-10" />
            )}
          </div>
        ))}
      </div>
      
      {/* Conversion Rate Bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-400 rounded-full transition-all duration-500" 
            style={{ width: `${conversionRate}%` }} 
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-600">{conversionRate}%</span> conversion
          </p>
          <p className="text-xs text-gray-400">
            {stages[stages.length - 1].count} closed this month
          </p>
        </div>
      </div>
    </div>
  );
}
