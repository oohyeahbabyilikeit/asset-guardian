import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Package, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Circle,
  Ruler,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoftenerInspection, SaltStatusType, SoftenerVisualCondition } from '@/types/technicianInspection';
import type { SoftenerQualityTier, ControlHead, VisualHeight } from '@/lib/softenerAlgorithm';

/**
 * SoftenerCheckStep v8.1 - "Required Verification" Pattern
 * 
 * NO relying on photo scan alone. Every field requires explicit selection.
 * Photo scan can pre-fill suggestions, but tech must confirm.
 */

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

const SALT_OPTIONS: { value: SaltStatusType; label: string; color: 'green' | 'red' | 'gray' }[] = [
  { value: 'OK', label: 'OK', color: 'green' },
  { value: 'EMPTY', label: 'Empty', color: 'red' },
  { value: 'UNKNOWN', label: "Can't Check", color: 'gray' },
];

const VISUAL_CONDITIONS: { value: SoftenerVisualCondition; label: string; years: string }[] = [
  { value: 'NEW', label: 'Looks New', years: '<5 yrs' },
  { value: 'WEATHERED', label: 'Weathered', years: '5-10 yrs' },
  { value: 'AGED', label: 'Yellowed/Brittle', years: '10+ yrs' },
];

// Category header with completion status
function CategoryHeader({ 
  icon, 
  title, 
  isComplete,
  isRequired = true
}: { 
  icon: React.ReactNode; 
  title: string; 
  isComplete: boolean;
  isRequired?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {icon}
        {title}
        {isRequired && <span className="text-red-500">*</span>}
      </Label>
      {isComplete ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40" />
      )}
    </div>
  );
}

interface SoftenerCheckStepProps {
  data: SoftenerInspection;
  onUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

export function SoftenerCheckStep({ data, onUpdate, onNext }: SoftenerCheckStepProps) {
  // Validation - each field must be explicitly answered when softener is present
  const presenceSelected = data.hasSoftener !== undefined;
  const saltSelected = data.saltStatus !== undefined;
  const tierSelected = data.qualityTier !== undefined;
  const heightSelected = data.visualHeight !== undefined;
  const controlSelected = data.controlHead !== undefined;
  const conditionSelected = data.visualCondition !== undefined;

  // When no softener, only presence matters
  // When softener present, all fields required
  const allFieldsComplete = data.hasSoftener === false 
    ? presenceSelected 
    : presenceSelected && saltSelected && tierSelected && heightSelected && controlSelected && conditionSelected;

  // Progress for softener details (5 fields when present)
  const detailFields = [saltSelected, tierSelected, heightSelected, controlSelected, conditionSelected];
  const completedDetails = detailFields.filter(Boolean).length;
  const totalDetails = 5;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Water Softener Check</h2>
        <p className="text-sm text-muted-foreground">
          {data.hasSoftener ? `Verify each field • ${completedDetails}/${totalDetails} complete` : 'Confirm softener presence'}
        </p>
      </div>

      {/* Primary Yes/No Selection - Required */}
      <div className="space-y-3">
        <CategoryHeader 
          icon={<Droplets className="h-3.5 w-3.5" />} 
          title="Softener Present" 
          isComplete={presenceSelected} 
        />
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
      
      {/* Softener Details - Required Verification */}
      {data.hasSoftener && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Progress bar for detail fields */}
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
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card/50">
            <CategoryHeader 
              icon={<Package className="h-3.5 w-3.5" />} 
              title="Salt Status" 
              isComplete={saltSelected} 
            />
            <div className="flex gap-2">
              {SALT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ saltStatus: opt.value })}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-all",
                    data.saltStatus === opt.value
                      ? opt.color === 'green' 
                        ? 'border-green-500 bg-green-500/10 text-green-700'
                        : opt.color === 'red' 
                        ? 'border-red-500 bg-red-500/10 text-red-700'
                        : 'border-muted-foreground bg-muted text-muted-foreground'
                      : 'border-muted bg-card hover:border-muted-foreground/30'
                  )}
                >
                  {opt.value === 'OK' && <CheckCircle className="h-5 w-5" />}
                  {opt.value === 'EMPTY' && <XCircle className="h-5 w-5" />}
                  {opt.value === 'UNKNOWN' && <AlertCircle className="h-5 w-5" />}
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Tier */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card/50">
            <CategoryHeader 
              icon={<Settings className="h-3.5 w-3.5" />} 
              title="Quality Tier" 
              isComplete={tierSelected} 
            />
            <div className="flex gap-2">
              {QUALITY_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => onUpdate({ qualityTier: tier.value })}
                  className={cn(
                    "flex-1 py-3 rounded-lg border-2 text-sm transition-all",
                    data.qualityTier === tier.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <div className="font-medium">{tier.label}</div>
                  <div className="text-xs opacity-70">{tier.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tank Height */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card/50">
            <CategoryHeader 
              icon={<Ruler className="h-3.5 w-3.5" />} 
              title="Tank Height" 
              isComplete={heightSelected} 
            />
            <div className="flex gap-2">
              {VISUAL_HEIGHTS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => onUpdate({ visualHeight: h.value })}
                  className={cn(
                    "flex-1 py-3 rounded-lg border-2 text-sm transition-all",
                    data.visualHeight === h.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <div className="font-medium">{h.label}</div>
                  <div className="text-xs opacity-70">{h.capacity}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Control Head */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card/50">
            <CategoryHeader 
              icon={<Settings className="h-3.5 w-3.5" />} 
              title="Control Type" 
              isComplete={controlSelected} 
            />
            <div className="flex gap-2">
              {CONTROL_HEADS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onUpdate({ controlHead: c.value })}
                  className={cn(
                    "flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                    data.controlHead === c.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-card hover:border-muted-foreground/30'
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Condition (Age Estimate) */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card/50">
            <CategoryHeader 
              icon={<Eye className="h-3.5 w-3.5" />} 
              title="Visual Condition" 
              isComplete={conditionSelected} 
            />
            <div className="space-y-2">
              {VISUAL_CONDITIONS.map((cond) => (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => onUpdate({ visualCondition: cond.value })}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left",
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
            <p className="text-xs text-muted-foreground mt-2">
              Estimates age based on housing condition
            </p>
          </div>

          {/* Optional: Iron staining */}
          <div className="space-y-2 p-4 rounded-xl border border-border bg-card/50">
            <CategoryHeader 
              icon={<Clock className="h-3.5 w-3.5" />} 
              title="Iron Staining" 
              isComplete={data.visualIron !== undefined}
              isRequired={false}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdate({ visualIron: false })}
                className={cn(
                  "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                  data.visualIron === false
                    ? 'border-green-500 bg-green-500/10 text-green-700'
                    : 'border-muted bg-card hover:border-muted-foreground/30'
                )}
              >
                No Staining
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ visualIron: true })}
                className={cn(
                  "flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all",
                  data.visualIron === true
                    ? 'border-orange-500 bg-orange-500/10 text-orange-700'
                    : 'border-muted bg-card hover:border-muted-foreground/30'
                )}
              >
                Iron Staining
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Continue Button */}
      <Button 
        onClick={onNext} 
        className="w-full h-12 font-semibold"
        disabled={!allFieldsComplete}
      >
        {allFieldsComplete ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue
          </>
        ) : data.hasSoftener ? (
          `Complete all fields (${completedDetails}/${totalDetails})`
        ) : (
          'Select softener presence'
        )}
      </Button>
    </div>
  );
}
