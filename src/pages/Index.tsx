import { useState, useCallback, useEffect, useMemo } from 'react';
import { HandshakeLoading } from '@/components/HandshakeLoading';
import { CommandCenter } from '@/components/CommandCenter';
import { SoftenerCenter } from '@/components/SoftenerCenter';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { DiscoveryFlow } from '@/components/DiscoveryFlow';
import { ForensicReport } from '@/components/ForensicReport';
import { PanicMode } from '@/components/PanicMode';
import { ServiceRequest } from '@/components/ServiceRequest';
import { RepairPlanner } from '@/components/RepairPlanner';
import { MaintenancePlan } from '@/components/MaintenancePlan';
import { SoftenerMaintenancePlan } from '@/components/SoftenerMaintenancePlan';
import { AlgorithmTestHarness } from '@/components/AlgorithmTestHarness';
import { SafetyAssessmentPage } from '@/components/SafetyAssessmentPage';
import { ReplacementOptionsPage } from '@/components/ReplacementOptionsPage';
import { ModeSelectScreen } from '@/components/ModeSelectScreen';
import { TechnicianFlow } from '@/components/TechnicianFlow';
import { RepairOption } from '@/data/repairOptions';
import { demoAsset, demoForensicInputs, demoServiceHistory, getRandomScenario, type AssetData } from '@/data/mockAsset';
import { type ForensicInputs, calculateOpterraRisk, OpterraMetrics } from '@/lib/opterraAlgorithm';
import { getInfrastructureIssues } from '@/lib/infrastructureIssues';
import { ServiceEvent, deriveInputsFromServiceHistory } from '@/types/serviceHistory';
import { SoftenerInputs, DEFAULT_SOFTENER_INPUTS } from '@/lib/softenerAlgorithm';
import { OnboardingData, mapOnboardingToForensicInputs, mapOnboardingToSoftenerInputs } from '@/types/onboarding';
import { TechnicianInspectionData } from '@/types/technicianInspection';
import { mapTechnicianToForensicInputs, mapTechnicianToAssetDisplay } from '@/types/technicianMapper';
import { CalibrationFlow } from '@/components/CalibrationFlow';

type Screen = 
  | 'mode-select'
  | 'technician'
  | 'calibration'
  | 'welcome' 
  | 'onboarding' 
  | 'discovery' 
  | 'loading' 
  | 'dashboard' 
  | 'report' 
  | 'panic' 
  | 'service' 
  | 'safety-assessment'
  | 'replacement-options'
  | 'repair-planner' 
  | 'maintenance-plan' 
  | 'softener-maintenance' 
  | 'test-harness';

// Only 2 asset types: Water Heater (can be GAS, ELECTRIC, or HYBRID/heat pump) and Softener
type AssetType = 'water-heater' | 'softener';

// Helper to convert metrics to stress factors - UNIT-TYPE AWARE
function convertMetricsToStressFactors(
  metrics: OpterraMetrics, 
  fuelType: ForensicInputs['fuelType']
): { name: string; level: 'low' | 'moderate' | 'elevated' | 'critical'; value: number; description: string }[] {
  const factors: { name: string; level: 'low' | 'moderate' | 'elevated' | 'critical'; value: number; description: string }[] = [];
  
  const getLevel = (value: number): 'low' | 'moderate' | 'elevated' | 'critical' => {
    if (value >= 2.0) return 'critical';
    if (value >= 1.5) return 'elevated';
    if (value >= 1.2) return 'moderate';
    return 'low';
  };

  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
  const isHybrid = fuelType === 'HYBRID';
  
  // Cast metrics to access unit-specific properties
  // NOTE: scaleBuildupScore (not scaleBuildup) is the correct property from the tankless algorithm
  const extMetrics = metrics as OpterraMetrics & { 
    scaleBuildupScore?: number; 
    flowDegradation?: number; 
    igniterHealth?: number;
    airFilterStatus?: string;
    isCondensateClear?: boolean;
  };

  // TANKLESS-specific stress factors
  if (isTankless) {
    // Scale buildup - use scaleBuildupScore from algorithm
    if (extMetrics.scaleBuildupScore !== undefined && extMetrics.scaleBuildupScore > 10) {
      const level = extMetrics.scaleBuildupScore > 35 ? 'critical' : extMetrics.scaleBuildupScore > 25 ? 'elevated' : 'moderate';
      factors.push({ name: 'Scale Buildup', level, value: extMetrics.scaleBuildupScore / 100, description: `${extMetrics.scaleBuildupScore.toFixed(0)}% scale in heat exchanger` });
    }
    // Flow degradation
    if (extMetrics.flowDegradation !== undefined && extMetrics.flowDegradation > 10) {
      const level = extMetrics.flowDegradation > 30 ? 'critical' : extMetrics.flowDegradation > 20 ? 'elevated' : 'moderate';
      factors.push({ name: 'Flow Restriction', level, value: extMetrics.flowDegradation / 100, description: `${extMetrics.flowDegradation.toFixed(0)}% flow reduction` });
    }
    // Igniter health (for gas tankless)
    if (extMetrics.igniterHealth !== undefined && extMetrics.igniterHealth < 70) {
      factors.push({ name: 'Igniter Health', level: extMetrics.igniterHealth < 50 ? 'critical' : 'elevated', value: extMetrics.igniterHealth / 100, description: `Igniter at ${extMetrics.igniterHealth}%` });
    }
    // Recirculation fatigue
    if (metrics.stressFactors.circ > 1.0) {
      factors.push({ name: 'Recirculation Fatigue', level: getLevel(metrics.stressFactors.circ), value: metrics.stressFactors.circ, description: 'Recirculation increasing wear' });
    }
    return factors;
  }

  // HYBRID-specific stress factors
  if (isHybrid) {
    if (extMetrics.airFilterStatus === 'CLOGGED') {
      factors.push({ name: 'Air Filter Clogged', level: 'critical', value: 0, description: 'Clogged filter straining compressor' });
    } else if (extMetrics.airFilterStatus === 'DIRTY') {
      factors.push({ name: 'Air Filter Dirty', level: 'elevated', value: 0.5, description: 'Filter restricting airflow' });
    }
    if (extMetrics.isCondensateClear === false) {
      factors.push({ name: 'Condensate Blocked', level: 'critical', value: 0, description: 'Condensate drain blocked' });
    }
  }

  // TANK and HYBRID tank-related stress factors
  if (metrics.stressFactors.pressure > 1.0) {
    factors.push({ name: 'Water Pressure', level: getLevel(metrics.stressFactors.pressure), value: metrics.stressFactors.pressure, description: `Pressure stress ${metrics.stressFactors.pressure.toFixed(2)}x` });
  }
  if (metrics.stressFactors.sediment > 1.0) {
    factors.push({ name: isHybrid ? 'Tank Sediment' : 'Sediment Buildup', level: metrics.sedimentLbs > 15 ? 'critical' : metrics.sedimentLbs > 8 ? 'elevated' : 'moderate', value: metrics.stressFactors.sediment, description: `${metrics.sedimentLbs.toFixed(1)} lbs accumulated` });
  }
  if (metrics.stressFactors.temp > 1.0) {
    factors.push({ name: 'Temperature Stress', level: getLevel(metrics.stressFactors.temp), value: metrics.stressFactors.temp, description: `Temperature stress ${metrics.stressFactors.temp.toFixed(2)}x` });
  }
  if (metrics.stressFactors.loop > 1.0) {
    factors.push({ name: 'Thermal Expansion', level: getLevel(metrics.stressFactors.loop), value: metrics.stressFactors.loop, description: 'Missing expansion tank' });
  }
  if (metrics.stressFactors.circ > 1.0 && !isHybrid) {
    factors.push({ name: 'Recirculation Loop', level: getLevel(metrics.stressFactors.circ), value: metrics.stressFactors.circ, description: 'Continuous circulation wear' });
  }
  if (metrics.shieldLife <= 0) {
    factors.push({ name: 'Anode Depletion', level: 'critical', value: 0, description: 'Anode fully depleted' });
  } else if (metrics.shieldLife < 2) {
    factors.push({ name: 'Anode Depletion', level: 'elevated', value: metrics.shieldLife, description: `${metrics.shieldLife.toFixed(1)} years remaining` });
  }
  return factors;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('mode-select');
  const [technicianData, setTechnicianData] = useState<TechnicianInspectionData | null>(null);
  const [assetType, setAssetType] = useState<AssetType>('water-heater');
  const [selectedRepairs, setSelectedRepairs] = useState<RepairOption[]>([]);
  
  // Shared scenario state - use stable default values
  const [scenarioName, setScenarioName] = useState<string>('');
  const [currentAsset, setCurrentAsset] = useState<AssetData>(demoAsset);
  const [currentInputs, setCurrentInputs] = useState<ForensicInputs>(demoForensicInputs);
  
  // Softener inputs (synced with water heater where applicable)
  const [softenerInputs, setSoftenerInputs] = useState<SoftenerInputs>({
    ...DEFAULT_SOFTENER_INPUTS,
    hardnessGPG: demoForensicInputs.hardnessGPG,
    people: demoForensicInputs.peopleCount,
  });

  // Shared service history state
  const [serviceHistory, setServiceHistory] = useState<ServiceEvent[]>(demoServiceHistory);
  
  // Calculate Opterra result once and memoize
  const opterraResult = useMemo(() => calculateOpterraRisk(currentInputs), [currentInputs]);
  const infrastructureIssues = useMemo(() => 
    getInfrastructureIssues(currentInputs, opterraResult.metrics),
    [currentInputs, opterraResult.metrics]
  );
  
  // Derive replacement flags
  const replacementRequired = opterraResult.verdict.action === 'REPLACE';
  const isSafetyReplacement = replacementRequired && opterraResult.verdict.badge === 'CRITICAL';
  const isEconomicReplacement = replacementRequired && opterraResult.verdict.badge !== 'CRITICAL';
  
  // When service history changes, update the relevant inputs
  useEffect(() => {
    if (serviceHistory.length > 0) {
      const derived = deriveInputsFromServiceHistory(serviceHistory);
      setCurrentInputs(prev => ({
        ...prev,
        lastFlushYearsAgo: derived.lastFlushYearsAgo ?? prev.lastFlushYearsAgo,
        lastAnodeReplaceYearsAgo: derived.lastAnodeReplaceYearsAgo ?? prev.lastAnodeReplaceYearsAgo,
      }));
    }
  }, [serviceHistory]);

  // Sync softener inputs when water heater inputs change
  useEffect(() => {
    setSoftenerInputs(prev => ({
      ...prev,
      hardnessGPG: currentInputs.hardnessGPG,
      people: currentInputs.peopleCount,
      hasCarbonFilter: currentInputs.hasSoftener,
    }));
  }, [currentInputs.hardnessGPG, currentInputs.peopleCount, currentInputs.hasSoftener]);

  const handleRandomize = useCallback(() => {
    const newScenario = getRandomScenario();
    setCurrentAsset(newScenario.asset);
    setCurrentInputs(newScenario.inputs);
    setScenarioName(newScenario.name);
    setServiceHistory(newScenario.serviceHistory || []);
  }, []);
  
  const handleAddServiceEvent = useCallback((event: ServiceEvent) => {
    setServiceHistory(prev => [...prev, event]);
  }, []);

  const handleLoadingComplete = () => {
    setCurrentScreen('dashboard');
  };

  const handleWelcomeComplete = () => {
    setCurrentScreen('onboarding');
  };

  const handleModeSelect = useCallback((mode: 'technician' | 'demo') => {
    if (mode === 'technician') {
      setCurrentScreen('technician');
    } else {
      // Demo mode: Use demo data and go straight to calibration
      setCurrentInputs(demoForensicInputs);
      setCurrentAsset(demoAsset);
      setCurrentScreen('calibration');
    }
  }, []);

  const handleTechnicianComplete = useCallback((data: TechnicianInspectionData) => {
    setTechnicianData(data);
    
    // Map technician data to ForensicInputs
    const forensicInputs = mapTechnicianToForensicInputs(data);
    setCurrentInputs(forensicInputs);
    
    // Map to asset display data
    const assetDisplay = mapTechnicianToAssetDisplay(data);
    setCurrentAsset({
      ...currentAsset,
      type: assetDisplay.type,
      brand: assetDisplay.brand,
      model: assetDisplay.model,
      serialNumber: assetDisplay.serialNumber,
      paperAge: assetDisplay.calendarAge,
      location: assetDisplay.location,
      specs: {
        ...currentAsset.specs,
        capacity: assetDisplay.specs.capacity,
        fuelType: assetDisplay.specs.fuelType,
        ventType: assetDisplay.specs.ventType,
      },
    });
    
    // Go to calibration flow (SMS-to-Reveal experience)
    setCurrentScreen('calibration');
  }, [currentAsset]);

  const handleOnboardingComplete = (data: OnboardingData) => {
    const newForensicInputs = mapOnboardingToForensicInputs(data, currentInputs);
    const newSoftenerInputs = mapOnboardingToSoftenerInputs(data, softenerInputs);
    
    setCurrentInputs(newForensicInputs);
    setSoftenerInputs(newSoftenerInputs);
    setCurrentScreen('discovery');
  };

  const handleDiscoveryComplete = () => {
    setCurrentScreen('dashboard');
  };

  // Handle navigation to repair/replacement flow
  const handleServiceNavigation = () => {
    if (replacementRequired) {
      // Go to safety assessment page first
      setCurrentScreen('safety-assessment');
    } else {
      // Go directly to repair planner for non-replacement flows
      setCurrentScreen('repair-planner');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'mode-select':
        return <ModeSelectScreen onSelectMode={handleModeSelect} />;
      
      case 'technician':
        return (
          <TechnicianFlow
            onComplete={handleTechnicianComplete}
            onBack={() => setCurrentScreen('mode-select')}
            initialStreetHardness={10}
          />
        );
      
      case 'calibration':
        return (
          <CalibrationFlow
            baseInputs={currentInputs}
            brand={currentAsset.brand}
            model={currentAsset.model}
            onComplete={(result, calibratedInputs) => {
              setCurrentInputs(calibratedInputs);
              setCurrentScreen('dashboard');
            }}
          />
        );
      
      case 'welcome':
        return <WelcomeScreen onBegin={handleWelcomeComplete} />;
      
      case 'onboarding':
        return (
          <OnboardingFlow
            initialData={{
              peopleCount: currentInputs.peopleCount,
              usageType: currentInputs.usageType,
            }}
            hasSoftener={currentInputs.hasSoftener}
            onComplete={handleOnboardingComplete}
          />
        );
      
      case 'discovery':
        return (
          <DiscoveryFlow
            inputs={currentInputs}
            onComplete={handleDiscoveryComplete}
          />
        );
      
      case 'loading':
        return <HandshakeLoading onComplete={handleLoadingComplete} />;
      
      case 'dashboard':
        const recommendation = opterraResult.verdict;
        const isHealthy = recommendation.action === 'PASS';
        const isCritical = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE';
        
        const whStatus: 'optimal' | 'warning' | 'critical' = 
          isCritical ? 'critical' : isHealthy ? 'optimal' : 'warning';
        
        const softenerStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
        
        if (assetType === 'softener') {
          return (
            <SoftenerCenter
              inputs={softenerInputs}
              onInputsChange={setSoftenerInputs}
              onSwitchAsset={setAssetType}
              waterHeaterStatus={whStatus}
              softenerStatus={softenerStatus}
              onServiceRequest={() => setCurrentScreen('service')}
              onEmergency={() => setCurrentScreen('panic')}
              onMaintenanceTips={() => setCurrentScreen('softener-maintenance')}
            />
          );
        }

        // Water Heater dashboard - includes HYBRID (heat pump) water heaters
        return (
          <CommandCenter
            onPanicMode={() => setCurrentScreen('panic')}
            onServiceRequest={handleServiceNavigation}
            onViewReport={() => setCurrentScreen('report')}
            onTestHarness={() => setCurrentScreen('test-harness')}
            onMaintenancePlan={() => isCritical ? handleServiceNavigation() : setCurrentScreen('maintenance-plan')}
            currentAsset={currentAsset}
            currentInputs={currentInputs}
            onInputsChange={setCurrentInputs}
            onRandomize={handleRandomize}
            scenarioName={scenarioName}
            serviceHistory={serviceHistory}
            hasSoftener={currentInputs.hasSoftener}
            onSwitchAsset={setAssetType}
            waterHeaterStatus={whStatus}
            softenerStatus={softenerStatus}
          />
        );

      case 'safety-assessment':
        return (
          <SafetyAssessmentPage
            onBack={() => setCurrentScreen('dashboard')}
            onContinue={() => setCurrentScreen('replacement-options')}
            reason={opterraResult.verdict.reason}
            location={currentInputs.location}
            stressFactors={convertMetricsToStressFactors(opterraResult.metrics, currentInputs.fuelType)}
            agingRate={opterraResult.metrics.agingRate}
            bioAge={opterraResult.metrics.bioAge}
            chronoAge={currentInputs.calendarAge}
            breachDetected={currentInputs.isLeaking || currentInputs.visualRust}
            isEconomicReplacement={isEconomicReplacement}
            failProb={opterraResult.metrics.failProb}
            fuelType={currentInputs.fuelType}
          />
        );
      
      case 'replacement-options':
        return (
          <ReplacementOptionsPage
            onBack={() => setCurrentScreen('safety-assessment')}
            onSchedule={() => setCurrentScreen('service')}
            currentInputs={currentInputs}
            infrastructureIssues={infrastructureIssues}
            isSafetyReplacement={isSafetyReplacement}
            agingRate={opterraResult.metrics.agingRate}
            monthlyBudget={opterraResult.financial.monthlyBudget}
          />
        );
      
      case 'repair-planner':
        return (
          <RepairPlanner
            onBack={() => setCurrentScreen('dashboard')}
            onSchedule={(repairs) => {
              setSelectedRepairs(repairs);
              setCurrentScreen('service');
            }}
            currentInputs={currentInputs}
          />
        );
      
      case 'maintenance-plan':
        return (
          <MaintenancePlan
            onBack={() => setCurrentScreen('dashboard')}
            onScheduleService={handleServiceNavigation}
            currentInputs={currentInputs}
            serviceHistory={serviceHistory}
            onAddServiceEvent={handleAddServiceEvent}
          />
        );
      
      case 'softener-maintenance':
        return (
          <SoftenerMaintenancePlan
            onBack={() => setCurrentScreen('dashboard')}
            inputs={softenerInputs}
          />
        );
      
      case 'report':
        return (
          <ForensicReport 
            onBack={() => setCurrentScreen('dashboard')} 
            asset={currentAsset}
            inputs={currentInputs}
          />
        );
      
      case 'panic':
        return <PanicMode onBack={() => setCurrentScreen('dashboard')} />;
      
      case 'service':
        return (
          <ServiceRequest 
            onBack={() => replacementRequired ? setCurrentScreen('replacement-options') : setCurrentScreen('repair-planner')}
            onCancel={() => setCurrentScreen('dashboard')}
            selectedRepairs={selectedRepairs}
          />
        );
      
      case 'test-harness':
        return <AlgorithmTestHarness onBack={() => setCurrentScreen('dashboard')} />;
      
      default:
        return <WelcomeScreen onBegin={handleWelcomeComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderScreen()}
    </div>
  );
};

export default Index;
