import { cn } from '@/lib/utils';
import { Phone, Zap, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CategorizedOpportunity } from '@/lib/opportunityCategories';
import { type NurturingSequence } from '@/hooks/useNurturingSequences';
import { formatDistanceToNow } from 'date-fns';
import { getUnitSummary } from '@/data/mockContractorData';

interface HotLeadPanelProps {
  opportunity: CategorizedOpportunity;
  sequence: NurturingSequence | null;
  onCall: () => void;
  onStartSequence: () => void;
  onSkip: () => void;
  onViewDetails: () => void;
}

export function HotLeadPanel({
  opportunity,
  sequence,
  onCall,
  onStartSequence,
  onSkip,
  onViewDetails,
}: HotLeadPanelProps) {
  const timeAgo = formatDistanceToNow(opportunity.createdAt, { addSuffix: false });
  const hasSequence = !!sequence && sequence.status !== 'completed' && sequence.status !== 'cancelled';
  const isLeaking = opportunity.forensicInputs?.isLeaking;
  
  const urgencyReason = isLeaking
    ? 'LEAKING'
    : opportunity.priority === 'critical'
    ? 'CRITICAL'
    : 'HIGH PRIORITY';

  return (
    <div className="rounded-xl border-2 border-rose-500/50 bg-gradient-to-br from-rose-950/60 via-card to-card p-4 shadow-lg shadow-rose-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-rose-400">
            Priority Action
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Lead Info */}
      <div 
        className="mb-4 cursor-pointer group"
        onClick={onViewDetails}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {opportunity.customerName}
          </h3>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            'bg-rose-500/20 text-rose-300'
          )}>
            {urgencyReason}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {getUnitSummary(opportunity.asset)} · Health: {opportunity.opterraResult?.healthScore ?? '--'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onCall}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
        >
          <Phone className="w-4 h-4" />
          Call Now
        </Button>
        
        {!hasSequence ? (
          <Button
            onClick={onStartSequence}
            variant="secondary"
            className="flex-1 gap-2"
          >
            <Zap className="w-4 h-4" />
            Start Sequence
          </Button>
        ) : (
          <Button
            onClick={onViewDetails}
            variant="secondary"
            className="flex-1 gap-2"
          >
            Step {sequence.currentStep}/{sequence.totalSteps}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
        
        <Button
          onClick={onSkip}
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
