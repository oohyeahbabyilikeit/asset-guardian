import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, ChevronDown, Lock, MapPin, Gauge, Scan, Navigation, Flame, Zap, Droplets, Flag, ClipboardCheck } from 'lucide-react';
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
} from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { getHardnessFromCoordinates, getFallbackHardness } from '@/lib/services/waterQualityService';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';

import { AddressLookupStep, type NewPropertyAddress } from './steps/technician/AddressLookupStep';
import { AssetScanStep } from './steps/technician/AssetScanStep';
import { PressureStep } from './steps/technician/PressureStep';
import { LocationStep } from './steps/technician/LocationStep';
import { SoftenerCheckStep } from './steps/technician/SoftenerCheckStep';
import { HybridCheckStep } from './steps/technician/HybridCheckStep';
import { TanklessCheckStep } from './steps/technician/TanklessCheckStep';
import { ReviewStep, type AIDetectedFields } from './steps/technician/ReviewStep';
import { HandoffStep } from './steps/technician/HandoffStep';

// Optimized step order for minimal backtracking:
// 1. Address Lookup (truck/driveway)
// 2. Pressure (exterior hose bib)
// 3. Asset Scan (at the unit)
// 4. Location & Equipment (at the unit - merged for efficiency)
// 5. Tankless/Hybrid specifics (at the unit - if applicable)
// 6. Softener (different location - often separate area)
// 7. Review (verify all AI-detected and algorithm-affecting values)
// 8. Handoff

type TechStep = 
  | 'address-lookup'
  | 'pressure'
  | 'asset-scan'
  | 'location'
  | 'tankless'
  | 'hybrid'
  | 'softener'
  | 'review'
  | 'handoff';

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

function getStepOrder(fuelType: FuelType): TechStep[] {
  // Linear path optimized for physical location flow:
  // Truck → Hose Bib → Water Heater → Softener → Review → Done
  const base: TechStep[] = ['address-lookup', 'pressure', 'asset-scan', 'location'];
  
  // Add unit-specific checks while still at the water heater
  if (isTankless(fuelType)) {
    return [...base, 'tankless', 'softener', 'review', 'handoff'];
  }
  if (isHybrid(fuelType)) {
    return [...base, 'hybrid', 'softener', 'review', 'handoff'];
  }
  
  // Standard tank units go straight to softener check, then review
  return [...base, 'softener', 'review', 'handoff'];
}

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
  const [currentStep, setCurrentStep] = useState<TechStep>('address-lookup');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Track which fields were detected by AI for the review step
  const [aiDetectedFields, setAIDetectedFields] = useState<AIDetectedFields>({});
  
  // Track which steps have been visited for free navigation
  const [visitedSteps, setVisitedSteps] = useState<Set<TechStep>>(new Set(['address-lookup']));

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
      // Fallback to state-based estimate if no GPS
      const stateCode = selectedProperty?.state || newPropertyAddress?.state || 'DEFAULT';
      const fallback = getFallbackHardness(stateCode);
      setData(prev => ({ ...prev, streetHardnessGPG: fallback.hardnessGPG }));
    }
  }, [gpsCoords, selectedProperty?.state, newPropertyAddress?.state]);
  
  const stepOrder = getStepOrder(data.asset.fuelType);
  const currentStepIndex = stepOrder.indexOf(currentStep);
  
  // Mark current step as visited whenever it changes
  useEffect(() => {
    setVisitedSteps(prev => {
      if (prev.has(currentStep)) return prev;
      return new Set([...prev, currentStep]);
    });
  }, [currentStep]);
  
  // Handle fuel type changes - reset type-specific step visits
  const previousFuelTypeRef = React.useRef(data.asset.fuelType);
  useEffect(() => {
    if (previousFuelTypeRef.current !== data.asset.fuelType) {
      previousFuelTypeRef.current = data.asset.fuelType;
      const commonSteps: TechStep[] = ['address-lookup', 'pressure', 'asset-scan', 'location', 'softener', 'handoff'];
      setVisitedSteps(prev => {
        const filtered = new Set<TechStep>();
        prev.forEach(step => {
          if (commonSteps.includes(step)) {
            filtered.add(step);
          }
        });
        return filtered;
      });
    }
  }, [data.asset.fuelType]);
  
  // Navigation to a specific step (for clickable indicators)
  const goToStep = useCallback((step: TechStep) => {
    const stepIndex = stepOrder.indexOf(step);
    const canNavigate = visitedSteps.has(step) || stepIndex === currentStepIndex + 1;
    if (canNavigate && stepIndex !== -1) {
      setCurrentStep(step);
    }
  }, [stepOrder, visitedSteps, currentStepIndex]);
  
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
    // Age detection from serial decoder is also AI-assisted
    setAIDetectedFields(prev => ({ ...prev, calendarAge: true }));
  }, []);
  
  // Handler for tracking AI-detected fields from scans
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
    setCurrentStep('pressure');
  }, []);

  const handleCreateNewProperty = useCallback((address: NewPropertyAddress) => {
    setNewPropertyAddress(address);
    if (address.gpsCoords) {
      setGpsCoords(address.gpsCoords);
    }
    setCurrentStep('pressure');
  }, []);

  const handleComplete = useCallback(async () => {
    const finalData: TechnicianInspectionData = {
      ...data,
      inspectedAt: new Date().toISOString(),
    };
    
    // Collect photos for offline storage
    const photos: { url: string; type: 'pressure' | 'condition' | 'dataplate' | 'other' }[] = [];
    if (pressurePhotoUrl) {
      photos.push({ url: pressurePhotoUrl, type: 'pressure' });
    }
    
    // Save to offline storage (will auto-sync if online)
    await saveInspection(finalData, selectedProperty?.id, photos);
    
    onComplete(finalData);
  }, [data, pressurePhotoUrl, selectedProperty?.id, saveInspection, onComplete]);
  
  const renderStep = () => {
    switch (currentStep) {
      case 'address-lookup':
        return (
          <AddressLookupStep
            onSelectProperty={handlePropertySelect}
            onCreateNew={handleCreateNewProperty}
          />
        );
      
      case 'pressure':
        return (
          <PressureStep
            data={data.measurements}
            fuelType={data.asset.fuelType}
            streetHardnessGPG={data.streetHardnessGPG}
            pressurePhotoUrl={pressurePhotoUrl}
            onUpdate={updateMeasurements}
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
      
      case 'tankless':
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
      
      case 'hybrid':
        return (
          <HybridCheckStep
            data={data.hybrid || DEFAULT_HYBRID_INSPECTION}
            onUpdate={updateHybrid}
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
      
      case 'review':
        return (
          <ReviewStep
            data={data}
            aiDetectedFields={aiDetectedFields}
            onUpdate={(updates) => setData(prev => ({ ...prev, ...updates }))}
            onConfirm={goNext}
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
    'address-lookup': 'Property Lookup',
    'pressure': 'Pressure & Hardness',
    'asset-scan': 'Unit Identification',
    'location': 'Location & Equipment',
    'tankless': 'Tankless Check',
    'hybrid': 'Heat Pump Check',
    'softener': 'Water Softener',
    'review': 'Review & Verify',
    'handoff': 'Ready for Handoff',
  };
  
  const stepIcons: Record<TechStep, React.ReactNode> = {
    'address-lookup': <MapPin className="h-4 w-4" />,
    'pressure': <Gauge className="h-4 w-4" />,
    'asset-scan': <Scan className="h-4 w-4" />,
    'location': <Navigation className="h-4 w-4" />,
    'tankless': <Flame className="h-4 w-4" />,
    'hybrid': <Zap className="h-4 w-4" />,
    'softener': <Droplets className="h-4 w-4" />,
    'review': <ClipboardCheck className="h-4 w-4" />,
    'handoff': <Flag className="h-4 w-4" />,
  };
  
  const [stepDrawerOpen, setStepDrawerOpen] = useState(false);
  
  const handleStepSelect = useCallback((step: TechStep) => {
    const stepIndex = stepOrder.indexOf(step);
    const canNavigate = visitedSteps.has(step) || stepIndex === currentStepIndex + 1;
    if (canNavigate && stepIndex !== -1) {
      setCurrentStep(step);
      setStepDrawerOpen(false);
    }
  }, [stepOrder, visitedSteps, currentStepIndex]);
  
  return (
    <TooltipProvider delayDuration={300}>
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
                    <span>{stepOrder.length}</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="pb-2">
                    <DrawerTitle>Inspection Steps</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 space-y-1">
                    {stepOrder.map((step, index) => {
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
                              Step {index + 1} of {stepOrder.length}
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
              {stepOrder.map((step, index) => {
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
