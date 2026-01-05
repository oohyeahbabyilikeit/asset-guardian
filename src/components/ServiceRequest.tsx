import { useState, useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypewriter } from '@/hooks/useTypewriter';
import { demoAsset, demoVitals } from '@/data/mockAsset';

interface ServiceRequestProps {
  onBack: () => void;
  onCancel: () => void;
}

const transmissionSteps = [
  '> TRANSMITTING TELEMETRY TO DISPATCH...',
  '> VERIFYING TRUCK STOCK (3/4" PRV)...',
  '> ALERTING SERVICE MANAGER...',
];

function generateTicketNumber(): string {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ServiceRequest({ onBack, onCancel }: ServiceRequestProps) {
  const [ticketNumber] = useState(generateTicketNumber);
  const [stepStatuses, setStepStatuses] = useState<('pending' | 'ok' | 'sent')[]>(['pending', 'pending', 'pending']);
  
  const { displayedLines, currentLineIndex, isComplete } = useTypewriter({
    lines: transmissionSteps,
    typingSpeed: 20,
    lineDelay: 800,
  });

  // Update step statuses as typewriter progresses
  useEffect(() => {
    if (currentLineIndex > 0) {
      setStepStatuses(prev => {
        const newStatuses = [...prev];
        // Mark previous step as complete
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

  const getStatusLabel = (index: number) => {
    const status = stepStatuses[index];
    if (status === 'ok') return '[OK]';
    if (status === 'sent') return '[SENT]';
    return '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border/50 py-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">TICKET</p>
            <p className="font-mono font-bold text-primary">{ticketNumber}: OPEN</p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="p-6 flex flex-col items-center">
        {/* Radar Animation */}
        <div className="relative w-48 h-48 mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-4 rounded-full border border-primary/30" />
          <div className="absolute inset-8 rounded-full border border-primary/40" />
          
          {/* Radar sweep */}
          <div 
            className="absolute inset-0 origin-center animate-radar"
            style={{ 
              background: 'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.3) 30deg, transparent 60deg)'
            }}
          />
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary animate-pulse" />
          
          {/* Blips */}
          <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-primary/60 animate-ping" />
          <div className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-primary/60 animate-ping" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Terminal Output */}
        <div className="w-full max-w-sm font-mono text-sm space-y-2 mb-8">
          {displayedLines.map((line, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-muted-foreground">{line}</span>
              <span className={
                stepStatuses[index] === 'ok' ? 'text-status-optimal' :
                stepStatuses[index] === 'sent' ? 'text-primary' :
                'text-muted-foreground/50'
              }>
                {getStatusLabel(index)}
              </span>
            </div>
          ))}
          
          {/* Cursor */}
          {!isComplete && (
            <div className="flex items-center">
              <span className="inline-block w-2 h-4 bg-primary animate-blink" />
            </div>
          )}
        </div>

        {/* Status Box */}
        {isComplete && (
          <div className="w-full max-w-sm glass-card text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">👨‍🔧</span>
              <p className="text-sm font-semibold text-foreground">
                WAITING FOR TECH ACCEPTANCE
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              "Your request has been routed to the Priority Board. We have sent your diagnostic file. Expect a call within 10 minutes."
            </p>

            {/* Asset Summary */}
            <div className="bg-secondary/50 rounded-lg p-3 text-xs text-left mb-4">
              <p className="text-muted-foreground mb-1">Transmitted Data:</p>
              <p className="font-mono">• Asset: {demoAsset.brand} {demoAsset.specs.capacity}</p>
              <p className="font-mono">• Issue: Pressure {demoVitals.pressure.current}psi (Limit: {demoVitals.pressure.limit})</p>
              <p className="font-mono">• Location: {demoAsset.location}</p>
            </div>

            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-status-critical hover:text-status-critical hover:bg-status-critical/10"
            >
              <X className="w-4 h-4 mr-2" />
              CANCEL REQUEST
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
