import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Flame, AlertTriangle, Wrench } from 'lucide-react';
import { LeadCardCompact } from './LeadCardCompact';
import { type CategorizedOpportunity, type LeadCategory } from '@/lib/opportunityCategories';
import { type NurturingSequence } from '@/hooks/useNurturingSequences';

interface LeadLaneProps {
  category: LeadCategory;
  opportunities: CategorizedOpportunity[];
  sequences: Record<string, NurturingSequence>;
  hotLeadId?: string;
  onCall: (opportunity: CategorizedOpportunity) => void;
  onViewDetails: (opportunity: CategorizedOpportunity) => void;
  onOpenCoach: (opportunity: CategorizedOpportunity) => void;
  onToggleSequence: (sequence: NurturingSequence) => void;
  onStartSequence: (opportunity: CategorizedOpportunity) => void;
  onOpenSequenceControl: (opportunity: CategorizedOpportunity, sequence: NurturingSequence) => void;
}

const categoryConfig = {
  replacements: {
    label: 'Replacements',
    icon: Flame,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  codeFixes: {
    label: 'Code Fixes',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
};

export function LeadLane({
  category,
  opportunities,
  sequences,
  hotLeadId,
  onCall,
  onViewDetails,
}: LeadLaneProps) {
  const count = opportunities.length;
  // Auto-collapse if 2 or fewer leads
  const [isExpanded, setIsExpanded] = useState(count > 2);
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  if (count === 0) {
    return null;
  }
  
  // Preview names for collapsed state
  const previewNames = opportunities.slice(0, 3).map(o => o.customerName.split(' ')[0]).join(', ');
  const moreCount = count > 3 ? count - 3 : 0;
  
  return (
    <div className={cn(
      'rounded-lg border',
      config.borderColor,
      'overflow-hidden'
    )}>
      {/* Lane Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5',
          config.bgColor,
          'hover:opacity-90 transition-opacity'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn('w-4 h-4 shrink-0', config.color)} />
          <span className={cn('font-medium text-sm', config.color)}>
            {config.label}
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full shrink-0',
            'bg-background/50 text-foreground/70'
          )}>
            {count}
          </span>
          
          {/* Collapsed preview */}
          {!isExpanded && (
            <span className="text-xs text-muted-foreground truncate ml-1">
              — {previewNames}{moreCount > 0 ? ` +${moreCount}` : ''}
            </span>
          )}
        </div>
        
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      
      {/* Lane Content */}
      {isExpanded && (
        <div className="p-2 space-y-1.5 bg-background/50">
          {opportunities.map(opportunity => {
            const sequence = sequences[opportunity.id] || null;
            return (
              <LeadCardCompact
                key={opportunity.id}
                opportunity={opportunity}
                sequence={sequence}
                isHotLead={opportunity.id === hotLeadId}
                onCall={() => onCall(opportunity)}
                onClick={() => onViewDetails(opportunity)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
