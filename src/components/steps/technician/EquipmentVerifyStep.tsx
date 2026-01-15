import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Wind,
  AlertTriangle,
  Container,
  ShieldCheck,
  Wrench,
  ChevronRight,
  CheckCircle2,
  Magnet,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AssetIdentification, LocationCondition, EquipmentChecklist, NippleMaterial } from '@/types/technicianInspection';
import type { VentType } from '@/lib/opterraAlgorithm';
import { TechnicianStepLayout, StepCard } from './TechnicianStepLayout';
import { hasFactoryDielectricNipples, getProtectionExplanation } from '@/lib/brandDielectricLookup';

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
        if (!assetData.ventType) return false;
        // Conditional validation based on vent type
        if (assetData.ventType === 'ATMOSPHERIC') {
          return assetData.ventingScenario === 'SHARED_FLUE' || assetData.ventingScenario === 'ORPHANED_FLUE';
        }
        if (assetData.ventType === 'POWER_VENT') {
          return assetData.exhaustPipeSize !== undefined;
        }
        // DIRECT_VENT - no additional input needed
        return true;
      case 'connection':
        if (equipmentData.connectionType === undefined) return false;
        // If Direct Copper selected, need nipple material verification
        if (equipmentData.connectionType === 'DIRECT_COPPER') {
          return equipmentData.nippleMaterial !== undefined;
        }
        return true;
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

  // Handle vent type selection with auto-clear of conditional fields
  const handleVentTypeSelect = (ventType: VentType) => {
    // Clear conditional fields when switching vent types
    const updates: Partial<AssetIdentification> = { ventType };
    
    if (ventType === 'DIRECT_VENT') {
      // Auto-set ventingScenario for direct vent
      updates.ventingScenario = 'DIRECT_VENT';
      updates.exhaustPipeSize = undefined;
    } else if (ventType === 'POWER_VENT') {
      // Power vent uses PVC, no flue scenario needed
      updates.ventingScenario = 'DIRECT_VENT'; // No traditional flue
      // Keep exhaustPipeSize if already set, otherwise clear
    } else {
      // Atmospheric - clear exhaustPipeSize, keep ventingScenario if valid
      updates.exhaustPipeSize = undefined;
      if (assetData.ventingScenario === 'DIRECT_VENT') {
        updates.ventingScenario = undefined;
      }
    }
    
    onAssetUpdate(updates);
  };

  // Conditional venting configuration with physics-correct options
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
              onClick={() => handleVentTypeSelect(vent.value)}
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

      {/* Section 2: Conditional follow-up based on vent type */}
      {assetData.ventType === 'ATMOSPHERIC' && (
        <>
          <Separator className="my-4" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Shared with furnace?</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onAssetUpdate({ ventingScenario: 'SHARED_FLUE' })}
                className={cn(
                  "w-full p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                  assetData.ventingScenario === 'SHARED_FLUE'
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-card hover:border-primary/40"
                )}
              >
                <div>
                  <span className="font-medium text-sm">Yes, Shared Flue</span>
                  <p className="text-xs text-muted-foreground">Common chimney with furnace</p>
                </div>
                {assetData.ventingScenario === 'SHARED_FLUE' && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </button>
              
              <button
                type="button"
                onClick={() => onAssetUpdate({ ventingScenario: 'ORPHANED_FLUE' })}
                className={cn(
                  "w-full p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                  assetData.ventingScenario === 'ORPHANED_FLUE'
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-muted bg-card hover:border-primary/40"
                )}
              >
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    assetData.ventingScenario === 'ORPHANED_FLUE' && "text-orange-700 dark:text-orange-400"
                  )}>No, Standalone</span>
                  <p className="text-xs text-muted-foreground">Dedicated flue or no furnace</p>
                </div>
                {assetData.ventingScenario === 'ORPHANED_FLUE' && (
                  <CheckCircle2 className="h-5 w-5 text-orange-500 shrink-0" />
                )}
              </button>
            </div>
            
            {assetData.ventingScenario === 'ORPHANED_FLUE' && (
              <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg flex items-start gap-2 mt-4">
                <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Upgrade to tankless/HPWH will require chimney liner (~$2,000)
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {assetData.ventType === 'POWER_VENT' && (
        <>
          <Separator className="my-4" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">Exhaust pipe size?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onAssetUpdate({ exhaustPipeSize: '2' })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center",
                  assetData.exhaustPipeSize === '2'
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-card hover:border-primary/40"
                )}
              >
                <span className="font-semibold text-lg">2"</span>
                <p className="text-xs text-muted-foreground mt-1">Standard</p>
              </button>
              
              <button
                type="button"
                onClick={() => onAssetUpdate({ exhaustPipeSize: '3' })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-center",
                  assetData.exhaustPipeSize === '3'
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-card hover:border-primary/40"
                )}
              >
                <span className="font-semibold text-lg">3"</span>
                <p className="text-xs text-muted-foreground mt-1">High-capacity</p>
              </button>
            </div>
            
            {assetData.exhaustPipeSize === '2' && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                May need 3" for high-capacity tankless upgrade
              </p>
            )}
          </div>
        </>
      )}

      {assetData.ventType === 'DIRECT_VENT' && (
        <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-start gap-2 mt-4">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800 dark:text-green-200">
            Sealed combustion — no additional venting questions needed
          </p>
        </div>
      )}
    </StepCard>
  );

  // Check if brand qualifies for factory protection
  const isFactoryProtected = hasFactoryDielectricNipples(assetData.brand, 0); // calendarAge checked externally
  const protectionExplanation = getProtectionExplanation(assetData.brand);
  
  // Handle connection type selection with smart galvanic detection
  const handleConnectionSelect = (connectionType: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER') => {
    if (connectionType === 'DIRECT_COPPER' && isFactoryProtected) {
      // Auto-set as factory protected for known brands
      onEquipmentUpdate({ 
        connectionType, 
        nippleMaterial: 'FACTORY_PROTECTED' 
      });
    } else if (connectionType !== 'DIRECT_COPPER') {
      // Clear nipple material if not Direct Copper
      onEquipmentUpdate({ 
        connectionType, 
        nippleMaterial: undefined 
      });
    } else {
      // Direct Copper but unknown brand - need verification
      onEquipmentUpdate({ 
        connectionType,
        nippleMaterial: undefined
      });
    }
  };
  
  const handleNippleMaterialSelect = (nippleMaterial: NippleMaterial) => {
    onEquipmentUpdate({ nippleMaterial });
  };

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
            onClick={() => handleConnectionSelect(conn.value)}
            className={cn(
              "w-full py-4 px-5 rounded-xl border-2 text-left transition-all flex items-center justify-between",
              equipmentData.connectionType === conn.value
                ? equipmentData.connectionType === 'DIRECT_COPPER' && equipmentData.nippleMaterial === 'STEEL'
                  ? "border-red-500 bg-red-500/10"
                  : equipmentData.connectionType === 'DIRECT_COPPER' && (equipmentData.nippleMaterial === 'STAINLESS_BRASS' || equipmentData.nippleMaterial === 'FACTORY_PROTECTED')
                  ? "border-green-500 bg-green-500/10"
                  : equipmentData.connectionType === 'DIRECT_COPPER'
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-primary bg-primary/10"
                : "border-muted bg-card hover:border-primary/40"
            )}
          >
            <span className={cn(
              "font-medium",
              equipmentData.connectionType === conn.value
                ? equipmentData.connectionType === 'DIRECT_COPPER' && equipmentData.nippleMaterial === 'STEEL'
                  ? "text-red-700 dark:text-red-400"
                  : equipmentData.connectionType === 'DIRECT_COPPER' && (equipmentData.nippleMaterial === 'STAINLESS_BRASS' || equipmentData.nippleMaterial === 'FACTORY_PROTECTED')
                  ? "text-green-700 dark:text-green-400"
                  : "text-primary"
                : "text-foreground"
            )}>
              {conn.label}
            </span>
            {equipmentData.connectionType === conn.value && (
              <CheckCircle2 className={cn(
                "h-5 w-5",
                equipmentData.connectionType === 'DIRECT_COPPER' && equipmentData.nippleMaterial === 'STEEL'
                  ? "text-red-600"
                  : equipmentData.connectionType === 'DIRECT_COPPER' && (equipmentData.nippleMaterial === 'STAINLESS_BRASS' || equipmentData.nippleMaterial === 'FACTORY_PROTECTED')
                  ? "text-green-600"
                  : "text-primary"
              )} />
            )}
          </button>
        ))}
      </div>
      
      {/* Smart Galvanic Detection: Conditional UI based on Direct Copper selection */}
      {equipmentData.connectionType === 'DIRECT_COPPER' && (
        <div className="mt-6 space-y-4">
          {/* Factory Protected - Auto-verified */}
          {equipmentData.nippleMaterial === 'FACTORY_PROTECTED' && protectionExplanation && (
            <div className="p-4 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Factory Protected — No Corrosion Risk
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {protectionExplanation}
                </p>
              </div>
            </div>
          )}
          
          {/* Unknown Brand - Magnet Test Required */}
          {equipmentData.nippleMaterial === undefined && !isFactoryProtected && (
            <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <Magnet className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Verify Nipple Material
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Touch a magnet to the tank nipple (pipe sticking out of tank)
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleNippleMaterialSelect('STEEL')}
                  className="py-3 px-4 rounded-lg border-2 border-red-300 bg-red-50 dark:bg-red-500/10 dark:border-red-500/50 text-center transition-all hover:border-red-500"
                >
                  <span className="text-2xl block mb-1">🧲</span>
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">Magnetic</span>
                  <span className="text-xs text-red-600 dark:text-red-300 block">(Steel)</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleNippleMaterialSelect('STAINLESS_BRASS')}
                  className="py-3 px-4 rounded-lg border-2 border-green-300 bg-green-50 dark:bg-green-500/10 dark:border-green-500/50 text-center transition-all hover:border-green-500"
                >
                  <span className="text-2xl block mb-1">✓</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Non-Magnetic</span>
                  <span className="text-xs text-green-600 dark:text-green-300 block">(Stainless/Brass)</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Steel Nipple Confirmed - Critical Warning */}
          {equipmentData.nippleMaterial === 'STEEL' && (
            <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Galvanic Corrosion Confirmed — 3x Accelerated Aging
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Copper + steel creates an electrochemical cell that rapidly consumes the anode
                </p>
              </div>
            </div>
          )}
          
          {/* Stainless/Brass Verified - Safe */}
          {equipmentData.nippleMaterial === 'STAINLESS_BRASS' && (
            <div className="p-4 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Protected Connection — No Corrosion Risk
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Non-magnetic nipples block galvanic current
                </p>
              </div>
            </div>
          )}
          
          {/* Serviceability Warning - Always shown for Direct Copper */}
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Rigid copper piping may not meet seismic requirements. Consider flex lines at next service.
            </p>
          </div>
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
