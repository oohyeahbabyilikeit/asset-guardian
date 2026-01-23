import { cn } from '@/lib/utils';
import { Zap, Pause, CheckCircle } from 'lucide-react';
import { 
  type NurturingSequence, 
  getSequenceTypeLabel, 
  formatNextAction 
} from '@/hooks/useNurturingSequences';

interface NurturingBadgeProps {
  sequence: NurturingSequence | null;
  compact?: boolean;
}

export function NurturingBadge({ sequence, compact = false }: NurturingBadgeProps) {
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
  
  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded',
        status === 'active' && 'bg-violet-500/20 text-violet-300',
        status === 'paused' && 'bg-muted text-muted-foreground',
        status === 'completed' && 'bg-emerald-500/20 text-emerald-300',
      )}>
        {status === 'active' && <Zap className="w-2.5 h-2.5" />}
        {status === 'paused' && <Pause className="w-2.5 h-2.5" />}
        {status === 'completed' && <CheckCircle className="w-2.5 h-2.5" />}
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
    )}>
      {status === 'active' && <Zap className="w-3 h-3" />}
      {status === 'paused' && <Pause className="w-3 h-3" />}
      {status === 'completed' && <CheckCircle className="w-3 h-3" />}
      
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
    </div>
  );
}
