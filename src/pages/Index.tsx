import { useState, useCallback, useEffect } from 'react';
import { HandshakeLoading } from '@/components/HandshakeLoading';
import { CommandCenter } from '@/components/CommandCenter';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { DiscoveryFlow } from '@/components/DiscoveryFlow';
import { ForensicReport } from '@/components/ForensicReport';
import { PanicMode } from '@/components/PanicMode';
import { ServiceRequest } from '@/components/ServiceRequest';
import { RepairPlanner } from '@/components/RepairPlanner';
import { MaintenancePlan } from '@/components/MaintenancePlan';
import { AlgorithmTestHarness } from '@/components/AlgorithmTestHarness';
import { RepairOption } from '@/data/repairOptions';
import { demoAsset, demoForensicInputs, getRandomScenario, type AssetData } from '@/data/mockAsset';
import { type ForensicInputs, calculateOpterraRisk } from '@/lib/opterraAlgorithm';
import { ServiceEvent, deriveInputsFromServiceHistory } from '@/types/serviceHistory';

type Screen = 'welcome' | 'discovery' | 'loading' | 'dashboard' | 'report' | 'panic' | 'service' | 'repair-planner' | 'maintenance-plan' | 'test-harness';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedRepairs, setSelectedRepairs] = useState<RepairOption[]>([]);
  
  // Shared scenario state - use stable default values
  const [scenarioName, setScenarioName] = useState<string>('');
  const [currentAsset, setCurrentAsset] = useState<AssetData>(demoAsset);
  const [currentInputs, setCurrentInputs] = useState<ForensicInputs>(demoForensicInputs);
  
  // Shared service history state
  const [serviceHistory, setServiceHistory] = useState<ServiceEvent[]>([]);
  
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

  const handleRandomize = useCallback(() => {
    const newScenario = getRandomScenario();
    setCurrentAsset(newScenario.asset);
    setCurrentInputs(newScenario.inputs);
    setScenarioName(newScenario.name);
    setServiceHistory([]); // Reset service history on new scenario
  }, []);
  
  const handleAddServiceEvent = useCallback((event: ServiceEvent) => {
    setServiceHistory(prev => [...prev, event]);
  }, []);

  const handleLoadingComplete = () => {
    setCurrentScreen('dashboard');
  };

  const handleWelcomeComplete = () => {
    setCurrentScreen('discovery');
  };

  const handleDiscoveryComplete = () => {
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onBegin={handleWelcomeComplete} />;
      
      case 'discovery':
        return (
          <DiscoveryFlow
            asset={currentAsset}
            inputs={currentInputs}
            onComplete={handleDiscoveryComplete}
          />
        );
      
      case 'loading':
        return <HandshakeLoading onComplete={handleLoadingComplete} />;
      
      case 'dashboard':
        // Determine which flow to show based on recommendation
        const opterraResult = calculateOpterraRisk(currentInputs);
        const recommendation = opterraResult.verdict;
        const isHealthy = recommendation.action === 'PASS';
        const isCritical = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE';
        
        return (
          <CommandCenter
            onPanicMode={() => setCurrentScreen('panic')}
            onServiceRequest={() => setCurrentScreen(isCritical ? 'repair-planner' : (isHealthy ? 'maintenance-plan' : 'repair-planner'))}
            onViewReport={() => setCurrentScreen('report')}
            onTestHarness={() => setCurrentScreen('test-harness')}
            onMaintenancePlan={() => !isCritical && setCurrentScreen('maintenance-plan')}
            currentAsset={currentAsset}
            currentInputs={currentInputs}
            onInputsChange={setCurrentInputs}
            onRandomize={handleRandomize}
            scenarioName={scenarioName}
            serviceHistory={serviceHistory}
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
