import React, { useState } from 'react';
import { 
  Droplets, 
  Package, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Ruler,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoftenerInspection, SaltStatusType, SoftenerVisualCondition } from '@/types/technicianInspection';
import type { SoftenerQualityTier, ControlHead, VisualHeight } from '@/lib/softenerAlgorithm';
import { 
  TechnicianStepLayout, 
  StepCard,
  ChipOption
} from './TechnicianStepLayout';
import { Badge } from '@/components/ui/badge';

type SubStep = 'presence' | 'salt' | 'tier' | 'height' | 'control' | 'condition' | 'iron';

const QUALITY_TIERS: { value: SoftenerQualityTier; label: string; description: string }[] = [
  { value: 'CABINET', label: 'Cabinet', description: 'All-in-one' },
  { value: 'STANDARD', label: 'Standard', description: 'Separate tanks' },
  { value: 'PREMIUM', label: 'Premium', description: 'High capacity' },
];

const VISUAL_HEIGHTS: { value: VisualHeight; label: string; capacity: string }[] = [
  { value: 'KNEE', label: 'Knee', capacity: '~24k grains' },
  { value: 'WAIST', label: 'Waist', capacity: '~32k grains' },
  { value: 'CHEST', label: 'Chest', capacity: '~48k grains' },
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
  { value: 'NEW', label: 'Looks New', years: '<5 yrs' },
  { value: 'WEATHERED', label: 'Weathered', years: '5-10 yrs' },
  { value: 'AGED', label: 'Yellowed/Brittle', years: '10+ yrs' },
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
      return ['presence', 'salt', 'tier', 'height', 'control', 'condition', 'iron'];
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
      case 'tier':
        return data.qualityTier !== undefined;
      case 'height':
        return data.visualHeight !== undefined;
      case 'control':
        return data.controlHead !== undefined;
      case 'condition':
        return data.visualCondition !== undefined;
      case 'iron':
        return true; // Optional field
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
      case 'tier': return 'Quality Tier';
      case 'height': return 'Tank Height';
      case 'control': return 'Control Type';
      case 'condition': return 'Visual Condition';
      case 'iron': return 'Iron Staining';
      default: return 'Water Softener';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'presence': return <Droplets className="h-7 w-7" />;
      case 'salt': return <Package className="h-7 w-7" />;
      case 'tier': return <Settings className="h-7 w-7" />;
      case 'height': return <Ruler className="h-7 w-7" />;
      case 'control': return <Settings className="h-7 w-7" />;
      case 'condition': return <Eye className="h-7 w-7" />;
      case 'iron': return <AlertCircle className="h-7 w-7" />;
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

  const renderTierStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What type of softener system is it?
      </p>
      
      <div className="space-y-3">
        {QUALITY_TIERS.map((tier) => (
          <button
            key={tier.value}
            type="button"
            onClick={() => onUpdate({ qualityTier: tier.value })}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
              data.qualityTier === tier.value
                ? 'border-primary bg-primary/10'
                : 'border-muted hover:border-primary/50'
            )}
          >
            <div>
              <span className="font-semibold">{tier.label}</span>
              <p className="text-xs text-muted-foreground">{tier.description}</p>
            </div>
            {data.qualityTier === tier.value && (
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>
    </StepCard>
  );

  const renderHeightStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        How tall is the main resin tank?
      </p>
      
      <div className="space-y-3">
        {VISUAL_HEIGHTS.map((h) => (
          <button
            key={h.value}
            type="button"
            onClick={() => onUpdate({ visualHeight: h.value })}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
              data.visualHeight === h.value
                ? 'border-primary bg-primary/10'
                : 'border-muted hover:border-primary/50'
            )}
          >
            <div>
              <span className="font-semibold">{h.label} Height</span>
              <p className="text-xs text-muted-foreground">{h.capacity}</p>
            </div>
            {data.visualHeight === h.value && (
              <CheckCircle className="h-5 w-5 text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>
    </StepCard>
  );

  const renderControlStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What type of control head is on the unit?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {CONTROL_HEADS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onUpdate({ controlHead: c.value })}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
              data.controlHead === c.value
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50"
            )}
          >
            <Settings className={cn(
              "h-8 w-8",
              data.controlHead === c.value ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="font-semibold">{c.label}</span>
          </button>
        ))}
      </div>
    </StepCard>
  );

  const renderConditionStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What's the visual condition of the housing?
      </p>
      
      <div className="space-y-3">
        {VISUAL_CONDITIONS.map((cond) => (
          <button
            key={cond.value}
            type="button"
            onClick={() => onUpdate({ visualCondition: cond.value })}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
              data.visualCondition === cond.value
                ? 'border-primary bg-primary/10'
                : 'border-muted hover:border-muted-foreground/30'
            )}
          >
            <span className="font-medium">{cond.label}</span>
            <Badge variant="outline" className="shrink-0">
              {cond.years}
            </Badge>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        Estimates age based on housing condition
      </p>
    </StepCard>
  );

  const renderIronStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Any visible iron staining in fixtures?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onUpdate({ visualIron: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.visualIron === false
              ? "border-green-500 bg-green-50"
              : "border-muted hover:border-primary/50"
          )}
        >
          <CheckCircle className={cn(
            "h-8 w-8",
            data.visualIron === false ? "text-green-600" : "text-muted-foreground"
          )} />
          <span className="font-semibold">No Staining</span>
        </button>
        
        <button
          type="button"
          onClick={() => onUpdate({ visualIron: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.visualIron === true
              ? "border-amber-500 bg-amber-50"
              : "border-muted hover:border-primary/50"
          )}
        >
          <AlertCircle className={cn(
            "h-8 w-8",
            data.visualIron === true ? "text-amber-600" : "text-muted-foreground"
          )} />
          <span className="font-semibold">Iron Staining</span>
        </button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        This field is optional - skip if unsure
      </p>
    </StepCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'presence': return renderPresenceStep();
      case 'salt': return renderSaltStep();
      case 'tier': return renderTierStep();
      case 'height': return renderHeightStep();
      case 'control': return renderControlStep();
      case 'condition': return renderConditionStep();
      case 'iron': return renderIronStep();
      default: return null;
    }
  };

  const getContinueText = () => {
    if (currentSubStep === 'presence' && data.hasSoftener === false) {
      return 'Continue';
    }
    if (currentSubStep === 'iron') {
      return data.visualIron === undefined ? 'Skip' : 'Continue';
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
