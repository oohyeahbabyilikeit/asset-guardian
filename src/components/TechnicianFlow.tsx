import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, ChevronDown, Lock, MapPin, Gauge, Scan, Settings2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { 
  TechnicianInspectionData,
  DEFAULT_TECHNICIAN_DATA,
  DEFAULT_HYBRID_INSPECTION,
  DEFAULT_TANKLESS_INSPECTION,
  isTankless,
  isHybrid,
  type BuildingType,
} from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { getHardnessFromCoordinates, getFallbackHardness } from '@/lib/services/waterQualityService';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';

import { AddressLookupStep, type NewPropertyAddress } from './steps/technician/AddressLookupStep';
import { BuildingTypeStep } from './steps/technician/BuildingTypeStep';
import { UnitTypeStep } from './steps/technician/UnitTypeStep';
import { AssetScanStep } from './steps/technician/AssetScanStep';
import { PressureStep } from './steps/technician/PressureStep';
import { EquipmentVerifyStep } from './steps/technician/EquipmentVerifyStep';
import { SoftenerCheckStep } from './steps/technician/SoftenerCheckStep';
import { HybridCheckStep } from './steps/technician/HybridCheckStep';
import { TanklessCheckStep } from './steps/technician/TanklessCheckStep';
import { LocationStep } from './steps/technician/LocationStep';
import { ReviewStep, type AIDetectedFields } from './steps/technician/ReviewStep';
import { HandoffStep } from './steps/technician/HandoffStep';

/**
 * TechnicianFlow v9.0 - "5-Minute Flow" Optimization
 * 
 * CONSOLIDATED steps:
 * 
 * 1. setup (address + building + unit type) - 30 sec
 * 2. readings (pressure + hardness) - 60 sec  
 * 3. asset-scan (AI-powered ID) - 60 sec
 * 4. location (location & visual condition) - 45 sec
 * 5. exceptions (verify installation toggles) - 60 sec
 * 6. unit-check (tankless/hybrid specific, or softener) - 30 sec
 * 7. confirm (review + handoff combined) - 60 sec
 */

type TechStep = 
  | 'setup'        // address + building-type + unit-type
  | 'readings'     // Pressure + hardness  
  | 'asset-scan'   // AI data plate scan
  | 'location'     // Location & visual condition
  | 'equipment'    // Equipment verification
  | 'unit-check'   // Tankless/Hybrid specific OR softener
  | 'confirm';     // Review + handoff

// Sub-steps within 'setup'
type SetupSubStep = 'address' | 'building' | 'unit';

// Sub-steps within 'unit-check'
type UnitCheckSubStep = 'tankless' | 'hybrid' | 'softener';

interface SelectedProperty {
  id: string;
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
}

interface TechnicianFlowProps {
  onComplete: (data: TechnicianInspectionData) => void;
  onBack: () => void;
  initialStreetHardness?: number;
}

const STEP_ORDER: TechStep[] = ['setup', 'readings', 'asset-scan', 'location', 'equipment', 'unit-check', 'confirm'];

export function TechnicianFlow({ onComplete, onBack, initialStreetHardness = 10 }: TechnicianFlowProps) {
  const [data, setData] = useState<TechnicianInspectionData>({
    ...DEFAULT_TECHNICIAN_DATA,
    streetHardnessGPG: initialStreetHardness,
  });
  const [pressurePhotoUrl, setPressurePhotoUrl] = useState<string | undefined>();
  
  // Offline sync
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    lastError,
    saveInspection,
    syncPendingInspections,
    startNewInspection,
  } = useOfflineSync({
    onSyncComplete: (id) => console.log('Synced inspection:', id),
    onSyncError: (id, error) => console.error('Sync failed for', id, error),
  });

  // Start a new inspection session on mount
  useEffect(() => {
    startNewInspection();
  }, [startNewInspection]);
  
  const [selectedProperty, setSelectedProperty] = useState<SelectedProperty | null>(null);
  const [newPropertyAddress, setNewPropertyAddress] = useState<NewPropertyAddress | null>(null);
  const [currentStep, setCurrentStep] = useState<TechStep>('setup');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Sub-step tracking for multi-part steps
  const [setupSubStep, setSetupSubStep] = useState<SetupSubStep>('address');
  const [unitCheckSubStep, setUnitCheckSubStep] = useState<UnitCheckSubStep>('softener');
  
  // Track which fields were detected by AI for the review step
  const [aiDetectedFields, setAIDetectedFields] = useState<AIDetectedFields>({});
  
  // Track which steps have been visited for free navigation
  const [visitedSteps, setVisitedSteps] = useState<Set<TechStep>>(new Set(['setup']));
  
  // Determine which unit-check sub-step to show based on fuel type
  useEffect(() => {
    if (isTankless(data.asset.fuelType)) {
      setUnitCheckSubStep('tankless');
    } else if (isHybrid(data.asset.fuelType)) {
      setUnitCheckSubStep('hybrid');
    } else {
      setUnitCheckSubStep('softener');
    }
  }, [data.asset.fuelType]);

  // Auto-fetch water hardness when GPS coordinates become available
  useEffect(() => {
    if (gpsCoords) {
      const stateCode = selectedProperty?.state || newPropertyAddress?.state;
      getHardnessFromCoordinates(gpsCoords.lat, gpsCoords.lng, stateCode)
        .then((result) => {
          if (result) {
            setData(prev => ({ ...prev, streetHardnessGPG: result.hardnessGPG }));
            console.log(`💧 Water hardness: ${result.hardnessGPG} GPG (${result.source})`);
          }
        })
        .catch(console.error);
    } else if (selectedProperty?.state || newPropertyAddress?.state) {
      const stateCode = selectedProperty?.state || newPropertyAddress?.state || 'DEFAULT';
      const fallback = getFallbackHardness(stateCode);
      setData(prev => ({ ...prev, streetHardnessGPG: fallback.hardnessGPG }));
    }
  }, [gpsCoords, selectedProperty?.state, newPropertyAddress?.state]);
  
  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  
  // Mark current step as visited whenever it changes
  useEffect(() => {
    setVisitedSteps(prev => {
      if (prev.has(currentStep)) return prev;
      return new Set([...prev, currentStep]);
    });
  }, [currentStep]);
  
  // Navigation to a specific step (for clickable indicators)
  const goToStep = useCallback((step: TechStep) => {
    const stepIndex = STEP_ORDER.indexOf(step);
    const canNavigate = visitedSteps.has(step) || stepIndex === currentStepIndex + 1;
    if (canNavigate && stepIndex !== -1) {
      setCurrentStep(step);
    }
  }, [visitedSteps, currentStepIndex]);
  
  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex]);
  
  const goBack = useCallback(() => {
    // Handle sub-step navigation first
    if (currentStep === 'setup') {
      if (setupSubStep === 'unit') {
        setSetupSubStep('building');
        return;
      } else if (setupSubStep === 'building') {
        setSetupSubStep('address');
        return;
      } else {
        onBack();
        return;
      }
    }
    
    if (currentStepIndex > 0) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    } else {
      onBack();
    }
  }, [currentStep, setupSubStep, currentStepIndex, onBack]);
  
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
    setAIDetectedFields(prev => ({ ...prev, calendarAge: true }));
  }, []);
  
  const handleAIDetection = useCallback((fields: Record<string, boolean>) => {
    setAIDetectedFields(prev => ({ ...prev, ...fields }));
  }, []);
  
  const handlePropertySelect = useCallback((property: SelectedProperty | null, coords?: { lat: number; lng: number }) => {
    if (property) {
      setSelectedProperty(property);
    }
    if (coords) {
      setGpsCoords(coords);
    }
    setSetupSubStep('building');
  }, []);

  const handleCreateNewProperty = useCallback((address: NewPropertyAddress) => {
    setNewPropertyAddress(address);
    if (address.gpsCoords) {
      setGpsCoords(address.gpsCoords);
    }
    setSetupSubStep('building');
  }, []);
  
  const updateBuildingType = useCallback((buildingType: BuildingType) => {
    setData(prev => ({ ...prev, buildingType }));
  }, []);

  const handleComplete = useCallback(async (context: { handoffMode: 'tablet' | 'remote'; homeownerName?: string }) => {
    const finalData: TechnicianInspectionData = {
      ...data,
      inspectedAt: new Date().toISOString(),
      handoffMode: context.handoffMode,
      homeownerContext: context.homeownerName ? { name: context.homeownerName } : undefined,
      // TODO: contractorContext should come from authenticated user profile
      contractorContext: {
        companyName: 'Your Plumbing Co.', // Placeholder until auth
        companyPhone: '555-0199',          // Placeholder until auth
      },
    };
    
    const photos: { url: string; type: 'pressure' | 'condition' | 'dataplate' | 'other' }[] = [];
    if (pressurePhotoUrl) {
      photos.push({ url: pressurePhotoUrl, type: 'pressure' });
    }
    
    // Pass the new address if creating a new property (convert to sync format)
    const newAddress = newPropertyAddress ? {
      line1: newPropertyAddress.address_line1,
      line2: undefined,
      city: newPropertyAddress.city,
      state: newPropertyAddress.state,
      zip: newPropertyAddress.zip_code,
    } : undefined;
    
    await saveInspection(finalData, selectedProperty?.id, photos, newAddress);
    onComplete(finalData);
  }, [data, pressurePhotoUrl, selectedProperty?.id, newPropertyAddress, saveInspection, onComplete]);
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'setup':
        // Multi-part setup step
        if (setupSubStep === 'address') {
          return (
            <AddressLookupStep
              onSelectProperty={handlePropertySelect}
              onCreateNew={handleCreateNewProperty}
              onBack={onBack}
            />
          );
        } else if (setupSubStep === 'building') {
          return (
            <BuildingTypeStep
              selectedType={data.buildingType || null}
              onSelect={updateBuildingType}
              onNext={() => setSetupSubStep('unit')}
            />
          );
        } else {
          return (
            <UnitTypeStep
              selectedType={data.asset.fuelType}
              onSelect={(type) => updateAsset({ fuelType: type })}
              onNext={goNext}
              onCannotInspect={(reason) => {
                console.log(`Cannot inspect: ${reason}`);
                onBack();
              }}
            />
          );
        }
      
      case 'readings':
        return (
          <PressureStep
            data={data.measurements}
            fuelType={data.asset.fuelType}
            streetHardnessGPG={data.streetHardnessGPG}
            pressurePhotoUrl={pressurePhotoUrl}
            equipmentData={data.equipment}
            onUpdate={updateMeasurements}
            onEquipmentUpdate={updateEquipment}
            onPressurePhoto={setPressurePhotoUrl}
            onNext={goNext}
          />
        );
      
      case 'asset-scan':
        return (
          <AssetScanStep
            data={data.asset}
            onUpdate={updateAsset}
            onAgeDetected={handleAgeDetected}
            onAIDetection={handleAIDetection}
            onNext={goNext}
          />
        );
      
      case 'location':
        return (
          <LocationStep
            data={data.location}
            equipmentData={data.equipment}
            onUpdate={updateLocation}
            onEquipmentUpdate={updateEquipment}
            onAIDetection={handleAIDetection}
            onNext={goNext}
          />
        );
      
      case 'equipment':
        return (
          <EquipmentVerifyStep
            assetData={data.asset}
            locationData={data.location}
            equipmentData={data.equipment}
            onAssetUpdate={updateAsset}
            onEquipmentUpdate={updateEquipment}
            onNext={goNext}
          />
        );
      
      case 'unit-check':
        // Show unit-specific checks based on fuel type
        if (unitCheckSubStep === 'tankless') {
          return (
            <TanklessCheckStep
              data={data.tankless || DEFAULT_TANKLESS_INSPECTION}
              measurements={data.measurements}
              fuelType={data.asset.fuelType}
              onUpdate={updateTankless}
              onUpdateMeasurements={updateMeasurements}
              onAIDetection={handleAIDetection}
              onNext={goNext}
            />
          );
        } else if (unitCheckSubStep === 'hybrid') {
          return (
            <HybridCheckStep
              data={data.hybrid || DEFAULT_HYBRID_INSPECTION}
              onUpdate={updateHybrid}
              onNext={goNext}
            />
          );
        } else {
          return (
            <SoftenerCheckStep
              data={data.softener}
              onUpdate={updateSoftener}
              onNext={goNext}
            />
          );
        }
      
      case 'confirm':
        // Combined review + handoff
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
    'setup': setupSubStep === 'address' ? 'Property Lookup' : 
             setupSubStep === 'building' ? 'Building Type' : 'Unit Type',
    'readings': 'Pressure & Hardness',
    'asset-scan': 'Unit Identification',
    'location': 'Location & Condition',
    'equipment': 'Equipment Verification',
    'unit-check': unitCheckSubStep === 'tankless' ? 'Tankless Check' :
                  unitCheckSubStep === 'hybrid' ? 'Heat Pump Check' : 'Softener Check',
    'confirm': 'Confirm & Complete',
  };
  
  const stepIcons: Record<TechStep, React.ReactNode> = {
    'setup': <MapPin className="h-4 w-4" />,
    'readings': <Gauge className="h-4 w-4" />,
    'asset-scan': <Scan className="h-4 w-4" />,
    'location': <MapPin className="h-4 w-4" />,
    'equipment': <Settings2 className="h-4 w-4" />,
    'unit-check': <Settings2 className="h-4 w-4" />,
    'confirm': <CheckCircle className="h-4 w-4" />,
  };
  
  const [stepDrawerOpen, setStepDrawerOpen] = useState(false);
  
  const handleStepSelect = useCallback((step: TechStep) => {
    const stepIndex = STEP_ORDER.indexOf(step);
    const canNavigate = visitedSteps.has(step) || stepIndex === currentStepIndex + 1;
    if (canNavigate && stepIndex !== -1) {
      setCurrentStep(step);
      setStepDrawerOpen(false);
    }
  }, [visitedSteps, currentStepIndex]);
  
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBack}
                className="shrink-0 -ml-2 hover:bg-muted min-h-[44px] min-w-[44px]"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-medium uppercase tracking-wider">
                  5-Min Assessment
                </p>
                <p className="text-base font-semibold text-foreground truncate">
                  {stepLabels[currentStep]}
                </p>
              </div>
              
              {/* Offline sync indicator */}
              <OfflineSyncIndicator
                isOnline={isOnline}
                isSyncing={isSyncing}
                pendingCount={pendingCount}
                lastSyncAt={lastSyncAt}
                lastError={lastError}
                onManualSync={syncPendingInspections}
              />
              
              {/* Step counter with drawer trigger */}
              <Drawer open={stepDrawerOpen} onOpenChange={setStepDrawerOpen}>
                <DrawerTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-2.5 py-1 rounded-full hover:bg-muted/80 transition-colors">
                    <span className="font-medium text-foreground">{currentStepIndex + 1}</span>
                    <span>/</span>
                    <span>{STEP_ORDER.length}</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="pb-2">
                    <DrawerTitle>Inspection Steps</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 space-y-1">
                    {STEP_ORDER.map((step, index) => {
                      const isVisited = visitedSteps.has(step);
                      const isCurrent = step === currentStep;
                      const isNext = index === currentStepIndex + 1;
                      const canNavigate = (isVisited || isNext) && !isCurrent;
                      
                      return (
                        <button
                          key={step}
                          onClick={() => handleStepSelect(step)}
                          disabled={!canNavigate && !isCurrent}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                            isCurrent && "bg-primary/10 text-primary",
                            canNavigate && "hover:bg-muted cursor-pointer",
                            !canNavigate && !isCurrent && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                            isCurrent && "bg-primary text-primary-foreground",
                            isVisited && !isCurrent && "bg-primary/20 text-primary",
                            !isVisited && !isCurrent && "bg-muted text-muted-foreground"
                          )}>
                            {isVisited && !isCurrent ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              stepIcons[step]
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-medium truncate",
                              isCurrent && "text-primary",
                              !isCurrent && "text-foreground"
                            )}>
                              {stepLabels[step]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Step {index + 1} of {STEP_ORDER.length}
                            </p>
                          </div>
                          {!canNavigate && !isCurrent && (
                            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          {isCurrent && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
            
            {/* Clickable step navigation */}
            <div className="flex justify-between items-center gap-1">
              {STEP_ORDER.map((step, index) => {
                const isVisited = visitedSteps.has(step);
                const isCurrent = step === currentStep;
                const isNext = index === currentStepIndex + 1;
                const canClick = (isVisited || isNext) && !isCurrent;
                
                return (
                  <Tooltip key={step}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => canClick && goToStep(step)}
                        disabled={!canClick && !isCurrent}
                        aria-label={stepLabels[step]}
                        aria-current={isCurrent ? 'step' : undefined}
                        className={cn(
                          "flex-1 h-2 rounded-full transition-all duration-200",
                          isCurrent && "bg-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
                          isVisited && !isCurrent && "bg-primary/60 hover:bg-primary/80 cursor-pointer",
                          !isVisited && !isCurrent && isNext && "bg-muted-foreground/40 hover:bg-muted-foreground/60 cursor-pointer",
                          !isVisited && !isCurrent && !isNext && "bg-muted-foreground/20 cursor-not-allowed"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        {isVisited && !isCurrent && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                        <span>{stepLabels[step]}</span>
                        {!canClick && !isCurrent && (
                          <span className="text-muted-foreground">(locked)</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
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
    </TooltipProvider>
  );
}
