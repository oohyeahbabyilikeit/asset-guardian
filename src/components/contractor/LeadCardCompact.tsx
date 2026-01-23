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
  
  // Health score color
  const healthColor = opportunity.healthScore <= 30 
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
    : opportunity.healthScore <= 50 
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border bg-card/80 backdrop-blur-sm transition-all duration-200',
        'hover:shadow-lg hover:shadow-black/20 hover:border-white/10 hover:bg-card',
        'focus:outline-none focus:ring-2 focus:ring-primary/30',
        'border-white/5',
        isHotLead && 'ring-2 ring-rose-500/50 shadow-xl shadow-rose-500/15 border-rose-500/30'
      )}
    >
      {/* Row 1: Name + Urgency + Health + Call */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <span className={cn('w-2.5 h-2.5 rounded-full shrink-0 shadow-lg', dotColor)} />
        <span className="font-semibold text-foreground truncate flex-1">
          {opportunity.customerName}
        </span>
        
        {urgencyTag && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500/25 text-rose-200 border border-rose-500/40 shrink-0">
            {urgencyTag}
          </span>
        )}
        
        <span className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full shrink-0 border',
          healthColor
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
          className="h-8 w-8 p-0 shrink-0 bg-muted/50 hover:bg-emerald-600 hover:text-white border border-white/5 hover:border-emerald-500/50 transition-all"
        >
          <Phone className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      {/* Row 2: Unit + Sequence + Arrow */}
      <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground">
        <span className="truncate flex-1">
          {unitSummary}
        </span>
        
        {sequenceLabel && (
          <span className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium shrink-0 border',
            isPaused 
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
              : 'bg-violet-500/15 text-violet-400 border-violet-500/30'
          )}>
            {isPaused && <Pause className="w-2.5 h-2.5" />}
            {sequenceLabel}
          </span>
        )}
        
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      </div>
    </button>
  );
}
