import { ChevronRight, Pause, Play, Send, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  type NurturingSequence, 
  getSequenceTypeLabel,
  useToggleSequenceStatus,
} from '@/hooks/useNurturingSequences';
import { useSendNow, useSkipStep, useSequenceEvents } from '@/hooks/useSequenceEvents';
import { toast } from 'sonner';

interface SequenceRowProps {
  sequence: NurturingSequence;
  customerName: string;
  propertyAddress: string;
  urgency: 'overdue' | 'today' | 'upcoming';
  onClick: () => void;
}

function formatDueDate(date: Date | null): string {
  if (!date) return 'No date';
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = date.getTime() - todayStart.getTime();
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    const absDays = Math.abs(daysDiff);
    if (absDays === 1) return 'Yesterday';
    return `${absDays} days ago`;
  }
  
  if (daysDiff === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })}`;
  }
  
  if (daysDiff === 1) return 'Tomorrow';
  
  if (daysDiff <= 7) return `In ${daysDiff} days`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function SequenceRow({ sequence, customerName, propertyAddress, urgency, onClick }: SequenceRowProps) {
  const isPaused = sequence.status === 'paused';
  
  const toggleStatus = useToggleSequenceStatus();
  const sendNow = useSendNow();
  const skipStep = useSkipStep();
  const { data: events = [] } = useSequenceEvents(sequence.id);
  
  // Find the current step's event
  const currentEvent = events.find(e => e.stepNumber === sequence.currentStep);
  
  const handleTogglePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isPaused ? 'active' : 'paused';
    try {
      await toggleStatus.mutateAsync({ sequenceId: sequence.id, newStatus });
      toast.success(isPaused ? 'Sequence resumed' : 'Sequence paused');
    } catch {
      toast.error('Failed to update sequence');
    }
  };
  
  const handleSendNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentEvent) return;
    
    try {
      await sendNow.mutateAsync({
        sequenceId: sequence.id,
        eventId: currentEvent.id,
        currentStep: sequence.currentStep,
        totalSteps: sequence.totalSteps,
      });
      toast.success('Message sent!');
    } catch {
      toast.error('Failed to send message');
    }
  };
  
  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentEvent) return;
    
    try {
      await skipStep.mutateAsync({
        sequenceId: sequence.id,
        eventId: currentEvent.id,
        currentStep: sequence.currentStep,
        totalSteps: sequence.totalSteps,
      });
      toast.success('Step skipped');
    } catch {
      toast.error('Failed to skip step');
    }
  };
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-card/80 backdrop-blur-sm rounded-xl border border-border/50',
        'p-4 cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:shadow-black/10 hover:border-border',
        urgency === 'overdue' && 'border-rose-500/30 hover:border-rose-500/50',
        isPaused && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Customer Name */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">
              {customerName}
            </span>
            {isPaused && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                Paused
              </span>
            )}
          </div>
          
          {/* Property Address (shortened) */}
          <p className="text-xs text-muted-foreground truncate mb-1">
            {propertyAddress.split(',')[0]}
          </p>
          
          {/* Sequence Type & Progress */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{getSequenceTypeLabel(sequence.sequenceType)}</span>
            <span>·</span>
            <span>Step {sequence.currentStep}/{sequence.totalSteps}</span>
          </div>
          
          {/* Due Date */}
          <p className={cn(
            'text-sm mt-1',
            urgency === 'overdue' && 'text-rose-400',
            urgency === 'today' && 'text-amber-400',
            urgency === 'upcoming' && 'text-muted-foreground',
          )}>
            Due: {formatDueDate(sequence.nextActionAt)}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          {!isPaused && currentEvent && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-violet-500/20 hover:text-violet-400"
                onClick={handleSendNow}
                disabled={sendNow.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={handleSkip}
                disabled={skipStep.isPending}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={handleTogglePause}
            disabled={toggleStatus.isPending}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </Button>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
}
