import React, { useState } from 'react';
import { 
  Settings2, 
  Wind,
  AlertTriangle,
  Container,
  ShieldCheck,
  Wrench,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AssetIdentification, LocationCondition, EquipmentChecklist } from '@/types/technicianInspection';
import type { VentType } from '@/lib/opterraAlgorithm';
import { TechnicianStepLayout, StepCard } from './TechnicianStepLayout';

interface EquipmentVerifyStepProps {
  assetData: AssetIdentification;
  locationData: LocationCondition;
  equipmentData: EquipmentChecklist;
  onAssetUpdate: (data: Partial<AssetIdentification>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onNext: () => void;
}

// Consolidated: venting-config = venting + flue
type SubStep = 'exp-tank' | 'venting-config' | 'connection' | 'extras';

const VENT_TYPE_OPTIONS: { value: VentType; label: string; desc: string }[] = [
  { value: 'ATMOSPHERIC', label: 'Atmospheric', desc: 'Natural draft, B-vent' },
  { value: 'POWER_VENT', label: 'Power Vent', desc: 'Fan-assisted, PVC exhaust' },
  { value: 'DIRECT_VENT', label: 'Direct Vent', desc: 'Sealed combustion' },
];

const FLUE_SCENARIO_OPTIONS: { value: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT'; label: string; desc: string; variant?: 'warning' }[] = [
  { value: 'SHARED_FLUE', label: 'Shared Flue', desc: 'With furnace' },
  { value: 'ORPHANED_FLUE', label: 'Orphaned', desc: 'Standalone flue', variant: 'warning' },
  { value: 'DIRECT_VENT', label: 'PVC Vent', desc: 'Direct to exterior' },
];

const CONNECTION_OPTIONS: { value: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER'; label: string; variant?: 'warning' }[] = [
  { value: 'DIELECTRIC', label: 'Dielectric' },
  { value: 'BRASS', label: 'Brass' },
  { value: 'DIRECT_COPPER', label: 'Direct Copper', variant: 'warning' },
];

const EXP_TANK_STATUS_OPTIONS = [
  { value: 'FUNCTIONAL' as const, label: 'Working', color: 'green' },
  { value: 'WATERLOGGED' as const, label: 'Waterlogged', color: 'orange' },
  { value: 'MISSING' as const, label: 'None', color: 'muted' },
];

export function EquipmentVerifyStep({
  assetData,
  locationData,
  equipmentData,
  onAssetUpdate,
  onEquipmentUpdate,
  onNext,
}: EquipmentVerifyStepProps) {
  const isGasUnit = assetData.fuelType === 'GAS' || assetData.fuelType === 'TANKLESS_GAS';
  const isHighRiskLocation = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(locationData.location as string);
  
  // Build step order based on fuel type - consolidated venting+flue into venting-config
  const getSubSteps = (): SubStep[] => {
    if (isGasUnit) {
      return ['exp-tank', 'venting-config', 'connection', 'extras'];
    }
    return ['exp-tank', 'connection', 'extras'];
  };
  
  const subSteps = getSubSteps();
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>(subSteps[0]);
  
  const currentIndex = subSteps.indexOf(currentSubStep);
  const isLastStep = currentIndex === subSteps.length - 1;
  
  const canProceed = (): boolean => {
    switch (currentSubStep) {
      case 'exp-tank':
        return equipmentData.expTankStatus !== undefined;
      case 'venting-config':
        return assetData.ventType !== undefined && assetData.ventingScenario !== undefined;
      case 'connection':
        return equipmentData.connectionType !== undefined;
      case 'extras':
        return equipmentData.hasDrainPan !== undefined;
      default:
        return false;
    }
  };
  
  const handleNext = () => {
    if (isLastStep) {
      onNext();
    } else {
      setCurrentSubStep(subSteps[currentIndex + 1]);
    }
  };
  
  const getStepTitle = (): string => {
    switch (currentSubStep) {
      case 'exp-tank': return 'Expansion Tank';
      case 'venting-config': return 'Venting Configuration';
      case 'connection': return 'Pipe Connection';
      case 'extras': return 'Additional Equipment';
      default: return 'Equipment';
    }
  };
  
  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'exp-tank': return <Container className="h-7 w-7" />;
      case 'venting-config': return <Wind className="h-7 w-7" />;
      case 'connection': return <Wrench className="h-7 w-7" />;
      case 'extras': return <ShieldCheck className="h-7 w-7" />;
      default: return <Settings2 className="h-7 w-7" />;
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

  const renderExpTankStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Check if an expansion tank is installed and tap to test the bladder
      </p>
      
      <div className="space-y-3">
        {EXP_TANK_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onEquipmentUpdate({ 
                hasExpTank: opt.value !== 'MISSING',
                expTankStatus: opt.value 
              });
            }}
            className={cn(
              "w-full py-4 px-5 rounded-xl border-2 text-left transition-all flex items-center justify-between",
              equipmentData.expTankStatus === opt.value
                ? opt.color === 'green' 
                  ? "border-green-500 bg-green-500/10"
                  : opt.color === 'orange'
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-muted-foreground bg-muted/50"
                : "border-muted bg-card hover:border-primary/40"
            )}
          >
            <span className={cn(
              "font-medium",
              equipmentData.expTankStatus === opt.value
                ? opt.color === 'green' ? "text-green-700 dark:text-green-400"
                : opt.color === 'orange' ? "text-orange-700 dark:text-orange-400"
                : "text-muted-foreground"
                : "text-foreground"
            )}>
              {opt.label}
            </span>
            {equipmentData.expTankStatus === opt.value && (
              <CheckCircle2 className={cn(
                "h-5 w-5",
                opt.color === 'green' ? "text-green-600" 
                : opt.color === 'orange' ? "text-orange-600" 
                : "text-muted-foreground"
              )} />
            )}
          </button>
        ))}
      </div>
      
      {equipmentData.expTankStatus === 'WATERLOGGED' && (
        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2 mt-4">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Waterlogged tank increases thermal expansion stress
          </p>
        </div>
      )}
    </StepCard>
  );

  // Combined venting + flue
  const renderVentingConfigStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      {/* Section 1: Vent Type */}
      <div className="mb-5">
        <p className="text-xs font-medium text-muted-foreground mb-3">Vent Type</p>
        <div className="space-y-2">
          {VENT_TYPE_OPTIONS.map((vent) => (
            <button
              key={vent.value}
              type="button"
              onClick={() => onAssetUpdate({ ventType: vent.value })}
              className={cn(
                "w-full p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                assetData.ventType === vent.value
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-card hover:border-primary/40"
              )}
            >
              <div>
                <span className="font-medium text-sm">{vent.label}</span>
                <p className="text-xs text-muted-foreground">{vent.desc}</p>
              </div>
              {assetData.ventType === vent.value && (
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Section 2: Flue Scenario */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">Flue Scenario</p>
        <div className="space-y-2">
          {FLUE_SCENARIO_OPTIONS.map((flue) => (
            <button
              key={flue.value}
              type="button"
              onClick={() => onAssetUpdate({ ventingScenario: flue.value })}
              className={cn(
                "w-full p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                assetData.ventingScenario === flue.value
                  ? flue.variant === 'warning'
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-primary bg-primary/10"
                  : "border-muted bg-card hover:border-primary/40"
              )}
            >
              <div>
                <span className="font-medium text-sm">{flue.label}</span>
                <p className="text-xs text-muted-foreground">{flue.desc}</p>
              </div>
              {assetData.ventingScenario === flue.value && (
                <CheckCircle2 className={cn(
                  "h-5 w-5 shrink-0",
                  flue.variant === 'warning' ? "text-orange-500" : "text-primary"
                )} />
              )}
            </button>
          ))}
        </div>
      </div>

      {assetData.ventingScenario === 'ORPHANED_FLUE' && (
        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2 mt-4">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Orphaned flue may require liner for replacement
          </p>
        </div>
      )}
    </StepCard>
  );

  const renderConnectionStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What type of water line connections are used?
      </p>
      
      <div className="space-y-3">
        {CONNECTION_OPTIONS.map((conn) => (
          <button
            key={conn.value}
            type="button"
            onClick={() => onEquipmentUpdate({ connectionType: conn.value })}
            className={cn(
              "w-full py-4 px-5 rounded-xl border-2 text-left transition-all flex items-center justify-between",
              equipmentData.connectionType === conn.value
                ? conn.variant === 'warning'
                  ? "border-red-500 bg-red-500/10"
                  : "border-primary bg-primary/10"
                : "border-muted bg-card hover:border-primary/40"
            )}
          >
            <span className={cn(
              "font-medium",
              equipmentData.connectionType === conn.value
                ? conn.variant === 'warning' ? "text-red-700 dark:text-red-400" : "text-primary"
                : "text-foreground"
            )}>
              {conn.label}
            </span>
            {equipmentData.connectionType === conn.value && (
              <CheckCircle2 className={cn(
                "h-5 w-5",
                conn.variant === 'warning' ? "text-red-600" : "text-primary"
              )} />
            )}
          </button>
        ))}
      </div>
      
      {equipmentData.connectionType === 'DIRECT_COPPER' && (
        <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-start gap-2 mt-4">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">
            Galvanic corrosion risk — 3x accelerated aging
          </p>
        </div>
      )}
    </StepCard>
  );

  const renderExtrasStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Check for additional equipment
      </p>
      
      <div className="space-y-3">
        <button
          onClick={() => onEquipmentUpdate({ hasCircPump: !equipmentData.hasCircPump })}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
            equipmentData.hasCircPump
              ? "border-primary bg-primary/10"
              : "border-muted bg-card"
          )}
        >
          <span className={cn("font-medium", equipmentData.hasCircPump ? "text-primary" : "text-foreground")}>
            Recirculation Pump
          </span>
          <div className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
            equipmentData.hasCircPump ? "border-primary bg-primary" : "border-muted-foreground"
          )}>
            {equipmentData.hasCircPump && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
          </div>
        </button>
        
        <button
          onClick={() => onEquipmentUpdate({ hasDrainPan: !equipmentData.hasDrainPan })}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
            equipmentData.hasDrainPan
              ? "border-green-500 bg-green-500/10"
              : isHighRiskLocation
              ? "border-red-500 bg-red-500/10"
              : "border-muted bg-card"
          )}
        >
          <div>
            <span className={cn(
              "font-medium",
              equipmentData.hasDrainPan 
                ? "text-green-700 dark:text-green-400" 
                : isHighRiskLocation && !equipmentData.hasDrainPan
                ? "text-red-700 dark:text-red-400"
                : "text-foreground"
            )}>
              Drain Pan Installed
            </span>
            {isHighRiskLocation && (
              <p className="text-xs text-muted-foreground mt-0.5">Required for high-risk location</p>
            )}
          </div>
          <div className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
            equipmentData.hasDrainPan 
              ? "border-green-500 bg-green-500" 
              : isHighRiskLocation 
              ? "border-red-500" 
              : "border-muted-foreground"
          )}>
            {equipmentData.hasDrainPan && <CheckCircle2 className="h-4 w-4 text-white" />}
          </div>
        </button>
      </div>
      
      {isHighRiskLocation && equipmentData.hasDrainPan === false && (
        <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2 mt-4">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Drain pan strongly recommended for {locationData.location?.toLowerCase().replace('_', ' ')} location
          </p>
        </div>
      )}
    </StepCard>
  );

  const renderCurrentStep = () => {
    switch (currentSubStep) {
      case 'exp-tank': return renderExpTankStep();
      case 'venting-config': return renderVentingConfigStep();
      case 'connection': return renderConnectionStep();
      case 'extras': return renderExtrasStep();
      default: return null;
    }
  };

  return (
    <TechnicianStepLayout
      icon={getStepIcon()}
      title={getStepTitle()}
      subtitle={`Step ${currentIndex + 1} of ${subSteps.length}`}
    >
      <div className="flex-1 flex flex-col">
        {renderProgress()}
        
        <div className="flex-1 flex flex-col justify-center">
          {renderCurrentStep()}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            {isLastStep ? 'Continue' : 'Next'}
            {!isLastStep && <ChevronRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>
      </div>
    </TechnicianStepLayout>
  );
}
