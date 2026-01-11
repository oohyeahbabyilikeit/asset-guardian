import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft } from 'lucide-react';
import { 
  TechnicianInspectionData,
  DEFAULT_TECHNICIAN_DATA,
  DEFAULT_ASSET_IDENTIFICATION,
  DEFAULT_WATER_MEASUREMENTS,
  DEFAULT_LOCATION_CONDITION,
  DEFAULT_EQUIPMENT_CHECKLIST,
  DEFAULT_SOFTENER_INSPECTION,
  DEFAULT_HYBRID_INSPECTION,
  DEFAULT_TANKLESS_INSPECTION,
  isTankless,
  isHybrid,
} from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

import { AssetScanStep } from './steps/technician/AssetScanStep';
import { MeasurementsStep } from './steps/technician/MeasurementsStep';
import { LocationStep } from './steps/technician/LocationStep';
import { EquipmentStep } from './steps/technician/EquipmentStep';
import { SoftenerCheckStep } from './steps/technician/SoftenerCheckStep';
import { HybridCheckStep } from './steps/technician/HybridCheckStep';
import { TanklessCheckStep } from './steps/technician/TanklessCheckStep';
import { HandoffStep } from './steps/technician/HandoffStep';

type TechStep = 
  | 'asset-scan'
  | 'measurements'
  | 'location'
  | 'equipment'
  | 'softener'
  | 'hybrid'
  | 'tankless'
  | 'handoff';

interface TechnicianFlowProps {
  onComplete: (data: TechnicianInspectionData) => void;
  onBack: () => void;
  initialStreetHardness?: number;
}

function getStepOrder(fuelType: FuelType): TechStep[] {
  const base: TechStep[] = ['asset-scan', 'measurements', 'location', 'equipment', 'softener'];
  
  if (isHybrid(fuelType)) {
    return [...base, 'hybrid', 'handoff'];
  }
  if (isTankless(fuelType)) {
    return [...base, 'tankless', 'handoff'];
  }
  return [...base, 'handoff'];
}

export function TechnicianFlow({ onComplete, onBack, initialStreetHardness = 10 }: TechnicianFlowProps) {
  const [data, setData] = useState<TechnicianInspectionData>({
    ...DEFAULT_TECHNICIAN_DATA,
    streetHardnessGPG: initialStreetHardness,
  });
  
  const [currentStep, setCurrentStep] = useState<TechStep>('asset-scan');
  
  // Dynamic step order based on fuel type
  const stepOrder = getStepOrder(data.asset.fuelType);
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / stepOrder.length) * 100;
  
  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepOrder.length) {
      setCurrentStep(stepOrder[nextIndex]);
    }
  }, [currentStepIndex, stepOrder]);
  
  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(stepOrder[currentStepIndex - 1]);
    } else {
      onBack();
    }
  }, [currentStepIndex, stepOrder, onBack]);
  
  const updateAsset = useCallback((updates: Partial<typeof data.asset>) => {
    setData(prev => ({
      ...prev,
      asset: { ...prev.asset, ...updates },
    }));
  }, []);
  
  const updateMeasurements = useCallback((updates: Partial<typeof data.measurements>) => {
    setData(prev => ({
      ...prev,
      measurements: { ...prev.measurements, ...updates },
    }));
  }, []);
  
  const updateLocation = useCallback((updates: Partial<typeof data.location>) => {
    setData(prev => ({
      ...prev,
      location: { ...prev.location, ...updates },
    }));
  }, []);
  
  const updateEquipment = useCallback((updates: Partial<typeof data.equipment>) => {
    setData(prev => ({
      ...prev,
      equipment: { ...prev.equipment, ...updates },
    }));
  }, []);
  
  const updateSoftener = useCallback((updates: Partial<typeof data.softener>) => {
    setData(prev => ({
      ...prev,
      softener: { ...prev.softener, ...updates },
    }));
  }, []);
  
  const updateHybrid = useCallback((updates: Partial<NonNullable<typeof data.hybrid>>) => {
    setData(prev => ({
      ...prev,
      hybrid: { ...DEFAULT_HYBRID_INSPECTION, ...prev.hybrid, ...updates },
    }));
  }, []);
  
  const updateTankless = useCallback((updates: Partial<NonNullable<typeof data.tankless>>) => {
    setData(prev => ({
      ...prev,
      tankless: { ...DEFAULT_TANKLESS_INSPECTION, ...prev.tankless, ...updates },
    }));
  }, []);
  
  const handleAgeDetected = useCallback((age: number) => {
    setData(prev => ({ ...prev, calendarAge: age }));
  }, []);
  
  const handleComplete = useCallback(() => {
    // Ensure inspection timestamp is set
    const finalData: TechnicianInspectionData = {
      ...data,
      inspectedAt: new Date().toISOString(),
    };
    onComplete(finalData);
  }, [data, onComplete]);
  
  const renderStep = () => {
    switch (currentStep) {
      case 'asset-scan':
        return (
          <AssetScanStep
            data={data.asset}
            onUpdate={updateAsset}
            onAgeDetected={handleAgeDetected}
            onNext={goNext}
          />
        );
      
      case 'measurements':
        return (
          <MeasurementsStep
            data={data.measurements}
            fuelType={data.asset.fuelType}
            streetHardnessGPG={data.streetHardnessGPG}
            onUpdate={updateMeasurements}
            onNext={goNext}
          />
        );
      
      case 'location':
        return (
          <LocationStep
            data={data.location}
            onUpdate={updateLocation}
            onNext={goNext}
          />
        );
      
      case 'equipment':
        return (
          <EquipmentStep
            data={data.equipment}
            fuelType={data.asset.fuelType}
            housePsi={data.measurements.housePsi}
            onUpdate={updateEquipment}
            onNext={goNext}
          />
        );
      
      case 'softener':
        return (
          <SoftenerCheckStep
            data={data.softener}
            onUpdate={updateSoftener}
            onNext={goNext}
          />
        );
      
      case 'hybrid':
        return (
          <HybridCheckStep
            data={data.hybrid || DEFAULT_HYBRID_INSPECTION}
            onUpdate={updateHybrid}
            onNext={goNext}
          />
        );
      
      case 'tankless':
        return (
          <TanklessCheckStep
            data={data.tankless || DEFAULT_TANKLESS_INSPECTION}
            fuelType={data.asset.fuelType}
            onUpdate={updateTankless}
            onNext={goNext}
          />
        );
      
      case 'handoff':
        return (
          <HandoffStep
            data={data}
            onComplete={handleComplete}
          />
        );
      
      default:
        return null;
    }
  };
  
  const stepLabels: Record<TechStep, string> = {
    'asset-scan': 'Unit Identification',
    'measurements': 'Pressure & Water',
    'location': 'Location & Condition',
    'equipment': 'Equipment Check',
    'softener': 'Water Softener',
    'hybrid': 'Heat Pump Check',
    'tankless': 'Tankless Check',
    'handoff': 'Ready for Handoff',
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="shrink-0 -ml-2 hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary font-medium uppercase tracking-wider">
                Technician Inspection
              </p>
              <p className="text-base font-semibold text-foreground truncate">
                {stepLabels[currentStep]}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <span className="font-medium text-foreground">{currentStepIndex + 1}</span>
              <span>/</span>
              <span>{stepOrder.length}</span>
            </div>
          </div>
          
          {/* Progress bar with step indicators */}
          <div className="relative">
            <Progress value={progress} className="h-1.5" />
            <div className="absolute inset-0 flex justify-between items-center px-0">
              {stepOrder.map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index <= currentStepIndex 
                      ? 'bg-primary scale-100' 
                      : 'bg-muted-foreground/30 scale-75'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
