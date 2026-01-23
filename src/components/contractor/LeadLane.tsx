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
    bgColor: 'bg-gradient-to-r from-rose-500/15 to-rose-500/5',
    borderColor: 'border-rose-500/20',
    iconBg: 'bg-rose-500/20',
  },
  codeFixes: {
    label: 'Code Fixes',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-gradient-to-r from-amber-500/15 to-amber-500/5',
    borderColor: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
  },
  maintenance: {
    label: 'Maintenance',
    icon: Wrench,
    color: 'text-sky-400',
    bgColor: 'bg-gradient-to-r from-sky-500/15 to-sky-500/5',
    borderColor: 'border-sky-500/20',
    iconBg: 'bg-sky-500/20',
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
      'rounded-xl border overflow-hidden',
      config.borderColor,
      'shadow-lg shadow-black/10'
    )}>
      {/* Lane Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          config.bgColor,
          'hover:opacity-90 transition-all duration-200'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            config.iconBg
          )}>
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>
          <span className={cn('font-semibold text-sm', config.color)}>
            {config.label}
          </span>
          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full',
            'bg-background/60 text-foreground/80 border border-white/10'
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
        
        <div className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg bg-background/40 border border-white/5',
          'transition-transform duration-200',
          isExpanded && 'rotate-0'
        )}>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* Lane Content */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-background/50">
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
