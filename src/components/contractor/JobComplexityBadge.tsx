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
    className: 'text-gray-500',
  },
  ELEVATED: {
    label: 'Elevated',
    icon: AlertTriangle,
    className: 'text-amber-600',
  },
  COMPLEX: {
    label: 'Complex',
    icon: Construction,
    className: 'text-rose-600',
  },
};

export function JobComplexityBadge({ complexity }: JobComplexityBadgeProps) {
  const config = complexityConfig[complexity];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      'inline-flex items-center gap-1 text-xs',
      config.className
    )}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}
