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
    className: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
  ELEVATED: {
    label: 'Elevated',
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  },
  COMPLEX: {
    label: 'Complex',
    icon: Construction,
    className: 'bg-red-500/10 text-red-400 border-red-500/30',
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
