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
  Edit2,
  Home,
  Warehouse,
  TreePine,
  ArrowUp,
  DoorOpen,
  Mountain,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { LocationCondition, EquipmentChecklist, AssetIdentification } from '@/types/technicianInspection';
import type { TempSetting, LocationType, VentType } from '@/lib/opterraAlgorithm';

interface ExceptionToggleStepProps {
  assetData: AssetIdentification;
  locationData: LocationCondition;
  equipmentData: EquipmentChecklist;
  onAssetUpdate: (data: Partial<AssetIdentification>) => void;
  onLocationUpdate: (data: Partial<LocationCondition>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onNext: () => void;
}

// Location options with icons for clarity
const LOCATION_OPTIONS: { value: LocationType; label: string; icon: React.ReactNode; isHighRisk?: boolean }[] = [
  { value: 'GARAGE', label: 'Garage', icon: <Warehouse className="h-5 w-5" /> },
  { value: 'BASEMENT', label: 'Basement', icon: <Home className="h-5 w-5" /> },
  { value: 'ATTIC', label: 'Attic', icon: <TreePine className="h-5 w-5" />, isHighRisk: true },
  { value: 'UPPER_FLOOR', label: 'Upper Floor', icon: <ArrowUp className="h-5 w-5" />, isHighRisk: true },
  { value: 'MAIN_LIVING', label: 'Closet', icon: <DoorOpen className="h-5 w-5" />, isHighRisk: true },
  { value: 'CRAWLSPACE', label: 'Crawlspace', icon: <Mountain className="h-5 w-5" /> },
  { value: 'EXTERIOR', label: 'Exterior', icon: <Sun className="h-5 w-5" /> },
];

const TEMP_OPTIONS: { value: TempSetting; label: string; temp: string; variant?: 'warning' }[] = [
  { value: 'LOW', label: 'Low', temp: '110°F' },
  { value: 'NORMAL', label: 'Medium', temp: '120°F' },
  { value: 'HOT', label: 'Hot', temp: '140°F', variant: 'warning' },
];

const CONNECTION_OPTIONS: { value: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER'; label: string; variant?: 'warning' }[] = [
  { value: 'DIELECTRIC', label: 'Dielectric' },
  { value: 'BRASS', label: 'Brass' },
  { value: 'DIRECT_COPPER', label: 'Direct Copper', variant: 'warning' },
];

const VENT_TYPE_OPTIONS: { value: VentType; label: string; desc: string }[] = [
  { value: 'ATMOSPHERIC', label: 'Atmospheric', desc: 'Draft hood' },
  { value: 'POWER_VENT', label: 'Power Vent', desc: 'Fan-assisted' },
  { value: 'DIRECT_VENT', label: 'Direct Vent', desc: 'Sealed combustion' },
];

const FLUE_SCENARIO_OPTIONS: { value: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT'; label: string; desc: string; variant?: 'warning' }[] = [
  { value: 'SHARED_FLUE', label: 'Shared Flue', desc: 'With furnace' },
  { value: 'ORPHANED_FLUE', label: 'Orphaned', desc: 'Standalone', variant: 'warning' },
  { value: 'DIRECT_VENT', label: 'PVC Vent', desc: 'To exterior' },
];

type StepId = 'location' | 'temp' | 'condition' | 'venting' | 'equipment';

// Completed step chip
const CompletedChip = React.forwardRef<
  HTMLButtonElement,
  { 
    icon: React.ReactNode;
    value: string;
    warning?: boolean;
    onClick: () => void;
  }
>(({ icon, value, warning, onClick }, ref) => (
  <button
    ref={ref}
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
    {warning ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
    <span className="truncate max-w-[120px]">{value}</span>
    <Edit2 className="h-3 w-3 opacity-50 shrink-0" />
  </button>
));
CompletedChip.displayName = 'CompletedChip';

// Option button component for consistency
interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

const OptionButton = ({ selected, onClick, children, variant = 'default', className }: OptionButtonProps) => {
  const getSelectedStyles = () => {
    if (!selected) return "border-border bg-card hover:border-muted-foreground/50";
    switch (variant) {
      case 'warning': return "border-orange-500 bg-orange-50 dark:bg-orange-500/20";
      case 'danger': return "border-red-500 bg-red-50 dark:bg-red-500/20";
      default: return "border-primary bg-primary/10";
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border-2 transition-all text-left",
        getSelectedStyles(),
        className
      )}
    >
      {children}
    </button>
  );
};

// Binary toggle for yes/no questions
interface BinaryToggleProps {
  label: string;
  value: boolean | undefined;
  onChange: (val: boolean) => void;
  yesVariant?: 'success' | 'danger' | 'warning';
}

const BinaryToggle = ({ label, value, onChange, yesVariant = 'danger' }: BinaryToggleProps) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "px-5 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all",
          value === false
            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-500/20"
            : "border-border bg-card hover:border-muted-foreground/50"
        )}
      >
        No
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "px-5 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all",
          value === true
            ? yesVariant === 'success'
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-500/20"
              : yesVariant === 'warning'
              ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/20"
              : "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/20"
            : "border-border bg-card hover:border-muted-foreground/50"
        )}
      >
        Yes
      </button>
    </div>
  </div>
);

// Animation variants
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
  
  const steps = useMemo<StepId[]>(() => 
    isGasUnit 
      ? ['location', 'temp', 'condition', 'venting', 'equipment']
      : ['location', 'temp', 'condition', 'equipment'],
    [isGasUnit]
  );
  
  const [activeStep, setActiveStep] = useState<StepId>('location');
  
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

  const currentStepIndex = useMemo(() => steps.indexOf(activeStep), [steps, activeStep]);
  const completedCount = steps.filter(s => stepCompletion[s]).length;
  const allComplete = steps.every(s => stepCompletion[s]);

  // Auto-advance when step completes
  useEffect(() => {
    const currentComplete = stepCompletion[activeStep];
    if (currentComplete && activeStep !== steps[steps.length - 1]) {
      const nextIncompleteIndex = steps.findIndex((s, i) => i > currentStepIndex && !stepCompletion[s]);
      if (nextIncompleteIndex !== -1) {
        const timer = setTimeout(() => {
          setActiveStep(steps[nextIncompleteIndex]);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [stepCompletion, activeStep, steps, currentStepIndex]);

  const getSummaryValue = (step: StepId): { value: string; warning: boolean } => {
    switch (step) {
      case 'location':
        const loc = LOCATION_OPTIONS.find(l => l.value === locationData.location);
        return { value: loc?.label || '', warning: loc?.isHighRisk || false };
      case 'temp':
        const temp = TEMP_OPTIONS.find(t => t.value === locationData.tempSetting);
        return { value: temp?.temp || '', warning: temp?.variant === 'warning' };
      case 'condition':
        const hasIssue = locationData.visualRust || locationData.isLeaking;
        return { 
          value: hasIssue 
            ? [locationData.visualRust && 'Rust', locationData.isLeaking && 'Leak'].filter(Boolean).join(', ')
            : 'Good', 
          warning: hasIssue || false 
        };
      case 'venting':
        const vent = VENT_TYPE_OPTIONS.find(v => v.value === assetData.ventType);
        return { value: vent?.label || '', warning: assetData.ventingScenario === 'ORPHANED_FLUE' };
      case 'equipment':
        const issues = [
          equipmentData.connectionType === 'DIRECT_COPPER' && 'Copper',
          equipmentData.hasExpTank === false && 'No tank',
          equipmentData.hasPrv === false && 'No PRV',
        ].filter(Boolean);
        return { value: issues.length > 0 ? issues.join(', ') : 'OK', warning: issues.length > 0 };
      default:
        return { value: '', warning: false };
    }
  };

  const stepIcons: Record<StepId, React.ReactNode> = {
    location: <MapPin className="h-5 w-5" />,
    temp: <Thermometer className="h-5 w-5" />,
    condition: <Eye className="h-5 w-5" />,
    venting: <Wind className="h-5 w-5" />,
    equipment: <Wrench className="h-5 w-5" />,
  };

  const stepTitles: Record<StepId, string> = {
    location: 'Unit Location',
    temp: 'Temperature Setting',
    condition: 'Visual Condition',
    venting: 'Venting Configuration',
    equipment: 'Equipment Check',
  };

  const isHighRiskLocation = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(locationData.location as string);

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Verify Installation</h2>
        <p className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
        
        {/* Progress bar */}
        <div className="flex justify-center gap-1.5 pt-1">
          {steps.map((step, i) => (
            <div 
              key={step}
              className={cn(
                "h-2 rounded-full transition-all",
                stepCompletion[step] 
                  ? "bg-green-500 w-2" 
                  : i === currentStepIndex 
                    ? "bg-primary w-8" 
                    : "bg-muted w-2"
              )}
            />
          ))}
        </div>
      </div>

      {/* Completed chips */}
      {completedCount > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 justify-center px-2"
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

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* LOCATION STEP */}
        {activeStep === 'location' && (
          <motion.div
            key="location"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3"
          >
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {stepIcons.location}
                </div>
                <h3 className="text-lg font-semibold">{stepTitles.location}</h3>
              </div>
              
              {/* 2-column grid for location options */}
              <div className="grid grid-cols-2 gap-3">
                {LOCATION_OPTIONS.map((loc) => (
                  <OptionButton
                    key={loc.value}
                    selected={locationData.location === loc.value}
                    onClick={() => onLocationUpdate({ location: loc.value })}
                    variant={loc.isHighRisk ? 'warning' : 'default'}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        locationData.location === loc.value
                          ? loc.isHighRisk ? "bg-orange-100" : "bg-primary/20"
                          : "bg-muted"
                      )}>
                        {loc.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{loc.label}</div>
                        {loc.isHighRisk && (
                          <div className="text-xs text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            High risk
                          </div>
                        )}
                      </div>
                    </div>
                  </OptionButton>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TEMPERATURE STEP */}
        {activeStep === 'temp' && (
          <motion.div
            key="temp"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3"
          >
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {stepIcons.temp}
                </div>
                <h3 className="text-lg font-semibold">{stepTitles.temp}</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {TEMP_OPTIONS.map((temp) => (
                  <OptionButton
                    key={temp.value}
                    selected={locationData.tempSetting === temp.value}
                    onClick={() => onLocationUpdate({ tempSetting: temp.value })}
                    variant={temp.variant === 'warning' ? 'warning' : 'default'}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold">{temp.temp}</div>
                    <div className="text-sm text-muted-foreground">{temp.label}</div>
                  </OptionButton>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* CONDITION STEP */}
        {activeStep === 'condition' && (
          <motion.div
            key="condition"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3"
          >
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {stepIcons.condition}
                </div>
                <h3 className="text-lg font-semibold">{stepTitles.condition}</h3>
              </div>
              
              <div className="space-y-3">
                <BinaryToggle
                  label="Visible rust on tank?"
                  value={locationData.visualRust}
                  onChange={(val) => onLocationUpdate({ visualRust: val })}
                  yesVariant="danger"
                />
                <div className="border-t" />
                <BinaryToggle
                  label="Active water leak?"
                  value={locationData.isLeaking}
                  onChange={(val) => onLocationUpdate({ isLeaking: val })}
                  yesVariant="danger"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* VENTING STEP (Gas only) */}
        {activeStep === 'venting' && isGasUnit && (
          <motion.div
            key="venting"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3"
          >
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {stepIcons.venting}
                </div>
                <h3 className="text-lg font-semibold">{stepTitles.venting}</h3>
              </div>
              
              <div className="space-y-4">
                {/* Vent Type */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Vent Type</p>
                  <div className="grid grid-cols-1 gap-2">
                    {VENT_TYPE_OPTIONS.map((vent) => (
                      <OptionButton
                        key={vent.value}
                        selected={assetData.ventType === vent.value}
                        onClick={() => onAssetUpdate({ ventType: vent.value })}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{vent.label}</span>
                          <span className="text-sm text-muted-foreground">{vent.desc}</span>
                        </div>
                      </OptionButton>
                    ))}
                  </div>
                </div>

                {/* Flue Scenario */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Flue Scenario</p>
                  <div className="grid grid-cols-1 gap-2">
                    {FLUE_SCENARIO_OPTIONS.map((flue) => (
                      <OptionButton
                        key={flue.value}
                        selected={assetData.ventingScenario === flue.value}
                        onClick={() => onAssetUpdate({ ventingScenario: flue.value })}
                        variant={flue.variant === 'warning' ? 'warning' : 'default'}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{flue.label}</span>
                          <span className="text-sm text-muted-foreground">{flue.desc}</span>
                        </div>
                      </OptionButton>
                    ))}
                  </div>
                </div>

                {assetData.ventingScenario === 'ORPHANED_FLUE' && (
                  <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Orphaned flue may require liner for replacement
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* EQUIPMENT STEP */}
        {activeStep === 'equipment' && (
          <motion.div
            key="equipment"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-3"
          >
            <div className="bg-card border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {stepIcons.equipment}
                </div>
                <h3 className="text-lg font-semibold">{stepTitles.equipment}</h3>
              </div>
              
              <div className="space-y-4">
                {/* Connection Type */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pipe Connection</p>
                  <div className="grid grid-cols-1 gap-2">
                    {CONNECTION_OPTIONS.map((conn) => (
                      <OptionButton
                        key={conn.value}
                        selected={equipmentData.connectionType === conn.value}
                        onClick={() => onEquipmentUpdate({ connectionType: conn.value })}
                        variant={conn.variant === 'warning' ? 'warning' : 'default'}
                      >
                        <span className="font-medium">{conn.label}</span>
                      </OptionButton>
                    ))}
                  </div>
                </div>

                {/* Binary toggles */}
                <div className="space-y-2 pt-2 border-t">
                  <BinaryToggle
                    label="Expansion tank present?"
                    value={equipmentData.hasExpTank}
                    onChange={(val) => onEquipmentUpdate({ hasExpTank: val })}
                    yesVariant="success"
                  />
                  <BinaryToggle
                    label="PRV at main?"
                    value={equipmentData.hasPrv}
                    onChange={(val) => onEquipmentUpdate({ hasPrv: val })}
                    yesVariant="success"
                  />
                  <BinaryToggle
                    label="Drain pan installed?"
                    value={equipmentData.hasDrainPan}
                    onChange={(val) => onEquipmentUpdate({ hasDrainPan: val })}
                    yesVariant="success"
                  />
                </div>

                {isHighRiskLocation && equipmentData.hasDrainPan === false && (
                  <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Drain pan recommended for {locationData.location?.toLowerCase().replace('_', ' ')} location
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue Button */}
      {allComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-1"
        >
          <Button onClick={onNext} className="w-full h-12 font-semibold">
            Continue
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
