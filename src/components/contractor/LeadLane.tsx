import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Flame, AlertTriangle, Wrench } from 'lucide-react';
import { EnhancedLeadCard } from './EnhancedLeadCard';
import { type CategorizedOpportunity, type LeadCategory } from '@/lib/opportunityCategories';
import { type NurturingSequence } from '@/hooks/useNurturingSequences';

interface LeadLaneProps {
  category: LeadCategory;
  opportunities: CategorizedOpportunity[];
  sequences: Record<string, NurturingSequence>;
  onCall: (opportunity: CategorizedOpportunity) => void;
  onViewDetails: (opportunity: CategorizedOpportunity) => void;
  onOpenCoach: (opportunity: CategorizedOpportunity) => void;
  onToggleSequence: (sequence: NurturingSequence) => void;
  onStartSequence: (opportunity: CategorizedOpportunity) => void;
  onOpenSequenceControl: (opportunity: CategorizedOpportunity, sequence: NurturingSequence) => void;
  defaultExpanded?: boolean;
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
  onCall,
  onViewDetails,
  onOpenCoach,
  onToggleSequence,
  onStartSequence,
  onOpenSequenceControl,
  defaultExpanded = true,
}: LeadLaneProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = categoryConfig[category];
  const Icon = config.icon;
  const count = opportunities.length;
  
  if (count === 0) {
    return null;
  }
  
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
          'w-full flex items-center justify-between px-4 py-3',
          config.bgColor,
          'hover:opacity-90 transition-opacity'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', config.color)} />
          <span className={cn('font-medium text-sm', config.color)}>
            {config.label}
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            'bg-background/50 text-foreground/70'
          )}>
            {count} lead{count !== 1 ? 's' : ''}
          </span>
        </div>
        
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      
      {/* Lane Content */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-background/50">
          {opportunities.map(opportunity => {
            const sequence = sequences[opportunity.id] || null;
            return (
              <EnhancedLeadCard
                key={opportunity.id}
                opportunity={opportunity}
                sequence={sequence}
                onCall={() => onCall(opportunity)}
                onViewDetails={() => onViewDetails(opportunity)}
                onOpenCoach={() => onOpenCoach(opportunity)}
                onToggleSequence={() => {
                  if (sequence) onToggleSequence(sequence);
                }}
                onStartSequence={() => onStartSequence(opportunity)}
                onOpenSequenceControl={() => {
                  if (sequence) onOpenSequenceControl(opportunity, sequence);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
