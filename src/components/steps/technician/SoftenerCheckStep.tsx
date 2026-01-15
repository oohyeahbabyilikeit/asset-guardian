import React, { useState } from 'react';
import { 
  Droplets, 
  Package, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { SoftenerInspection, SaltStatusType, SoftenerVisualCondition } from '@/types/technicianInspection';
import type { SoftenerQualityTier, ControlHead, VisualHeight } from '@/lib/softenerAlgorithm';
import { 
  TechnicianStepLayout, 
  StepCard,
  ChipOption
} from './TechnicianStepLayout';
import { Badge } from '@/components/ui/badge';

// Consolidated: type-info = tier + control, visual-check = height + condition + iron
type SubStep = 'presence' | 'salt' | 'type-info' | 'visual-check';

const QUALITY_TIERS: { value: SoftenerQualityTier; label: string; description: string }[] = [
  { value: 'CABINET', label: 'Cabinet', description: 'All-in-one' },
  { value: 'STANDARD', label: 'Standard', description: 'Separate tanks' },
  { value: 'PREMIUM', label: 'Premium', description: 'High capacity' },
];

const VISUAL_HEIGHTS: { value: VisualHeight; label: string; capacity: string }[] = [
  { value: 'KNEE', label: 'Knee', capacity: '~24k' },
  { value: 'WAIST', label: 'Waist', capacity: '~32k' },
  { value: 'CHEST', label: 'Chest', capacity: '~48k' },
];

const CONTROL_HEADS: { value: ControlHead; label: string }[] = [
  { value: 'DIGITAL', label: 'Digital' },
  { value: 'ANALOG', label: 'Analog' },
];

const SALT_OPTIONS: { value: SaltStatusType; label: string; variant: 'success' | 'danger' | 'default' }[] = [
  { value: 'OK', label: 'OK', variant: 'success' },
  { value: 'EMPTY', label: 'Empty', variant: 'danger' },
  { value: 'UNKNOWN', label: "Can't Check", variant: 'default' },
];

const VISUAL_CONDITIONS: { value: SoftenerVisualCondition; label: string; years: string }[] = [
  { value: 'NEW', label: 'New', years: '<5 yrs' },
  { value: 'WEATHERED', label: 'Weathered', years: '5-10 yrs' },
  { value: 'AGED', label: 'Aged', years: '10+ yrs' },
];

interface SoftenerCheckStepProps {
  data: SoftenerInspection;
  onUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

export function SoftenerCheckStep({ data, onUpdate, onNext }: SoftenerCheckStepProps) {
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('presence');
  
  // Dynamic sub-steps - only show details if softener is present
  const getSubSteps = (): SubStep[] => {
    if (data.hasSoftener === false) {
      return ['presence'];
    }
    if (data.hasSoftener === true) {
      return ['presence', 'salt', 'type-info', 'visual-check'];
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
      case 'type-info':
        return data.qualityTier !== undefined && data.controlHead !== undefined;
      case 'visual-check':
        return data.visualHeight !== undefined && data.visualCondition !== undefined;
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
      case 'type-info': return 'System Type';
      case 'visual-check': return 'Visual Inspection';
      default: return 'Water Softener';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'presence': return <Droplets className="h-7 w-7" />;
      case 'salt': return <Package className="h-7 w-7" />;
      case 'type-info': return <Settings className="h-7 w-7" />;
      case 'visual-check': return <Eye className="h-7 w-7" />;
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
          <p className="text-sm text-destructive">Empty salt means no water conditioning</p>
        </div>
      )}
    </StepCard>
  );

  // Combined tier + control
  const renderTypeInfoStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      {/* Section 1: Quality Tier */}
      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-3">System Type</p>
        <div className="grid grid-cols-3 gap-2">
          {QUALITY_TIERS.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => onUpdate({ qualityTier: tier.value })}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                data.qualityTier === tier.value
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <span className="font-semibold text-sm">{tier.label}</span>
              <span className="text-[10px] text-muted-foreground">{tier.description}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Section 2: Control Head */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">Control Head</p>
        <div className="grid grid-cols-2 gap-3">
          {CONTROL_HEADS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onUpdate({ controlHead: c.value })}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                data.controlHead === c.value
                  ? "border-primary bg-primary/10"
                  : "border-muted hover:border-primary/50"
              )}
            >
              <Settings className={cn(
                "h-7 w-7",
                data.controlHead === c.value ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </StepCard>
  );

  // Combined height + condition + iron
  const renderVisualCheckStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      {/* Section 1: Tank Height */}
      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-3">Tank Height</p>
        <div className="grid grid-cols-3 gap-2">
          {VISUAL_HEIGHTS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => onUpdate({ visualHeight: h.value })}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                data.visualHeight === h.value
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              <span className="font-semibold text-sm">{h.label}</span>
              <span className="text-[10px] text-muted-foreground">{h.capacity}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Section 2: Visual Condition */}
      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-3">Housing Condition</p>
        <div className="grid grid-cols-3 gap-2">
          {VISUAL_CONDITIONS.map((cond) => (
            <button
              key={cond.value}
              type="button"
              onClick={() => onUpdate({ visualCondition: cond.value })}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center",
                data.visualCondition === cond.value
                  ? 'border-primary bg-primary/10'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <span className="font-semibold text-sm">{cond.label}</span>
              <span className="text-[10px] text-muted-foreground">{cond.years}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Section 3: Iron Staining (optional) */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">Iron staining in fixtures? <span className="text-muted-foreground/60">(optional)</span></p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate({ visualIron: false })}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
              data.visualIron === false
                ? "border-green-500 bg-green-50"
                : "border-muted hover:border-primary/50"
            )}
          >
            <CheckCircle className={cn(
              "h-6 w-6",
              data.visualIron === false ? "text-green-600" : "text-muted-foreground"
            )} />
            <span className="font-semibold text-sm">No</span>
          </button>
          
          <button
            type="button"
            onClick={() => onUpdate({ visualIron: true })}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
              data.visualIron === true
                ? "border-amber-500 bg-amber-50"
                : "border-muted hover:border-primary/50"
            )}
          >
            <AlertCircle className={cn(
              "h-6 w-6",
              data.visualIron === true ? "text-amber-600" : "text-muted-foreground"
            )} />
            <span className="font-semibold text-sm">Yes</span>
          </button>
        </div>
      </div>
    </StepCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'presence': return renderPresenceStep();
      case 'salt': return renderSaltStep();
      case 'type-info': return renderTypeInfoStep();
      case 'visual-check': return renderVisualCheckStep();
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
