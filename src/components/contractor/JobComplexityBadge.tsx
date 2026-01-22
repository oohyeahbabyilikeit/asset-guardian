import { cn } from '@/lib/utils';
import { Wrench, AlertTriangle, Construction } from 'lucide-react';
import type { JobComplexity } from '@/data/mockContractorData';

interface JobComplexityBadgeProps {
  complexity: JobComplexity;
}

const complexityConfig = {
  STANDARD: {
    label: 'Standard',
    icon: Wrench,
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  ELEVATED: {
    label: 'Elevated',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  COMPLEX: {
    label: 'Complex',
    icon: Construction,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function JobComplexityBadge({ complexity }: JobComplexityBadgeProps) {
  const config = complexityConfig[complexity];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border',
      config.className
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}
