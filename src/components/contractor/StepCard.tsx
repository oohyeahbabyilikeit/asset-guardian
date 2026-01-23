import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Check, 
  Clock, 
  FastForward,
  Play,
  SkipForward,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  type SequenceEvent,
  getActionTypeLabel,
  formatScheduledDate 
} from '@/hooks/useSequenceEvents';
import { format } from 'date-fns';

interface StepCardProps {
  stepNumber: number;
  day: number;
  actionType: 'sms' | 'email' | 'call_reminder';
  message: string;
  event?: SequenceEvent;
  isCurrentStep: boolean;
  onSendNow?: () => void;
  onSkip?: () => void;
  isSending?: boolean;
  isSkipping?: boolean;
}

const actionIcons = {
  sms: MessageSquare,
  email: Mail,
  call_reminder: Phone,
};

export function StepCard({
  stepNumber,
  day,
  actionType,
  message,
  event,
  isCurrentStep,
  onSendNow,
  onSkip,
  isSending,
  isSkipping,
}: StepCardProps) {
  const Icon = actionIcons[actionType] || MessageSquare;
  const label = getActionTypeLabel(actionType);
  
  // Determine step status
  const isCompleted = event?.status === 'sent';
  const isSkipped = event?.status === 'skipped';
  const isFailed = event?.status === 'failed';
  const isPending = !event || event.status === 'pending';
  
  // Calculate scheduled date text
  const scheduledText = event 
    ? formatScheduledDate(event.scheduledAt) 
    : `Day ${day}`;
  
  // Execution info
  const executedText = event?.executedAt 
    ? format(event.executedAt, 'MMM d, h:mm a')
    : null;
  
  return (
    <div className={cn(
      'relative pl-8 pb-6',
      // Timeline line
      'before:absolute before:left-[11px] before:top-6 before:bottom-0 before:w-0.5',
      isCompleted || isSkipped 
        ? 'before:bg-border' 
        : 'before:bg-border/50 before:border-dashed',
    )}>
      {/* Timeline dot */}
      <div className={cn(
        'absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center',
        isCompleted && 'bg-emerald-500',
        isSkipped && 'bg-muted',
        isFailed && 'bg-red-500',
        isCurrentStep && isPending && 'bg-violet-500 ring-2 ring-violet-500/30',
        !isCurrentStep && isPending && 'bg-muted border border-border',
      )}>
        {isCompleted && <Check className="w-3 h-3 text-white" />}
        {isSkipped && <SkipForward className="w-3 h-3 text-muted-foreground" />}
        {isFailed && <AlertCircle className="w-3 h-3 text-white" />}
        {isCurrentStep && isPending && <FastForward className="w-3 h-3 text-white" />}
        {!isCurrentStep && isPending && <Clock className="w-3 h-3 text-muted-foreground" />}
      </div>
      
      {/* Step content */}
      <div className={cn(
        'rounded-lg border p-3',
        isCurrentStep && isPending && 'border-violet-500/30 bg-violet-500/5',
        isCompleted && 'border-emerald-500/20 bg-emerald-500/5',
        isSkipped && 'border-border bg-muted/30',
        isFailed && 'border-red-500/20 bg-red-500/5',
        !isCurrentStep && isPending && 'border-border/50',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-medium px-1.5 py-0.5 rounded',
              actionType === 'sms' && 'bg-sky-500/20 text-sky-300',
              actionType === 'email' && 'bg-amber-500/20 text-amber-300',
              actionType === 'call_reminder' && 'bg-emerald-500/20 text-emerald-300',
            )}>
              <Icon className="w-3 h-3 inline mr-1" />
              {label}
            </span>
            <span className="text-xs text-muted-foreground">
              Day {day}
            </span>
          </div>
          
          <span className={cn(
            'text-xs',
            isCurrentStep && isPending ? 'text-violet-300' : 'text-muted-foreground'
          )}>
            {isCompleted || isSkipped ? executedText : scheduledText}
          </span>
        </div>
        
        {/* Message preview */}
        <p className="text-sm text-foreground/80 line-clamp-2 mb-2">
          "{message}"
        </p>
        
        {/* Status & Actions */}
        {isCompleted && event && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Check className="w-3 h-3" />
            <span>Delivered</span>
            {event.openedAt && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>Opened</span>
              </>
            )}
          </div>
        )}
        
        {isSkipped && (
          <div className="text-xs text-muted-foreground">
            Skipped
          </div>
        )}
        
        {isFailed && (
          <div className="text-xs text-red-400">
            Failed to send
          </div>
        )}
        
        {/* Actions for current step */}
        {isCurrentStep && isPending && (
          <div className="flex items-center gap-2 mt-2">
            <Button 
              size="sm" 
              variant="default"
              className="h-7 text-xs gap-1"
              onClick={onSendNow}
              disabled={isSending || isSkipping}
            >
              <Play className="w-3 h-3" />
              {isSending ? 'Sending...' : 'Send Now'}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={onSkip}
              disabled={isSending || isSkipping}
            >
              {isSkipping ? 'Skipping...' : 'Skip'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
