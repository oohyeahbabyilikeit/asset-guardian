import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { type Priority } from '@/data/mockContractorData';

interface PriorityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface TodaysSummaryProps {
  counts: PriorityCounts;
  selectedPriority: Priority | null;
  onPriorityClick: (priority: Priority) => void;
}

export function TodaysSummary({ counts, selectedPriority, onPriorityClick }: TodaysSummaryProps) {
  const total = counts.critical + counts.high + counts.medium + counts.low;
  const urgentCount = counts.critical + counts.high;
  
  const priorities: { key: Priority; label: string; color: string; dotColor: string }[] = [
    { key: 'critical', label: 'Critical', color: 'text-rose-600', dotColor: 'bg-rose-400' },
    { key: 'high', label: 'High', color: 'text-orange-600', dotColor: 'bg-orange-400' },
    { key: 'medium', label: 'Med', color: 'text-amber-600', dotColor: 'bg-amber-400' },
    { key: 'low', label: 'Low', color: 'text-emerald-600', dotColor: 'bg-emerald-400' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Today's Actions</h3>
        <span className="text-xs text-gray-400">{total} total</span>
      </div>
      
      {/* Urgent Alert */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-rose-50/50 rounded-md">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span className="text-sm text-rose-700 font-medium">
            {urgentCount} urgent {urgentCount === 1 ? 'action' : 'actions'} needed
          </span>
        </div>
      )}
      
      {/* Priority Breakdown */}
      <div className="flex items-center gap-1">
        {priorities.map((p, idx) => {
          const count = counts[p.key];
          const isSelected = selectedPriority === p.key;
          
          return (
            <button
              key={p.key}
              onClick={() => onPriorityClick(p.key)}
              className={cn(
                'flex-1 flex flex-col items-center py-2 px-1 rounded-md transition-all',
                'hover:bg-gray-50',
                isSelected && 'bg-gray-100 ring-1 ring-gray-200'
              )}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', p.dotColor)} />
                <span className={cn('text-lg font-semibold', count > 0 ? p.color : 'text-gray-300')}>
                  {count}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Clear Filter */}
      {selectedPriority && (
        <button 
          onClick={() => onPriorityClick(selectedPriority)}
          className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 py-1"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
