import { useState } from 'react';
import { HandshakeLoading } from '@/components/HandshakeLoading';
import { CommandCenter } from '@/components/CommandCenter';
import { ForensicReport } from '@/components/ForensicReport';
import { PanicMode } from '@/components/PanicMode';
import { ServiceRequest } from '@/components/ServiceRequest';

type Screen = 'loading' | 'dashboard' | 'report' | 'panic' | 'service';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

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
            onServiceRequest={() => setCurrentScreen('service')}
            onViewReport={() => setCurrentScreen('report')}
          />
        );
      
      case 'report':
        return <ForensicReport onBack={() => setCurrentScreen('dashboard')} />;
      
      case 'panic':
        return <PanicMode onBack={() => setCurrentScreen('dashboard')} />;
      
      case 'service':
        return (
          <ServiceRequest 
            onBack={() => setCurrentScreen('dashboard')}
            onCancel={() => setCurrentScreen('dashboard')}
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
