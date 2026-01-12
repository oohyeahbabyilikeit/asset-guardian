import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  MapPin,
  Thermometer,
  Eye,
  Wrench,
  Wind,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { LocationCondition, EquipmentChecklist, AssetIdentification } from '@/types/technicianInspection';
import type { TempSetting, LocationType, VentType } from '@/lib/opterraAlgorithm';

/**
 * ExceptionToggleStep v9.0 - Progressive Disclosure Pattern
 * 
 * Shows one category at a time to reduce cognitive load.
 * Auto-advances when a category is completed.
 * Completed steps shown as compact, editable chips.
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

// Options data
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

type StepId = 'location' | 'temp' | 'condition' | 'venting' | 'equipment';

// Completed step chip component
function CompletedChip({ 
  icon, 
  value, 
  warning,
  onClick 
}: { 
  icon: React.ReactNode;
  value: string;
  warning?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        "hover:scale-105 active:scale-95",
        warning 
          ? "bg-orange-100 text-orange-800 border border-orange-300"
          : "bg-green-100 text-green-800 border border-green-300"
      )}
    >
      {warning ? (
        <AlertTriangle className="h-3.5 w-3.5" />
      ) : (
        <CheckCircle className="h-3.5 w-3.5" />
      )}
      {value}
      <Edit2 className="h-3 w-3 opacity-50" />
    </button>
  );
}

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

// Animation variants for steps
const stepVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export function ExceptionToggleStep({
  assetData,
  locationData,
  equipmentData,
  onAssetUpdate,
  onLocationUpdate,
  onEquipmentUpdate,
  onNext,
}: ExceptionToggleStepProps) {
  const isGasUnit = assetData.fuelType === 'GAS' || assetData.fuelType === 'TANKLESS_GAS';
  
  // Build step list based on unit type - memoized to prevent stale references
  const steps = useMemo<StepId[]>(() => 
    isGasUnit 
      ? ['location', 'temp', 'condition', 'venting', 'equipment']
      : ['location', 'temp', 'condition', 'equipment'],
    [isGasUnit]
  );
  
  // Current active step
  const [activeStep, setActiveStep] = useState<StepId>('location');
  
  // Completion checks - memoized for stable references
  const locationComplete = locationData.location !== null && locationData.location !== undefined;
  const tempComplete = locationData.tempSetting !== null && locationData.tempSetting !== undefined;
  const conditionComplete = locationData.visualRust !== undefined && locationData.isLeaking !== undefined;
  const ventingComplete = !isGasUnit || (assetData.ventType !== undefined && assetData.ventingScenario !== undefined);
  const equipmentComplete = 
    equipmentData.connectionType !== undefined && 
    equipmentData.hasExpTank !== undefined && 
    equipmentData.hasPrv !== undefined && 
    equipmentData.hasDrainPan !== undefined;

  const stepCompletion = useMemo<Record<StepId, boolean>>(() => ({
    location: locationComplete,
    temp: tempComplete,
    condition: conditionComplete,
    venting: ventingComplete,
    equipment: equipmentComplete,
  }), [locationComplete, tempComplete, conditionComplete, ventingComplete, equipmentComplete]);

  // Get current step index - memoized
  const currentStepIndex = useMemo(() => steps.indexOf(activeStep), [steps, activeStep]);
  
  // Calculate progress
  const completedCount = steps.filter(s => stepCompletion[s]).length;
  const allComplete = steps.every(s => stepCompletion[s]);

  // Auto-advance when step completes
  useEffect(() => {
    const currentComplete = stepCompletion[activeStep];
    if (currentComplete && activeStep !== steps[steps.length - 1]) {
      // Find next incomplete step
      const nextIncompleteIndex = steps.findIndex((s, i) => i > currentStepIndex && !stepCompletion[s]);
      if (nextIncompleteIndex !== -1) {
        const timer = setTimeout(() => {
          setActiveStep(steps[nextIncompleteIndex]);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [stepCompletion, activeStep, steps, currentStepIndex]);

  // Summary values for completed chips
  const getSummaryValue = (step: StepId): { value: string; warning: boolean } => {
    switch (step) {
      case 'location':
        const loc = LOCATION_OPTIONS.find(l => l.value === locationData.location);
        return { 
          value: loc?.label || '', 
          warning: loc?.isHighRisk || false 
        };
      case 'temp':
        const temp = TEMP_OPTIONS.find(t => t.value === locationData.tempSetting);
        return { 
          value: `${temp?.label} ${temp?.temp}`, 
          warning: temp?.variant === 'warning' 
        };
      case 'condition':
        const hasIssue = locationData.visualRust || locationData.isLeaking;
        return { 
          value: hasIssue 
            ? [locationData.visualRust && 'Rust', locationData.isLeaking && 'Leak'].filter(Boolean).join(', ')
            : 'Good condition', 
          warning: hasIssue || false 
        };
      case 'venting':
        const vent = VENT_TYPE_OPTIONS.find(v => v.value === assetData.ventType);
        const flue = FLUE_SCENARIO_OPTIONS.find(f => f.value === assetData.ventingScenario);
        return { 
          value: `${vent?.label || ''} / ${flue?.label || ''}`, 
          warning: assetData.ventingScenario === 'ORPHANED_FLUE' 
        };
      case 'equipment':
        const issues = [
          equipmentData.connectionType === 'DIRECT_COPPER' && 'Direct Cu',
          equipmentData.hasExpTank === false && 'No exp tank',
          equipmentData.hasPrv === false && 'No PRV',
        ].filter(Boolean);
        return { 
          value: issues.length > 0 ? issues.join(', ') : 'All present', 
          warning: issues.length > 0 
        };
      default:
        return { value: '', warning: false };
    }
  };

  // Step icons
  const stepIcons: Record<StepId, React.ReactNode> = {
    location: <MapPin className="h-5 w-5" />,
    temp: <Thermometer className="h-5 w-5" />,
    condition: <Eye className="h-5 w-5" />,
    venting: <Wind className="h-5 w-5" />,
    equipment: <Wrench className="h-5 w-5" />,
  };

  const stepTitles: Record<StepId, string> = {
    location: 'Where is the unit?',
    temp: 'Temperature setting?',
    condition: 'Visual condition?',
    venting: 'Venting type?',
    equipment: 'Equipment present?',
  };

  const isHighRiskLocation = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(locationData.location);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">Verify Installation</h2>
        <p className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {steps.map((step, i) => (
            <div 
              key={step}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                stepCompletion[step] 
                  ? "bg-green-500" 
                  : i === currentStepIndex 
                    ? "bg-primary w-6" 
                    : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Completed steps as chips */}
      {completedCount > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 justify-center"
        >
          {steps.slice(0, currentStepIndex).filter(s => stepCompletion[s]).map((step) => {
            const summary = getSummaryValue(step);
            return (
              <CompletedChip
                key={step}
                icon={stepIcons[step]}
                value={summary.value}
                warning={summary.warning}
                onClick={() => setActiveStep(step)}
              />
            );
          })}
        </motion.div>
      )}

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        {/* Location Step */}
        {activeStep === 'location' && (
          <motion.div
            key="location"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                {stepIcons.location}
                <h3 className="text-lg font-semibold">{stepTitles.location}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {LOCATION_OPTIONS.map((loc) => (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => onLocationUpdate({ location: loc.value })}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      locationData.location === loc.value
                        ? loc.isHighRisk
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="font-medium">{loc.label}</div>
                    {loc.isHighRisk && (
                      <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        High risk
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Temperature Step */}
        {activeStep === 'temp' && (
          <motion.div
            key="temp"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="bg-card border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                {stepIcons.temp}
                <h3 className="text-lg font-semibold">{stepTitles.temp}</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {TEMP_OPTIONS.map((temp) => (
                  <button
                    key={temp.value}
                    type="button"
                    onClick={() => onLocationUpdate({ tempSetting: temp.value })}
                    className={cn(
                      "p-5 rounded-xl border-2 text-center transition-all",
                      locationData.tempSetting === temp.value
                        ? temp.variant === 'warning'
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <div className="text-2xl font-bold">{temp.label}</div>
                    <div className="text-sm text-muted-foreground">{temp.temp}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Condition Step */}
        {activeStep === 'condition' && (
          <motion.div
            key="condition"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="bg-card border rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-3">
                {stepIcons.condition}
                <h3 className="text-lg font-semibold">{stepTitles.condition}</h3>
              </div>
              <div className="space-y-4">
                <BinaryChoice
                  label="Rust visible on tank?"
                  value={locationData.visualRust}
                  onChange={(val) => onLocationUpdate({ visualRust: val })}
                  yesVariant="danger"
                />
                <BinaryChoice
                  label="Active water leak?"
                  value={locationData.isLeaking}
                  onChange={(val) => onLocationUpdate({ isLeaking: val })}
                  yesVariant="danger"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Venting Step (Gas only) */}
        {activeStep === 'venting' && isGasUnit && (
          <motion.div
            key="venting"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="bg-card border rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-3">
                {stepIcons.venting}
                <h3 className="text-lg font-semibold">{stepTitles.venting}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Vent Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    {VENT_TYPE_OPTIONS.map((vent) => (
                      <button
                        key={vent.value}
                        type="button"
                        onClick={() => onAssetUpdate({ ventType: vent.value })}
                        className={cn(
                          "p-3 rounded-xl border-2 text-center transition-all",
                          assetData.ventType === vent.value
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="font-medium text-sm">{vent.label}</div>
                        <div className="text-xs text-muted-foreground">{vent.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Flue Scenario</span>
                  <div className="grid grid-cols-3 gap-2">
                    {FLUE_SCENARIO_OPTIONS.map((flue) => (
                      <button
                        key={flue.value}
                        type="button"
                        onClick={() => onAssetUpdate({ ventingScenario: flue.value })}
                        className={cn(
                          "p-3 rounded-xl border-2 text-center transition-all",
                          assetData.ventingScenario === flue.value
                            ? flue.variant === 'warning'
                              ? "border-orange-500 bg-orange-500/10"
                              : "border-primary bg-primary/10"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="font-medium text-sm">{flue.label}</div>
                        <div className="text-xs text-muted-foreground">{flue.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {assetData.ventingScenario === 'ORPHANED_FLUE' && (
                  <div className="p-3 bg-orange-100 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      Orphaned flue may require liner for replacement
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Equipment Step */}
        {activeStep === 'equipment' && (
          <motion.div
            key="equipment"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-4"
          >
            <div className="bg-card border rounded-xl p-5 space-y-5">
              <div className="flex items-center gap-3">
                {stepIcons.equipment}
                <h3 className="text-lg font-semibold">{stepTitles.equipment}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Pipe Connection</span>
                  <div className="grid grid-cols-3 gap-2">
                    {CONNECTION_OPTIONS.map((conn) => (
                      <button
                        key={conn.value}
                        type="button"
                        onClick={() => onEquipmentUpdate({ connectionType: conn.value })}
                        className={cn(
                          "p-3 rounded-xl border-2 text-center transition-all",
                          equipmentData.connectionType === conn.value
                            ? conn.variant === 'warning'
                              ? "border-orange-500 bg-orange-500/10"
                              : "border-primary bg-primary/10"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="font-medium text-sm">{conn.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <BinaryChoice
                    label="Expansion tank present?"
                    value={equipmentData.hasExpTank}
                    onChange={(val) => onEquipmentUpdate({ hasExpTank: val })}
                    yesLabel="Yes"
                    noLabel="No"
                    yesVariant="success"
                  />
                  <BinaryChoice
                    label="PRV at main?"
                    value={equipmentData.hasPrv}
                    onChange={(val) => onEquipmentUpdate({ hasPrv: val })}
                    yesLabel="Yes"
                    noLabel="No"
                    yesVariant="success"
                  />
                  <BinaryChoice
                    label="Drain pan installed?"
                    value={equipmentData.hasDrainPan}
                    onChange={(val) => onEquipmentUpdate({ hasDrainPan: val })}
                    yesLabel="Yes"
                    noLabel="No"
                    yesVariant={isHighRiskLocation ? 'success' : 'info'}
                  />
                </div>

                {isHighRiskLocation && equipmentData.hasDrainPan === false && (
                  <div className="p-3 bg-orange-100 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      Drain pan recommended for {locationData.location?.toLowerCase()} location
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button - only show when all complete */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={onNext} className="w-full h-12 font-semibold">
            <span>Continue</span>
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
