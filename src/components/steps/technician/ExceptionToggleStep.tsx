import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertTriangle, 
  Droplets,
  Gauge,
  MapPin,
  Thermometer,
  Box,
  Circle,
  Eye,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LocationCondition, EquipmentChecklist, SoftenerInspection } from '@/types/technicianInspection';
import type { TempSetting, LocationType } from '@/lib/opterraAlgorithm';

/**
 * ExceptionToggleStep v8.1 - "Required Verification" Pattern
 * 
 * NO PRESETS. Every category requires an explicit selection.
 * Fast chip-style buttons, but mandatory choices.
 * 
 * Categories:
 * 1. Location (required)
 * 2. Temperature (required)
 * 3. Visual Condition (required - rust/leak/pan)
 * 4. Connections & Equipment (required)
 * 5. Softener Present (required)
 */

interface ExceptionToggleStepProps {
  locationData: LocationCondition;
  equipmentData: EquipmentChecklist;
  softenerData: SoftenerInspection;
  onLocationUpdate: (data: Partial<LocationCondition>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onSoftenerUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

const LOCATION_OPTIONS: { value: LocationType; label: string; isHighRisk?: boolean }[] = [
  { value: 'GARAGE', label: 'Garage' },
  { value: 'BASEMENT', label: 'Basement' },
  { value: 'ATTIC', label: 'Attic', isHighRisk: true },
  { value: 'UPPER_FLOOR', label: 'Upper Floor', isHighRisk: true },
  { value: 'MAIN_LIVING', label: 'Utility Closet', isHighRisk: true },
  { value: 'CRAWLSPACE', label: 'Crawlspace' },
  { value: 'EXTERIOR', label: 'Exterior' },
];

const TEMP_OPTIONS: { value: TempSetting; label: string; temp: string; variant?: 'warning' }[] = [
  { value: 'LOW', label: 'Low', temp: '~110°F' },
  { value: 'NORMAL', label: 'Normal', temp: '~120°F' },
  { value: 'HOT', label: 'Hot', temp: '~140°F', variant: 'warning' },
];

const CONNECTION_OPTIONS: { value: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER'; label: string; variant?: 'warning' }[] = [
  { value: 'DIELECTRIC', label: 'Dielectric' },
  { value: 'BRASS', label: 'Brass' },
  { value: 'DIRECT_COPPER', label: 'Direct Copper', variant: 'warning' },
];

// Binary choice component
function BinaryChoice({ 
  label, 
  value, 
  onChange, 
  yesLabel = 'Yes', 
  noLabel = 'No',
  yesVariant = 'danger'
}: { 
  label: string; 
  value: boolean | undefined; 
  onChange: (val: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  yesVariant?: 'danger' | 'warning' | 'success' | 'info';
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all min-w-[60px]",
            value === false
              ? "border-green-500 bg-green-500/10 text-green-700"
              : "border-muted bg-card hover:border-muted-foreground/30"
          )}
        >
          {noLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all min-w-[60px]",
            value === true
              ? yesVariant === 'danger' 
                ? "border-red-500 bg-red-500/10 text-red-700"
                : yesVariant === 'warning'
                ? "border-orange-500 bg-orange-500/10 text-orange-700"
                : yesVariant === 'success'
                ? "border-green-500 bg-green-500/10 text-green-700"
                : "border-blue-500 bg-blue-500/10 text-blue-700"
              : "border-muted bg-card hover:border-muted-foreground/30"
          )}
        >
          {yesLabel}
        </button>
      </div>
    </div>
  );
}

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

export function ExceptionToggleStep({
  locationData,
  equipmentData,
  softenerData,
  onLocationUpdate,
  onEquipmentUpdate,
  onSoftenerUpdate,
  onNext,
}: ExceptionToggleStepProps) {
  // Validation state - each category must be explicitly answered
  const locationSelected = locationData.location !== null && locationData.location !== undefined;
  const tempSelected = locationData.tempSetting !== null && locationData.tempSetting !== undefined;
  const rustChecked = locationData.visualRust !== undefined;
  const leakChecked = locationData.isLeaking !== undefined;
  const panChecked = equipmentData.hasDrainPan !== undefined;
  const connectionChecked = equipmentData.connectionType !== undefined;
  const expTankChecked = equipmentData.hasExpTank !== undefined;
  const prvChecked = equipmentData.hasPrv !== undefined;
  const softenerChecked = softenerData.hasSoftener !== undefined;

  // Category completion
  const locationComplete = locationSelected;
  const tempComplete = tempSelected;
  const conditionComplete = rustChecked && leakChecked;
  const equipmentComplete = connectionChecked && expTankChecked && prvChecked && panChecked;
  const softenerComplete = softenerChecked;

  // Overall form validity
  const canContinue = locationComplete && tempComplete && conditionComplete && equipmentComplete && softenerComplete;

  // Progress count
  const completedCount = [locationComplete, tempComplete, conditionComplete, equipmentComplete, softenerComplete].filter(Boolean).length;
  const totalCategories = 5;

  const isHighRiskLocation = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(locationData.location);

  // Count flagged issues for summary
  const flaggedIssues = [
    locationData.visualRust && 'Visible rust',
    locationData.isLeaking && 'Active leak',
    equipmentData.connectionType === 'DIRECT_COPPER' && 'Direct copper',
    locationData.tempSetting === 'HOT' && 'High temp setting',
    isHighRiskLocation && `${locationData.location} location`,
    isHighRiskLocation && !equipmentData.hasDrainPan && 'Missing drain pan',
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      {/* Header with Progress */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Verify Installation</h2>
        <p className="text-sm text-muted-foreground">
          Confirm each category • {completedCount}/{totalCategories} complete
        </p>
        
        {/* Progress bar */}
        <div className="flex gap-1 mt-3">
          {[locationComplete, tempComplete, conditionComplete, equipmentComplete, softenerComplete].map((complete, i) => (
            <div 
              key={i} 
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                complete ? "bg-green-500" : "bg-muted"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Category 1: Location */}
      <div className="space-y-2">
        <CategoryHeader 
          icon={<MapPin className="h-3.5 w-3.5" />} 
          title="Location" 
          isComplete={locationComplete} 
        />
        <div className="flex flex-wrap gap-2">
          {LOCATION_OPTIONS.map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={() => onLocationUpdate({ location: loc.value })}
              className={cn(
                "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                locationData.location === loc.value
                  ? loc.isHighRisk
                    ? "border-orange-500 bg-orange-500/10 text-orange-700"
                    : "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-card hover:border-muted-foreground/30"
              )}
            >
              {loc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category 2: Temperature */}
      <div className="space-y-2">
        <CategoryHeader 
          icon={<Thermometer className="h-3.5 w-3.5" />} 
          title="Temperature Setting" 
          isComplete={tempComplete} 
        />
        <div className="flex gap-2">
          {TEMP_OPTIONS.map((temp) => (
            <button
              key={temp.value}
              type="button"
              onClick={() => onLocationUpdate({ tempSetting: temp.value })}
              className={cn(
                "flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                locationData.tempSetting === temp.value
                  ? temp.variant === 'warning'
                    ? "border-orange-500 bg-orange-500/10 text-orange-700"
                    : "border-primary bg-primary text-primary-foreground"
                  : "border-muted bg-card hover:border-muted-foreground/30"
              )}
            >
              <div>{temp.label}</div>
              <div className="text-xs opacity-70">{temp.temp}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Category 3: Visual Condition */}
      <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
        <CategoryHeader 
          icon={<Eye className="h-3.5 w-3.5" />} 
          title="Visual Condition" 
          isComplete={conditionComplete} 
        />
        <div className="space-y-3">
          <BinaryChoice
            label="Rust visible?"
            value={locationData.visualRust}
            onChange={(val) => onLocationUpdate({ visualRust: val })}
            yesVariant="danger"
          />
          <BinaryChoice
            label="Active leak?"
            value={locationData.isLeaking}
            onChange={(val) => onLocationUpdate({ isLeaking: val })}
            yesVariant="danger"
          />
        </div>
      </div>

      {/* Category 4: Connections & Equipment */}
      <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
        <CategoryHeader 
          icon={<Wrench className="h-3.5 w-3.5" />} 
          title="Equipment" 
          isComplete={equipmentComplete} 
        />
        
        {/* Connection Type */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Pipe Connection</span>
          <div className="flex gap-2">
            {CONNECTION_OPTIONS.map((conn) => (
              <button
                key={conn.value}
                type="button"
                onClick={() => onEquipmentUpdate({ connectionType: conn.value })}
                className={cn(
                  "flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                  equipmentData.connectionType === conn.value
                    ? conn.variant === 'warning'
                      ? "border-orange-500 bg-orange-500/10 text-orange-700"
                      : "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-card hover:border-muted-foreground/30"
                )}
              >
                {conn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <BinaryChoice
            label="Expansion tank?"
            value={equipmentData.hasExpTank}
            onChange={(val) => onEquipmentUpdate({ hasExpTank: val })}
            yesLabel="Present"
            noLabel="None"
            yesVariant="success"
          />
          <BinaryChoice
            label="PRV at main?"
            value={equipmentData.hasPrv}
            onChange={(val) => onEquipmentUpdate({ hasPrv: val })}
            yesLabel="Present"
            noLabel="None"
            yesVariant="success"
          />
          <BinaryChoice
            label="Drain pan?"
            value={equipmentData.hasDrainPan}
            onChange={(val) => onEquipmentUpdate({ hasDrainPan: val })}
            yesLabel="Present"
            noLabel="None"
            yesVariant={isHighRiskLocation ? 'success' : 'info'}
          />
        </div>
      </div>

      {/* Category 5: Softener */}
      <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
        <CategoryHeader 
          icon={<Droplets className="h-3.5 w-3.5" />} 
          title="Water Softener" 
          isComplete={softenerComplete} 
        />
        <BinaryChoice
          label="Softener present?"
          value={softenerData.hasSoftener}
          onChange={(val) => onSoftenerUpdate({ hasSoftener: val })}
          yesLabel="Yes"
          noLabel="No"
          yesVariant="info"
        />
      </div>

      {/* High Risk Location Warning */}
      {isHighRiskLocation && equipmentData.hasDrainPan === false && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 text-sm">Drain Pan Recommended</p>
              <p className="text-xs text-orange-700/80 mt-1">
                {locationData.location} location typically requires a drain pan for code compliance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flagged Issues Summary */}
      {flaggedIssues.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {flaggedIssues.length} issue{flaggedIssues.length > 1 ? 's' : ''} flagged
          </p>
          <ul className="text-xs text-amber-700/80 mt-1 space-y-0.5">
            {flaggedIssues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Continue Button */}
      <Button 
        onClick={onNext} 
        className="w-full h-12 font-semibold"
        disabled={!canContinue}
      >
        {canContinue ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue
          </>
        ) : (
          `Complete all categories (${completedCount}/${totalCategories})`
        )}
      </Button>
    </div>
  );
}
