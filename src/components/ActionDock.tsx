import { Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionDockProps {
  onPanicMode: () => void;
  onFixPressure: () => void;
  onViewReport: () => void;
  estimatedCost?: number;
}

export function ActionDock({ 
  onPanicMode, 
  onFixPressure, 
  onViewReport, 
  estimatedCost = 450 
}: ActionDockProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4 safe-area-bottom"
      style={{
        boxShadow: '0 -8px 32px -8px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Gradient fade above dock */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <div className="max-w-md mx-auto flex gap-3">
        {/* Emergency Call */}
        <button 
          onClick={onPanicMode}
          className="bg-secondary hover:bg-red-950/50 text-muted-foreground hover:text-red-400 p-4 rounded-xl border border-border hover:border-red-800/50 transition-all"
          style={{
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <Phone className="w-6 h-6" />
        </button>

        {/* Primary Action with glow */}
        <Button
          onClick={onFixPressure}
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 h-auto rounded-xl active:scale-[0.98] transition-all text-lg"
          style={{
            boxShadow: '0 4px 24px -4px hsl(24 95% 53% / 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          Resolve Issues
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
      
      {/* Secondary link for report */}
      <div className="max-w-md mx-auto mt-3">
        <button 
          onClick={onViewReport}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          View Full Forensic Report
        </button>
      </div>
    </div>
  );
}
