import React from 'react';
import { 
  Settings2, 
  Wind,
  AlertTriangle,
  Container,
  ShieldCheck,
  RotateCw,
  Wrench,
  Droplet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetIdentification, LocationCondition, EquipmentChecklist } from '@/types/technicianInspection';
import type { VentType } from '@/lib/opterraAlgorithm';
import { TechnicianStepLayout, StepCard, BinaryToggle, SectionHeader } from './TechnicianStepLayout';

interface EquipmentVerifyStepProps {
  assetData: AssetIdentification;
  locationData: LocationCondition;
  equipmentData: EquipmentChecklist;
  onAssetUpdate: (data: Partial<AssetIdentification>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onNext: () => void;
}

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
  
  // Validation
  const ventingComplete = !isGasUnit || (assetData.ventType !== undefined && assetData.ventingScenario !== undefined);
  const equipmentComplete = 
    equipmentData.connectionType !== undefined && 
    equipmentData.expTankStatus !== undefined &&
    equipmentData.hasDrainPan !== undefined;
  
  const isComplete = ventingComplete && equipmentComplete;

  return (
    <TechnicianStepLayout
      icon={<Settings2 className="h-7 w-7" />}
      title="Equipment Verification"
      subtitle="Verify installation components and connections"
      onContinue={onNext}
      continueDisabled={!isComplete}
    >
      {/* Expansion Tank Status */}
      <StepCard>
        <SectionHeader icon={<Container className="h-4 w-4" />} title="Expansion Tank" isRequired />
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border mb-3">
          <div>
            <p className="text-sm font-medium">Expansion Tank Status</p>
            <p className="text-xs text-muted-foreground">Check bladder by tapping tank</p>
          </div>
        </div>
        <div className="flex gap-2">
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
                "flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                equipmentData.expTankStatus === opt.value
                  ? opt.color === 'green' 
                    ? "border-green-500 bg-green-500/10 text-green-700"
                    : opt.color === 'orange'
                    ? "border-orange-500 bg-orange-500/10 text-orange-700"
                    : "border-muted-foreground bg-muted text-muted-foreground"
                  : "border-muted bg-card hover:border-primary/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        {equipmentData.expTankStatus === 'WATERLOGGED' && (
          <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2 mt-3">
            <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800 dark:text-orange-200">
              Waterlogged tank increases thermal expansion stress
            </p>
          </div>
        )}
      </StepCard>

      {/* Venting (Gas Only) */}
      {isGasUnit && (
        <StepCard>
          <SectionHeader icon={<Wind className="h-4 w-4" />} title="Venting Configuration" isRequired />
          
          {/* Vent Type */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Vent Type</p>
            <div className="grid grid-cols-1 gap-2">
              {VENT_TYPE_OPTIONS.map((vent) => (
                <button
                  key={vent.value}
                  type="button"
                  onClick={() => onAssetUpdate({ ventType: vent.value })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                    assetData.ventType === vent.value
                      ? "border-primary bg-primary/10"
                      : "border-muted bg-card hover:border-primary/40"
                  )}
                >
                  <span className="font-medium text-sm">{vent.label}</span>
                  <span className="text-xs text-muted-foreground">{vent.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flue Scenario */}
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground">Flue Scenario</p>
            <div className="grid grid-cols-1 gap-2">
              {FLUE_SCENARIO_OPTIONS.map((flue) => (
                <button
                  key={flue.value}
                  type="button"
                  onClick={() => onAssetUpdate({ ventingScenario: flue.value })}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                    assetData.ventingScenario === flue.value
                      ? flue.variant === 'warning'
                        ? "border-orange-500 bg-orange-500/10"
                        : "border-primary bg-primary/10"
                      : "border-muted bg-card hover:border-primary/40"
                  )}
                >
                  <span className="font-medium text-sm">{flue.label}</span>
                  <span className="text-xs text-muted-foreground">{flue.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {assetData.ventingScenario === 'ORPHANED_FLUE' && (
            <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2 mt-3">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Orphaned flue may require liner for replacement
              </p>
            </div>
          )}
        </StepCard>
      )}

      {/* Pipe Connection */}
      <StepCard>
        <SectionHeader icon={<Wrench className="h-4 w-4" />} title="Pipe Connection" isRequired />
        <div className="grid grid-cols-3 gap-2">
          {CONNECTION_OPTIONS.map((conn) => (
            <button
              key={conn.value}
              type="button"
              onClick={() => onEquipmentUpdate({ connectionType: conn.value })}
              className={cn(
                "py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all",
                equipmentData.connectionType === conn.value
                  ? conn.variant === 'warning'
                    ? "border-red-500 bg-red-500/10 text-red-700"
                    : "border-primary bg-primary/10 text-primary"
                  : "border-muted bg-card hover:border-primary/40"
              )}
            >
              {conn.label}
            </button>
          ))}
        </div>
        
        {equipmentData.connectionType === 'DIRECT_COPPER' && (
          <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-start gap-2 mt-3">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">
              Galvanic corrosion risk — 3x accelerated aging
            </p>
          </div>
        )}
      </StepCard>

      {/* Additional Equipment */}
      <StepCard>
        <SectionHeader icon={<ShieldCheck className="h-4 w-4" />} title="Additional Equipment" />
        
        <div className="space-y-3">
          <BinaryToggle
            label="Recirculation Pump"
            description="Hot water recirculation system"
            value={equipmentData.hasCircPump}
            onChange={(val) => onEquipmentUpdate({ hasCircPump: val })}
            yesVariant="success"
            noVariant="success"
          />
          
          <div className="border-t pt-3">
            <BinaryToggle
              label="Drain Pan Installed"
              description={isHighRiskLocation ? "Required for high-risk location" : "Water collection pan under unit"}
              value={equipmentData.hasDrainPan}
              onChange={(val) => onEquipmentUpdate({ hasDrainPan: val })}
              yesVariant="success"
              noVariant={isHighRiskLocation ? "danger" : "success"}
            />
          </div>
          
          {isHighRiskLocation && equipmentData.hasDrainPan === false && (
            <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Drain pan strongly recommended for {locationData.location?.toLowerCase().replace('_', ' ')} location
              </p>
            </div>
          )}
        </div>
      </StepCard>

      {/* Validation Warning */}
      {!isComplete && (
        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please complete all required fields to continue
          </p>
        </div>
      )}
    </TechnicianStepLayout>
  );
}
