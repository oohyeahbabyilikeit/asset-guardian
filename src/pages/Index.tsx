import { useState, useCallback } from 'react';
import { HandshakeLoading } from '@/components/HandshakeLoading';
import { CommandCenter } from '@/components/CommandCenter';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { DiscoveryFlow } from '@/components/DiscoveryFlow';
import { ForensicReport } from '@/components/ForensicReport';
import { PanicMode } from '@/components/PanicMode';
import { ServiceRequest } from '@/components/ServiceRequest';
import { RepairPlanner } from '@/components/RepairPlanner';
import { AlgorithmTestHarness } from '@/components/AlgorithmTestHarness';
import { RepairOption } from '@/data/repairOptions';
import { demoAsset, demoForensicInputs, getRandomScenario, type AssetData } from '@/data/mockAsset';
import { type ForensicInputs } from '@/lib/opterraAlgorithm';

type Screen = 'welcome' | 'discovery' | 'loading' | 'dashboard' | 'report' | 'panic' | 'service' | 'repair-planner' | 'test-harness';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedRepairs, setSelectedRepairs] = useState<RepairOption[]>([]);
  
  // Shared scenario state - use stable default values
  const [scenarioName, setScenarioName] = useState<string>('');
  const [currentAsset, setCurrentAsset] = useState<AssetData>(demoAsset);
  const [currentInputs, setCurrentInputs] = useState<ForensicInputs>(demoForensicInputs);

  const handleRandomize = useCallback(() => {
    const newScenario = getRandomScenario();
    setCurrentAsset(newScenario.asset);
    setCurrentInputs(newScenario.inputs);
    setScenarioName(newScenario.name);
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
        return (
          <CommandCenter
            onPanicMode={() => setCurrentScreen('panic')}
            onServiceRequest={() => setCurrentScreen('repair-planner')}
            onViewReport={() => setCurrentScreen('report')}
            onTestHarness={() => setCurrentScreen('test-harness')}
            currentAsset={currentAsset}
            currentInputs={currentInputs}
            onInputsChange={setCurrentInputs}
            onRandomize={handleRandomize}
            scenarioName={scenarioName}
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
