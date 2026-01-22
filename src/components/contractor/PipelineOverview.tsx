import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { mockPipeline } from '@/data/mockContractorData';

interface PipelineOverviewProps {
  compact?: boolean;
}

export function PipelineOverview({ compact = false }: PipelineOverviewProps) {
  const { stages, conversionRate, closes } = mockPipeline;

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Pipeline</h3>
          <div className="flex items-center gap-1">
            <span className="text-xs text-emerald-600 font-medium">{closes.thisMonth} done</span>
            {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
            {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
          </div>
        </div>
        
        {/* Compact funnel */}
        <div className="flex items-center justify-between mb-3">
          {stages.map((stage, idx) => (
            <div key={stage.name} className="flex items-center">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700">{stage.count}</div>
                <div className="text-[10px] text-gray-400 uppercase">{stage.name.slice(0, 4)}</div>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="w-3 h-3 text-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>
        
        {/* Mini progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400 rounded-full transition-all"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500">{conversionRate}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-700">Lead Pipeline</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="text-gray-600 font-medium">{closes.thisMonth}</span>
          <span className="text-gray-400">completed</span>
          {closes.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
          {closes.trend === 'down' && <TrendingDown className="w-3 h-3 text-rose-500" />}
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
            {stages[stages.length - 1].count} completed this month
          </p>
        </div>
      </div>
    </div>
  );
}
