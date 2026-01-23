import { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  X, 
  Pause, 
  Play, 
  Square, 
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StepTimeline } from './StepTimeline';
import { 
  type NurturingSequence, 
  type SequenceTemplate,
  getSequenceTypeLabel,
  useToggleSequenceStatus,
  useSequenceTemplates,
} from '@/hooks/useNurturingSequences';
import { 
  useSequenceEvents, 
  useSendNow, 
  useSkipStep,
  useStopSequence,
  useMarkOutcome,
} from '@/hooks/useSequenceEvents';
import { toast } from 'sonner';
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

interface SequenceControlDrawerProps {
  open: boolean;
  onClose: () => void;
  sequence: NurturingSequence;
  customerName: string;
  propertyAddress: string;
}

export function SequenceControlDrawer({
  open,
  onClose,
  sequence,
  customerName,
  propertyAddress,
}: SequenceControlDrawerProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState<'converted' | 'lost' | null>(null);
  
  // Fetch template to get step details
  const { data: templates = [] } = useSequenceTemplates();
  const template = templates.find(t => 
    t.triggerType === sequence.sequenceType || 
    t.name.toLowerCase().includes(sequence.sequenceType.replace('_', ' '))
  );
  const steps = template?.steps || [];
  
  // Fetch events for this sequence
  const { data: events = [] } = useSequenceEvents(sequence.id);
  
  // Mutations
  const toggleStatus = useToggleSequenceStatus();
  const sendNow = useSendNow();
  const skipStep = useSkipStep();
  const stopSequence = useStopSequence();
  const markOutcome = useMarkOutcome();
  
  const isActive = sequence.status === 'active';
  const isPaused = sequence.status === 'paused';
  const isCompleted = sequence.status === 'completed';
  const isCancelled = sequence.status === 'cancelled';
  
  const handleTogglePause = async () => {
    const newStatus = isActive ? 'paused' : 'active';
    try {
      await toggleStatus.mutateAsync({ 
        sequenceId: sequence.id, 
        newStatus 
      });
      toast.success(newStatus === 'paused' ? 'Sequence paused' : 'Sequence resumed');
    } catch {
      toast.error('Failed to update sequence');
    }
  };
  
  const handleStop = async () => {
    try {
      await stopSequence.mutateAsync({ sequenceId: sequence.id });
      toast.success('Sequence stopped');
      setShowStopConfirm(false);
      onClose();
    } catch {
      toast.error('Failed to stop sequence');
    }
  };
  
  const handleSendNow = async (stepNumber: number, eventId: string) => {
    try {
      await sendNow.mutateAsync({
        sequenceId: sequence.id,
        eventId,
        currentStep: sequence.currentStep,
        totalSteps: sequence.totalSteps,
      });
      toast.success('Message sent!');
    } catch {
      toast.error('Failed to send message');
    }
  };
  
  const handleSkip = async (stepNumber: number, eventId: string) => {
    try {
      await skipStep.mutateAsync({
        sequenceId: sequence.id,
        eventId,
        currentStep: sequence.currentStep,
        totalSteps: sequence.totalSteps,
      });
      toast.success('Step skipped');
    } catch {
      toast.error('Failed to skip step');
    }
  };
  
  const handleMarkOutcome = async (outcome: 'converted' | 'lost') => {
    try {
      await markOutcome.mutateAsync({
        sequenceId: sequence.id,
        outcome,
        currentStep: sequence.currentStep,
      });
      toast.success(outcome === 'converted' ? 'Marked as converted!' : 'Marked as lost');
      setShowOutcomeDialog(null);
      onClose();
    } catch {
      toast.error('Failed to update outcome');
    }
  };
  
  return (
    <>
      <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" />
                  Nurturing Sequence
                </DrawerTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {customerName} · {propertyAddress.split(',')[0]}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>
          
          <ScrollArea className="flex-1 px-4">
            {/* Sequence Status */}
            <div className="py-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {getSequenceTypeLabel(sequence.sequenceType)}
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  isActive && 'bg-violet-500/20 text-violet-300',
                  isPaused && 'bg-amber-500/20 text-amber-300',
                  isCompleted && 'bg-emerald-500/20 text-emerald-300',
                  isCancelled && 'bg-muted text-muted-foreground',
                )}>
                  {isActive && 'Active'}
                  {isPaused && 'Paused'}
                  {isCompleted && 'Completed'}
                  {isCancelled && 'Cancelled'}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Step {sequence.currentStep} of {sequence.totalSteps}
                {sequence.nextActionAt && isActive && (
                  <> · Next action: {sequence.nextActionAt.toLocaleDateString()}</>
                )}
              </p>
            </div>
            
            {/* Step Timeline */}
            <div className="py-4">
              <h4 className="text-sm font-medium mb-3">Timeline</h4>
              {steps.length > 0 ? (
                <StepTimeline
                  steps={steps}
                  sequence={sequence}
                  events={events}
                  onSendNow={handleSendNow}
                  onSkip={handleSkip}
                  isSending={sendNow.isPending}
                  isSkipping={skipStep.isPending}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>Template details not available</p>
                  <p className="text-xs mt-1">
                    {sequence.totalSteps} steps in this sequence
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Actions Footer */}
          <div className="border-t border-border p-4 space-y-3">
            {/* Status Controls */}
            {(isActive || isPaused) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleTogglePause}
                  disabled={toggleStatus.isPending}
                >
                  {isActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => setShowStopConfirm(true)}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </div>
            )}
            
            {/* Outcome Controls */}
            {(isActive || isPaused) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowOutcomeDialog('converted')}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Converted
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-muted-foreground"
                  onClick={() => setShowOutcomeDialog('lost')}
                >
                  <XCircle className="w-4 h-4" />
                  Mark Lost
                </Button>
              </div>
            )}
            
            {/* Restart for completed/cancelled */}
            {(isCompleted || isCancelled) && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  // TODO: Implement restart - opens start modal
                  toast.info('Restart coming soon');
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Start New Sequence
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Stop Confirmation Dialog */}
      <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently stop the nurturing sequence for {customerName}. 
              No more automated messages will be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStop}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Stop Sequence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Outcome Dialog */}
      <AlertDialog 
        open={!!showOutcomeDialog} 
        onOpenChange={() => setShowOutcomeDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showOutcomeDialog === 'converted' 
                ? 'Mark as Converted?' 
                : 'Mark as Lost?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showOutcomeDialog === 'converted' 
                ? `This will mark ${customerName} as a successful conversion and complete the sequence.`
                : `This will mark ${customerName} as lost and stop the sequence.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showOutcomeDialog && handleMarkOutcome(showOutcomeDialog)}
              className={showOutcomeDialog === 'converted' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
