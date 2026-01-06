import { useState, useCallback } from 'react';
import { HandshakeLoading } from '@/components/HandshakeLoading';
import { CommandCenter } from '@/components/CommandCenter';
import { ForensicReport } from '@/components/ForensicReport';
import { PanicMode } from '@/components/PanicMode';
import { ServiceRequest } from '@/components/ServiceRequest';
import { IssueSelector } from '@/components/IssueSelector';
import { ScoreSimulator } from '@/components/ScoreSimulator';
import { AlgorithmTestHarness } from '@/components/AlgorithmTestHarness';
import { RepairOption } from '@/data/repairOptions';
import { getRandomScenario, demoAsset, type DemoScenario, type AssetData } from '@/data/mockAsset';
import { type ForensicInputs } from '@/lib/opterraAlgorithm';

type Screen = 'loading' | 'dashboard' | 'report' | 'panic' | 'service' | 'select-repairs' | 'simulate' | 'test-harness';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedRepairs, setSelectedRepairs] = useState<RepairOption[]>([]);
  
  // Shared scenario state
  const [scenarioName, setScenarioName] = useState<string>('');
  const [currentAsset, setCurrentAsset] = useState<AssetData>(demoAsset);
  const [currentInputs, setCurrentInputs] = useState<ForensicInputs>(getRandomScenario().inputs);

  const handleRandomize = useCallback(() => {
    const newScenario = getRandomScenario();
    setCurrentAsset(newScenario.asset);
    setCurrentInputs(newScenario.inputs);
    setScenarioName(newScenario.name);
  }, []);

  const handleLoadingComplete = () => {
    setCurrentScreen('dashboard');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return <HandshakeLoading onComplete={handleLoadingComplete} />;
      
      case 'dashboard':
        return (
          <CommandCenter
            onPanicMode={() => setCurrentScreen('panic')}
            onServiceRequest={() => setCurrentScreen('select-repairs')}
            onViewReport={() => setCurrentScreen('report')}
            onTestHarness={() => setCurrentScreen('test-harness')}
            currentAsset={currentAsset}
            currentInputs={currentInputs}
            onInputsChange={setCurrentInputs}
            onRandomize={handleRandomize}
            scenarioName={scenarioName}
          />
        );
      
      case 'select-repairs':
        return (
          <IssueSelector
            onBack={() => setCurrentScreen('dashboard')}
            onSimulate={(repairs) => {
              setSelectedRepairs(repairs);
              setCurrentScreen('simulate');
            }}
          />
        );
      
      case 'simulate':
        return (
          <ScoreSimulator
            selectedRepairs={selectedRepairs}
            onBack={() => setCurrentScreen('select-repairs')}
            onSchedule={() => setCurrentScreen('service')}
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
            onBack={() => setCurrentScreen('simulate')}
            onCancel={() => setCurrentScreen('dashboard')}
            selectedRepairs={selectedRepairs}
          />
        );
      
      case 'test-harness':
        return <AlgorithmTestHarness onBack={() => setCurrentScreen('dashboard')} />;
      
      default:
        return <HandshakeLoading onComplete={handleLoadingComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderScreen()}
    </div>
  );
};

export default Index;
