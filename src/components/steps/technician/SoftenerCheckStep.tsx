import React from 'react';
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
  SectionHeader,
  ChipOption
} from './TechnicianStepLayout';
import { Badge } from '@/components/ui/badge';

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
  // Validation
  const presenceSelected = data.hasSoftener !== undefined;
  const saltSelected = data.saltStatus !== undefined;
  const tierSelected = data.qualityTier !== undefined;
  const heightSelected = data.visualHeight !== undefined;
  const controlSelected = data.controlHead !== undefined;
  const conditionSelected = data.visualCondition !== undefined;

  const allFieldsComplete = data.hasSoftener === false 
    ? presenceSelected 
    : presenceSelected && saltSelected && tierSelected && heightSelected && controlSelected && conditionSelected;

  const detailFields = [saltSelected, tierSelected, heightSelected, controlSelected, conditionSelected];
  const completedDetails = detailFields.filter(Boolean).length;
  const totalDetails = 5;

  const getContinueText = () => {
    if (allFieldsComplete) return 'Continue';
    if (data.hasSoftener) return `Complete all fields (${completedDetails}/${totalDetails})`;
    return 'Select softener presence';
  };

  return (
    <TechnicianStepLayout
      icon={<Droplets className="h-8 w-8" />}
      title="Water Softener Check"
      subtitle={data.hasSoftener ? `Verify each field • ${completedDetails}/${totalDetails} complete` : 'Confirm softener presence'}
      onContinue={onNext}
      continueDisabled={!allFieldsComplete}
      continueText={getContinueText()}
    >
      {/* Primary Yes/No Selection */}
      <div className="space-y-3">
        <SectionHeader icon={<Droplets className="h-3.5 w-3.5" />} title="Softener Present" isComplete={presenceSelected} isRequired />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate({ hasSoftener: true })}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
              data.hasSoftener === true
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50 bg-card"
            )}
          >
            <CheckCircle className={cn("h-8 w-8", data.hasSoftener === true ? 'text-primary' : 'text-muted-foreground')} />
            <span className="font-semibold">Yes</span>
            <span className="text-xs text-muted-foreground">Softener present</span>
          </button>
          
          <button
            type="button"
            onClick={() => onUpdate({ hasSoftener: false })}
            className={cn(
              "flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
              data.hasSoftener === false
                ? "border-muted-foreground bg-muted"
                : "border-muted hover:border-primary/50 bg-card"
            )}
          >
            <XCircle className={cn("h-8 w-8", data.hasSoftener === false ? 'text-muted-foreground' : 'text-muted-foreground/50')} />
            <span className="font-semibold">No</span>
            <span className="text-xs text-muted-foreground">No softener</span>
          </button>
        </div>
      </div>
      
      {/* Softener Details */}
      {data.hasSoftener && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Progress bar */}
          <div className="flex gap-1">
            {detailFields.map((complete, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  complete ? "bg-green-500" : "bg-muted"
                )} 
              />
            ))}
          </div>

          {/* Salt Status */}
          <StepCard>
            <SectionHeader icon={<Package className="h-3.5 w-3.5" />} title="Salt Status" isComplete={saltSelected} isRequired />
            <div className="flex gap-2">
              {SALT_OPTIONS.map((opt) => (
                <ChipOption
                  key={opt.value}
                  label={opt.label}
                  selected={data.saltStatus === opt.value}
                  onClick={() => onUpdate({ saltStatus: opt.value })}
                  variant={data.saltStatus === opt.value ? opt.variant : 'default'}
                />
              ))}
            </div>
          </StepCard>

          {/* Quality Tier */}
          <StepCard>
            <SectionHeader icon={<Settings className="h-3.5 w-3.5" />} title="Quality Tier" isComplete={tierSelected} isRequired />
            <div className="flex gap-2">
              {QUALITY_TIERS.map((tier) => (
                <ChipOption
                  key={tier.value}
                  label={tier.label}
                  sublabel={tier.description}
                  selected={data.qualityTier === tier.value}
                  onClick={() => onUpdate({ qualityTier: tier.value })}
                />
              ))}
            </div>
          </StepCard>

          {/* Tank Height */}
          <StepCard>
            <SectionHeader icon={<Ruler className="h-3.5 w-3.5" />} title="Tank Height" isComplete={heightSelected} isRequired />
            <div className="flex gap-2">
              {VISUAL_HEIGHTS.map((h) => (
                <ChipOption
                  key={h.value}
                  label={h.label}
                  sublabel={h.capacity}
                  selected={data.visualHeight === h.value}
                  onClick={() => onUpdate({ visualHeight: h.value })}
                />
              ))}
            </div>
          </StepCard>

          {/* Control Head */}
          <StepCard>
            <SectionHeader icon={<Settings className="h-3.5 w-3.5" />} title="Control Type" isComplete={controlSelected} isRequired />
            <div className="flex gap-2">
              {CONTROL_HEADS.map((c) => (
                <ChipOption
                  key={c.value}
                  label={c.label}
                  selected={data.controlHead === c.value}
                  onClick={() => onUpdate({ controlHead: c.value })}
                />
              ))}
            </div>
          </StepCard>

          {/* Visual Condition */}
          <StepCard>
            <SectionHeader icon={<Eye className="h-3.5 w-3.5" />} title="Visual Condition" isComplete={conditionSelected} isRequired />
            <div className="space-y-2">
              {VISUAL_CONDITIONS.map((cond) => (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => onUpdate({ visualCondition: cond.value })}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                    data.visualCondition === cond.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <span className="font-medium text-sm">{cond.label}</span>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {cond.years}
                  </Badge>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimates age based on housing condition
            </p>
          </StepCard>

          {/* Optional: Iron staining */}
          <StepCard>
            <SectionHeader icon={<AlertCircle className="h-3.5 w-3.5" />} title="Iron Staining" isComplete={data.visualIron !== undefined} />
            <div className="flex gap-2">
              <ChipOption
                label="No Staining"
                selected={data.visualIron === false}
                onClick={() => onUpdate({ visualIron: false })}
                variant={data.visualIron === false ? 'success' : 'default'}
              />
              <ChipOption
                label="Iron Staining"
                selected={data.visualIron === true}
                onClick={() => onUpdate({ visualIron: true })}
                variant={data.visualIron === true ? 'warning' : 'default'}
              />
            </div>
          </StepCard>
        </div>
      )}
    </TechnicianStepLayout>
  );
}
