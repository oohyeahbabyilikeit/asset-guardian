import { useState, useEffect } from 'react';
import { ArrowLeft, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypewriter } from '@/hooks/useTypewriter';
import { demoAsset, demoVitals, demoContractor } from '@/data/mockAsset';

interface ServiceRequestProps {
  onBack: () => void;
  onCancel: () => void;
}

const transmissionSteps = [
  'Transmitting telemetry to dispatch...',
  'Verifying truck stock...',
  'Alerting service manager...',
];

function generateTicketNumber(): string {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ServiceRequest({ onBack, onCancel }: ServiceRequestProps) {
  const [ticketNumber] = useState(generateTicketNumber);
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'ok' | 'sent')[]>(['pending', 'pending', 'pending']);
  
  const { displayedLines, currentLineIndex, isComplete } = useTypewriter({
    lines: transmissionSteps,
    typingSpeed: 25,
    lineDelay: 600,
  });

  useEffect(() => {
    if (currentLineIndex > 0) {
      setStepStatuses(prev => {
        const newStatuses = [...prev];
        if (currentLineIndex <= transmissionSteps.length) {
          newStatuses[currentLineIndex - 1] = currentLineIndex - 1 === 2 ? 'sent' : 'ok';
        }
        return newStatuses;
      });
    }
    
    if (isComplete) {
      setStepStatuses(['ok', 'ok', 'sent']);
    }
  }, [currentLineIndex, isComplete]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border py-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ticket</p>
            <p className="font-bold text-foreground">{ticketNumber}</p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-6 flex flex-col items-center max-w-md mx-auto">
        {/* Loading Animation */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
          ></div>
          
          {/* Center Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: demoContractor.accentColor }}
            >
              {demoContractor.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="w-full space-y-3 mb-8">
          {displayedLines.map((line, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between bg-card rounded-xl p-4 border border-border"
            >
              <span className="text-sm text-foreground">{line}</span>
              <span className={
                stepStatuses[index] === 'ok' ? 'text-green-600 text-xs font-medium' :
                stepStatuses[index] === 'sent' ? 'text-primary text-xs font-medium' :
                'text-muted-foreground text-xs'
              }>
                {stepStatuses[index] === 'ok' && <CheckCircle2 className="w-5 h-5" />}
                {stepStatuses[index] === 'sent' && 'Sent'}
              </span>
            </div>
          ))}
        </div>

        {/* Completion Card */}
        {isComplete && (
          <div className="w-full clean-card text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl">👨‍🔧</span>
            </div>
            
            <h3 className="font-bold text-lg mb-2">Request Submitted</h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Your diagnostic file has been sent. Expect a call within 10 minutes.
            </p>

            {/* Asset Summary */}
            <div className="bg-muted rounded-xl p-4 text-sm text-left mb-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">Transmitted Data</p>
              <div className="space-y-1 text-foreground">
                <p>• Asset: {demoAsset.brand} {demoAsset.specs.capacity}</p>
                <p>• Issue: Pressure {demoVitals.pressure.current} PSI</p>
                <p>• Location: {demoAsset.location}</p>
              </div>
            </div>

            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
