import { useState } from 'react';
import { HandshakeLoading } from '@/components/HandshakeLoading';
import { CommandCenter } from '@/components/CommandCenter';
import { ForensicReport } from '@/components/ForensicReport';
import { PanicMode } from '@/components/PanicMode';
import { ServiceRequest } from '@/components/ServiceRequest';
import { IssueSelector } from '@/components/IssueSelector';
import { ScoreSimulator } from '@/components/ScoreSimulator';
import { RepairOption } from '@/data/repairOptions';

type Screen = 'loading' | 'dashboard' | 'report' | 'panic' | 'service' | 'select-repairs' | 'simulate';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedRepairs, setSelectedRepairs] = useState<RepairOption[]>([]);

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
        return <ForensicReport onBack={() => setCurrentScreen('dashboard')} />;
      
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
