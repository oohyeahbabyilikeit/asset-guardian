import { type SequenceStep, type NurturingSequence } from '@/hooks/useNurturingSequences';
import { type SequenceEvent } from '@/hooks/useSequenceEvents';
import { StepCard } from './StepCard';

interface StepTimelineProps {
  steps: SequenceStep[];
  sequence: NurturingSequence;
  events: SequenceEvent[];
  onSendNow: (stepNumber: number, eventId: string) => void;
  onSkip: (stepNumber: number, eventId: string) => void;
  isSending?: boolean;
  isSkipping?: boolean;
}

export function StepTimeline({
  steps,
  sequence,
  events,
  onSendNow,
  onSkip,
  isSending,
  isSkipping,
}: StepTimelineProps) {
  // Create a map of events by step number
  const eventsByStep = events.reduce((acc, event) => {
    acc[event.stepNumber] = event;
    return acc;
  }, {} as Record<number, SequenceEvent>);
  
  return (
    <div className="py-2">
      {steps.map((step, index) => {
        const event = eventsByStep[step.step];
        const isCurrentStep = step.step === sequence.currentStep;
        
        return (
          <StepCard
            key={step.step}
            stepNumber={step.step}
            day={step.day}
            actionType={step.action}
            message={step.message}
            event={event}
            isCurrentStep={isCurrentStep}
            onSendNow={event ? () => onSendNow(step.step, event.id) : undefined}
            onSkip={event ? () => onSkip(step.step, event.id) : undefined}
            isSending={isSending && isCurrentStep}
            isSkipping={isSkipping && isCurrentStep}
          />
        );
      })}
    </div>
  );
}
