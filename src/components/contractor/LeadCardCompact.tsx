import { cn } from '@/lib/utils';
import { Phone, ChevronRight, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CategorizedOpportunity } from '@/lib/opportunityCategories';
import { type NurturingSequence, getSequenceTypeLabel } from '@/hooks/useNurturingSequences';
import { getUnitSummary } from '@/data/mockContractorData';

interface LeadCardCompactProps {
  opportunity: CategorizedOpportunity;
  sequence: NurturingSequence | null;
  isHotLead?: boolean;
  onCall: () => void;
  onClick: () => void;
}

const categoryDotColors = {
  replacements: 'bg-rose-500',
  codeFixes: 'bg-amber-500',
  maintenance: 'bg-sky-500',
};

export function LeadCardCompact({
  opportunity,
  sequence,
  isHotLead = false,
  onCall,
  onClick,
}: LeadCardCompactProps) {
  const dotColor = categoryDotColors[opportunity.category];
  const unitSummary = getUnitSummary(opportunity.asset);
  const isLeaking = opportunity.forensicInputs?.isLeaking;
  
  // Build urgency tag
  const urgencyTag = isLeaking ? 'LEAKING' : opportunity.priority === 'critical' ? 'CRITICAL' : null;
  
  // Sequence info
  const hasSequence = sequence && sequence.status !== 'completed' && sequence.status !== 'cancelled';
  const isPaused = sequence?.status === 'paused';
  const sequenceLabel = hasSequence 
    ? `${getSequenceTypeLabel(sequence.sequenceType)} ${sequence.currentStep}/${sequence.totalSteps}`
    : null;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border bg-card transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        isHotLead && 'ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10'
      )}
    >
      {/* Row 1: Name + Urgency + Health + Call */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
        <span className="font-medium text-foreground truncate flex-1">
          {opportunity.customerName}
        </span>
        
        {urgencyTag && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 shrink-0">
            {urgencyTag}
          </span>
        )}
        
        <span className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full shrink-0',
          opportunity.healthScore <= 30 
            ? 'bg-destructive/10 text-destructive' 
            : opportunity.healthScore <= 50 
              ? 'bg-warning/10 text-warning'
              : 'bg-emerald-500/10 text-emerald-300'
        )}>
          {opportunity.healthScore}
        </span>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onCall();
          }}
          className="h-7 w-7 p-0 shrink-0"
        >
          <Phone className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      {/* Row 2: Unit + Sequence + Arrow */}
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <span className="truncate flex-1">
          {unitSummary}
        </span>
        
        {sequenceLabel && (
          <span className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0',
            isPaused 
              ? 'bg-amber-500/10 text-amber-400' 
              : 'bg-violet-500/10 text-violet-400'
          )}>
            {isPaused && <Pause className="w-2.5 h-2.5" />}
            {sequenceLabel}
          </span>
        )}
        
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      </div>
    </button>
  );
}
