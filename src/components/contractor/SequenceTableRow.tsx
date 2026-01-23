import { useState } from 'react';
import { 
  Pause, 
  Play, 
  SkipForward, 
  StopCircle,
  Eye,
  MousePointerClick,
  Loader2,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  type EnrichedSequence,
  getSequenceTypeLabel,
  useToggleSequenceStatus,
} from '@/hooks/useNurturingSequences';
import { useSequenceEvents, useSkipStep, useStopSequence } from '@/hooks/useSequenceEvents';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface SequenceTableRowProps {
  sequence: EnrichedSequence;
  onRowClick: () => void;
}

export function SequenceTableRow({ sequence, onRowClick }: SequenceTableRowProps) {
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  
  const toggleStatus = useToggleSequenceStatus();
  const stopSequence = useStopSequence();
  const skipStep = useSkipStep();
  const { data: events = [] } = useSequenceEvents(sequence.id);
  
  // Find current event and check engagement
  const currentEvent = events.find(e => e.stepNumber === sequence.currentStep);
  const latestSentEvent = events
    .filter(e => e.status === 'sent')
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())[0];
  
  const hasOpened = latestSentEvent?.openedAt != null;
  const hasClicked = latestSentEvent?.clickedAt != null;
  
  // Count total clicks across all events - high interest if 2+
  const totalClicks = events.filter(e => e.clickedAt != null).length;
  const isHighInterest = totalClicks >= 2 && sequence.status === 'active';
  
  const isPaused = sequence.status === 'paused';

  // Format next touchpoint
  const formatNextTouchpoint = (date: Date | null): string => {
    if (!date) return '—';
    if (isPast(date) && !isToday(date)) return 'Overdue';
    if (isToday(date)) return `Today @ ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow @ ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d @ h:mm a');
  };

  // Handlers
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

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentEvent) {
      toast.error('No current step to skip');
      return;
    }
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

  const handleStop = async () => {
    try {
      await stopSequence.mutateAsync({
        sequenceId: sequence.id,
        reason: 'Customer booked',
      });
      toast.success('Sequence stopped');
      setStopDialogOpen(false);
    } catch {
      toast.error('Failed to stop sequence');
    }
  };

  const handleStopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStopDialogOpen(true);
  };

  // Status indicator
  const StatusIndicator = () => {
    if (sequence.status === 'paused') {
      return <span className="w-2 h-2 rounded-full bg-amber-400" title="Paused" />;
    }
    // Could add error state detection here
    return <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active" />;
  };

  return (
    <>
      <TableRow 
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          isPaused && 'opacity-60',
        )}
        onClick={onRowClick}
      >
        {/* Address / Customer */}
        <TableCell className="font-medium">
          <div className="max-w-[200px]">
            <div className="truncate text-foreground">{sequence.propertyAddress}</div>
            <div className="truncate text-xs text-muted-foreground">{sequence.customerName}</div>
          </div>
        </TableCell>

        {/* Sequence Type */}
        <TableCell>
          <span className="text-sm">{getSequenceTypeLabel(sequence.sequenceType)}</span>
        </TableCell>

        {/* Current Step */}
        <TableCell>
          <span className="text-sm text-muted-foreground">
            Step {sequence.currentStep} of {sequence.totalSteps}
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          <div className="flex items-center gap-2">
            <StatusIndicator />
            <span className="text-xs capitalize">{sequence.status}</span>
          </div>
        </TableCell>

        {/* Engagement Icons */}
        <TableCell>
          <TooltipProvider>
            <div className="flex items-center gap-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Eye 
                      className={cn(
                        'w-4 h-4 transition-colors',
                        hasOpened 
                          ? 'text-sky-400' 
                          : 'text-muted-foreground/30',
                      )}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hasOpened ? 'Opened' : 'Not opened'}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <MousePointerClick 
                      className={cn(
                        'w-4 h-4 transition-colors',
                        hasClicked 
                          ? 'text-violet-400' 
                          : 'text-muted-foreground/30',
                      )}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hasClicked ? 'Clicked' : 'Not clicked'}</p>
                </TooltipContent>
              </Tooltip>
              {/* High Interest Nudge */}
              {isHighInterest && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs ml-1">
                      <Flame className="w-3 h-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">High Interest</p>
                    <p className="text-xs text-muted-foreground">Did they book? Verify status.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </TableCell>

        {/* Next Touchpoint */}
        <TableCell>
          <span className={cn(
            'text-sm',
            sequence.nextActionAt && isPast(sequence.nextActionAt) && !isToday(sequence.nextActionAt)
              ? 'text-rose-400'
              : 'text-muted-foreground',
          )}>
            {formatNextTouchpoint(sequence.nextActionAt)}
          </span>
        </TableCell>

        {/* Actions */}
        <TableCell>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleTogglePause}
              disabled={toggleStatus.isPending}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {toggleStatus.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isPaused ? (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSkip}
              disabled={skipStep.isPending || isPaused || !currentEvent}
              title="Skip Step"
            >
              {skipStep.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SkipForward className="w-3.5 h-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:text-rose-400"
              onClick={handleStopClick}
              title="Stop"
            >
              <StopCircle className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately stop all automated outreach for{' '}
              <span className="font-medium text-foreground">
                {sequence.customerName}
              </span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStop}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={stopSequence.isPending}
            >
              {stopSequence.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Stop Sequence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
