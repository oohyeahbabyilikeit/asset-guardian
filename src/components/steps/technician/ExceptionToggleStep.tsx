import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertTriangle, 
  Droplets,
  MapPin,
  Thermometer,
  Circle,
  Eye,
  Wrench,
  Wind
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LocationCondition, EquipmentChecklist, AssetIdentification } from '@/types/technicianInspection';
import type { TempSetting, LocationType, VentType } from '@/lib/opterraAlgorithm';

/**
 * ExceptionToggleStep v8.2 - "Required Verification" Pattern
 * 
 * NO PRESETS. Every category requires an explicit selection.
 * Fast chip-style buttons, but mandatory choices.
 * 
 * Categories:
 * 1. Location (required)
 * 2. Temperature (required)
 * 3. Visual Condition (required - rust/leak)
 * 4. Vent Type & Flue (required for gas units)
 * 5. Connections & Equipment (required)
 * 6. Softener Present (required)
 */

interface ExceptionToggleStepProps {
  assetData: AssetIdentification;
  locationData: LocationCondition;
  equipmentData: EquipmentChecklist;
  onAssetUpdate: (data: Partial<AssetIdentification>) => void;
  onLocationUpdate: (data: Partial<LocationCondition>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
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

const VENT_TYPE_OPTIONS: { value: VentType; label: string; description: string }[] = [
  { value: 'ATMOSPHERIC', label: 'Atmospheric', description: 'Open draft hood' },
  { value: 'POWER_VENT', label: 'Power Vent', description: 'Fan-assisted' },
  { value: 'DIRECT_VENT', label: 'Direct Vent', description: 'Sealed combustion' },
];

const FLUE_SCENARIO_OPTIONS: { value: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT'; label: string; description: string; variant?: 'warning' }[] = [
  { value: 'SHARED_FLUE', label: 'Shared', description: 'With furnace' },
  { value: 'ORPHANED_FLUE', label: 'Orphaned', description: 'Alone in chimney', variant: 'warning' },
  { value: 'DIRECT_VENT', label: 'Direct/PVC', description: 'To exterior' },
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
  assetData,
  locationData,
  equipmentData,
  onAssetUpdate,
  onLocationUpdate,
  onEquipmentUpdate,
  onNext,
}: ExceptionToggleStepProps) {
  // Check if gas unit (needs vent type selection)
  const isGasUnit = assetData.fuelType === 'GAS' || assetData.fuelType === 'TANKLESS_GAS';
  
  // Validation state - each category must be explicitly answered
  const locationSelected = locationData.location !== null && locationData.location !== undefined;
  const tempSelected = locationData.tempSetting !== null && locationData.tempSetting !== undefined;
  const rustChecked = locationData.visualRust !== undefined;
  const leakChecked = locationData.isLeaking !== undefined;
  const ventTypeSelected = !isGasUnit || (assetData.ventType !== undefined);
  const flueSelected = !isGasUnit || (assetData.ventingScenario !== undefined);
  const panChecked = equipmentData.hasDrainPan !== undefined;
  const connectionChecked = equipmentData.connectionType !== undefined;
  const expTankChecked = equipmentData.hasExpTank !== undefined;
  const prvChecked = equipmentData.hasPrv !== undefined;

  // Category completion
  const locationComplete = locationSelected;
  const tempComplete = tempSelected;
  const conditionComplete = rustChecked && leakChecked;
  const ventingComplete = !isGasUnit || (ventTypeSelected && flueSelected);
  const equipmentComplete = connectionChecked && expTankChecked && prvChecked && panChecked;

  // Build category array based on unit type (softener is on next step)
  const categories = isGasUnit 
    ? [locationComplete, tempComplete, conditionComplete, ventingComplete, equipmentComplete]
    : [locationComplete, tempComplete, conditionComplete, equipmentComplete];

  // Overall form validity
  const canContinue = categories.every(Boolean);

  // Progress count
  const completedCount = categories.filter(Boolean).length;
  const totalCategories = categories.length;

  const isHighRiskLocation = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(locationData.location);

  // Count flagged issues for summary
  const flaggedIssues = [
    locationData.visualRust && 'Visible rust',
    locationData.isLeaking && 'Active leak',
    equipmentData.connectionType === 'DIRECT_COPPER' && 'Direct copper',
    locationData.tempSetting === 'HOT' && 'High temp setting',
    isHighRiskLocation && `${locationData.location} location`,
    isHighRiskLocation && equipmentData.hasDrainPan === false && 'Missing drain pan',
    assetData.ventingScenario === 'ORPHANED_FLUE' && 'Orphaned flue (+liner cost)',
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
          {categories.map((complete, i) => (
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

      {/* Category 4: Venting (Gas Units Only) */}
      {isGasUnit && (
        <div className="space-y-3 p-4 rounded-xl border border-border bg-card/50">
          <CategoryHeader 
            icon={<Wind className="h-3.5 w-3.5" />} 
            title="Venting" 
            isComplete={ventingComplete} 
          />
          
          {/* Vent Type */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-foreground">Vent Type</span>
            <div className="flex gap-2">
              {VENT_TYPE_OPTIONS.map((vent) => (
                <button
                  key={vent.value}
                  type="button"
                  onClick={() => onAssetUpdate({ ventType: vent.value })}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 text-sm transition-all",
                    assetData.ventType === vent.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <div className="font-medium">{vent.label}</div>
                  <div className="text-xs opacity-70">{vent.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Flue Scenario */}
          <div className="space-y-2 pt-2">
            <span className="text-sm font-medium text-foreground">Flue Scenario</span>
            <div className="flex gap-2">
              {FLUE_SCENARIO_OPTIONS.map((flue) => (
                <button
                  key={flue.value}
                  type="button"
                  onClick={() => onAssetUpdate({ ventingScenario: flue.value })}
                  className={cn(
                    "flex-1 py-2 rounded-lg border-2 text-sm transition-all",
                    assetData.ventingScenario === flue.value
                      ? flue.variant === 'warning'
                        ? "border-orange-500 bg-orange-500/10 text-orange-700"
                        : "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-card hover:border-muted-foreground/30"
                  )}
                >
                  <div className="font-medium">{flue.label}</div>
                  <div className="text-xs opacity-70">{flue.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category 5: Connections & Equipment */}
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
      {/* NOTE: Softener check is on the next step */}

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

      {/* Orphaned Flue Warning */}
      {assetData.ventingScenario === 'ORPHANED_FLUE' && (
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800 text-sm">Orphaned Flue Detected</p>
              <p className="text-xs text-orange-700/80 mt-1">
                Chimney liner may be required if upgrading to high-efficiency unit. Add ~$2000 to quote.
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
