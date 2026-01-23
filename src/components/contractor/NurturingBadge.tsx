import { cn } from '@/lib/utils';
import { Zap, Pause, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { 
  type NurturingSequence, 
  getSequenceTypeLabel, 
  formatNextAction 
} from '@/hooks/useNurturingSequences';

interface NurturingBadgeProps {
  sequence: NurturingSequence | null;
  compact?: boolean;
  showArrow?: boolean;
}

export function NurturingBadge({ sequence, compact = false, showArrow = true }: NurturingBadgeProps) {
  if (!sequence) {
    return compact ? null : (
      <div className="text-[10px] text-muted-foreground/60 italic">
        No sequence active
      </div>
    );
  }
  
  const { status, currentStep, totalSteps, sequenceType, nextActionAt } = sequence;
  const label = getSequenceTypeLabel(sequenceType);
  const nextAction = formatNextAction(nextActionAt);
  
  const isCancelled = status === 'cancelled';
  
  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
        status === 'active' && 'bg-violet-500/20 text-violet-300',
        status === 'paused' && 'bg-muted text-muted-foreground',
        status === 'completed' && 'bg-emerald-500/20 text-emerald-300',
        isCancelled && 'bg-muted text-muted-foreground',
      )}>
        {status === 'active' && <Zap className="w-2.5 h-2.5" />}
        {status === 'paused' && <Pause className="w-2.5 h-2.5" />}
        {status === 'completed' && <CheckCircle className="w-2.5 h-2.5" />}
        {isCancelled && <XCircle className="w-2.5 h-2.5" />}
        <span>{currentStep}/{totalSteps}</span>
      </div>
    );
  }
  
  return (
    <div className={cn(
      'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md',
      status === 'active' && 'bg-violet-500/10 text-violet-300 border border-violet-500/20',
      status === 'paused' && 'bg-muted text-muted-foreground border border-border',
      status === 'completed' && 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
      isCancelled && 'bg-muted text-muted-foreground border border-border',
    )}>
      {status === 'active' && <Zap className="w-3 h-3" />}
      {status === 'paused' && <Pause className="w-3 h-3" />}
      {status === 'completed' && <CheckCircle className="w-3 h-3" />}
      {isCancelled && <XCircle className="w-3 h-3" />}
      
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">·</span>
      <span>Step {currentStep}/{totalSteps}</span>
      
      {status === 'active' && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{nextAction}</span>
        </>
      )}
      
      {status === 'paused' && (
        <span className="text-amber-400 ml-1">(Paused)</span>
      )}
      
      {isCancelled && (
        <span className="text-muted-foreground ml-1">(Stopped)</span>
      )}
      
      {showArrow && (
        <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground" />
      )}
    </div>
  );
}
