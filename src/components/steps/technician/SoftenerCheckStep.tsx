import React, { useState } from 'react';
import { 
  Droplets, 
  Package, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoftenerInspection, SaltStatusType } from '@/types/technicianInspection';
import { 
  TechnicianStepLayout, 
  StepCard
} from './TechnicianStepLayout';

// SIMPLIFIED: Only 2 sub-steps (Gatekeeper approach)
type SubStep = 'presence' | 'salt';

const SALT_OPTIONS: { value: SaltStatusType; label: string; variant: 'success' | 'danger' | 'default' }[] = [
  { value: 'OK', label: 'OK', variant: 'success' },
  { value: 'EMPTY', label: 'Empty', variant: 'danger' },
  { value: 'UNKNOWN', label: "Can't Check", variant: 'default' },
];

interface SoftenerCheckStepProps {
  data: SoftenerInspection;
  onUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

export function SoftenerCheckStep({ data, onUpdate, onNext }: SoftenerCheckStepProps) {
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('presence');
  
  // Dynamic sub-steps - only show salt check if softener is present
  const getSubSteps = (): SubStep[] => {
    if (data.hasSoftener === false) {
      return ['presence'];
    }
    if (data.hasSoftener === true) {
      return ['presence', 'salt'];
    }
    return ['presence'];
  };
  
  const subSteps = getSubSteps();
  const currentIndex = subSteps.indexOf(currentSubStep);

  const canProceed = (): boolean => {
    switch (currentSubStep) {
      case 'presence':
        return data.hasSoftener !== undefined;
      case 'salt':
        return data.saltStatus !== undefined;
      default:
        return false;
    }
  };

  const handleNext = () => {
    // If no softener, skip to end
    if (currentSubStep === 'presence' && data.hasSoftener === false) {
      onNext();
      return;
    }
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < subSteps.length) {
      setCurrentSubStep(subSteps[nextIndex]);
    } else {
      onNext();
    }
  };

  const getStepTitle = (): string => {
    switch (currentSubStep) {
      case 'presence': return 'Softener Present?';
      case 'salt': return 'Salt Status';
      default: return 'Water Softener';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'presence': return <Droplets className="h-7 w-7" />;
      case 'salt': return <Package className="h-7 w-7" />;
      default: return <Droplets className="h-7 w-7" />;
    }
  };

  // Progress dots
  const renderProgress = () => (
    <div className="flex justify-center gap-2 mb-6">
      {subSteps.map((step, index) => (
        <button
          key={step}
          onClick={() => index < currentIndex && setCurrentSubStep(step)}
          disabled={index >= currentIndex}
          className={cn(
            "h-2 rounded-full transition-all",
            index === currentIndex ? "w-8 bg-primary" : "w-2",
            index < currentIndex ? "bg-primary/60 cursor-pointer hover:bg-primary/80" : "bg-muted cursor-default"
          )}
        />
      ))}
    </div>
  );

  const renderPresenceStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is there a water softener at this property?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onUpdate({ hasSoftener: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.hasSoftener === true
              ? "border-primary bg-primary/10"
              : "border-muted hover:border-primary/50 bg-card"
          )}
        >
          <CheckCircle className={cn("h-10 w-10", data.hasSoftener === true ? 'text-primary' : 'text-muted-foreground')} />
          <span className="font-semibold text-lg">Yes</span>
          <span className="text-xs text-muted-foreground">Softener present</span>
        </button>
        
        <button
          type="button"
          onClick={() => onUpdate({ hasSoftener: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.hasSoftener === false
              ? "border-muted-foreground bg-muted"
              : "border-muted hover:border-primary/50 bg-card"
          )}
        >
          <XCircle className={cn("h-10 w-10", data.hasSoftener === false ? 'text-muted-foreground' : 'text-muted-foreground/50')} />
          <span className="font-semibold text-lg">No</span>
          <span className="text-xs text-muted-foreground">No softener</span>
        </button>
      </div>
    </StepCard>
  );

  const renderSaltStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Check the salt level in the brine tank
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {SALT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onUpdate({ saltStatus: opt.value })}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              data.saltStatus === opt.value
                ? opt.variant === 'success' ? "border-green-500 bg-green-50 text-green-700"
                : opt.variant === 'danger' ? "border-red-500 bg-red-50 text-red-700"
                : "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            )}
          >
            <span className="text-lg font-semibold">{opt.label}</span>
          </button>
        ))}
      </div>
      
      {data.saltStatus === 'EMPTY' && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Empty salt = no water conditioning</p>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-muted/50 rounded-xl">
        <p className="text-xs text-muted-foreground text-center">
          💡 The test strip result (in Pressure step) tells us if the softener is actually working
        </p>
      </div>
    </StepCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'presence': return renderPresenceStep();
      case 'salt': return renderSaltStep();
      default: return null;
    }
  };

  const getContinueText = () => {
    if (currentSubStep === 'presence' && data.hasSoftener === false) {
      return 'Continue';
    }
    return currentIndex === subSteps.length - 1 ? 'Continue' : 'Next';
  };

  return (
    <TechnicianStepLayout
      icon={getStepIcon()}
      title={getStepTitle()}
      subtitle={data.hasSoftener === false ? 'No softener at property' : `Step ${currentIndex + 1} of ${subSteps.length}`}
      onContinue={handleNext}
      continueDisabled={!canProceed()}
      continueText={getContinueText()}
    >
      {renderProgress()}
      {renderCurrentSubStep()}
    </TechnicianStepLayout>
  );
}
