import { useState, useCallback, useEffect } from 'react';
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
import { RepairOption } from '@/data/repairOptions';
import { demoAsset, demoForensicInputs, demoServiceHistory, getRandomScenario, type AssetData } from '@/data/mockAsset';
import { type ForensicInputs, calculateOpterraRisk } from '@/lib/opterraAlgorithm';
import { ServiceEvent, deriveInputsFromServiceHistory } from '@/types/serviceHistory';
import { SoftenerInputs, DEFAULT_SOFTENER_INPUTS } from '@/lib/softenerAlgorithm';
import { OnboardingData, mapOnboardingToForensicInputs, mapOnboardingToSoftenerInputs } from '@/types/onboarding';

type Screen = 'welcome' | 'onboarding' | 'discovery' | 'loading' | 'dashboard' | 'report' | 'panic' | 'service' | 'repair-planner' | 'maintenance-plan' | 'softener-maintenance' | 'test-harness';
type AssetType = 'water-heater' | 'softener';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
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
      hasCarbonFilter: currentInputs.hasSoftener, // If they have softener, likely have carbon
    }));
  }, [currentInputs.hardnessGPG, currentInputs.peopleCount, currentInputs.hasSoftener]);

  const handleRandomize = useCallback(() => {
    const newScenario = getRandomScenario();
    setCurrentAsset(newScenario.asset);
    setCurrentInputs(newScenario.inputs);
    setScenarioName(newScenario.name);
    setServiceHistory(newScenario.serviceHistory || []); // Load scenario's service history
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

  const handleOnboardingComplete = (data: OnboardingData) => {
    // Map onboarding data to algorithm inputs
    const newForensicInputs = mapOnboardingToForensicInputs(data, currentInputs);
    const newSoftenerInputs = mapOnboardingToSoftenerInputs(data, softenerInputs);
    
    setCurrentInputs(newForensicInputs);
    setSoftenerInputs(newSoftenerInputs);
    setCurrentScreen('discovery');
  };

  const handleDiscoveryComplete = () => {
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
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
        // Calculate status for both assets
        const opterraResult = calculateOpterraRisk(currentInputs);
        const recommendation = opterraResult.verdict;
        const isHealthy = recommendation.action === 'PASS';
        const isCritical = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE';
        
        // Determine water heater status from health
        const whStatus: 'optimal' | 'warning' | 'critical' = 
          isCritical ? 'critical' : isHealthy ? 'optimal' : 'warning';
        
        // TODO: Calculate softener status from softener algorithm
        const softenerStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
        
        // Check if we're viewing softener
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
        
        return (
          <CommandCenter
            onPanicMode={() => setCurrentScreen('panic')}
            onServiceRequest={() => setCurrentScreen(isCritical ? 'repair-planner' : (isHealthy ? 'maintenance-plan' : 'repair-planner'))}
            onViewReport={() => setCurrentScreen('report')}
            onTestHarness={() => setCurrentScreen('test-harness')}
            onMaintenancePlan={() => setCurrentScreen(isCritical ? 'repair-planner' : 'maintenance-plan')}
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
            onScheduleService={() => setCurrentScreen('repair-planner')}
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
            onBack={() => setCurrentScreen('repair-planner')}
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
