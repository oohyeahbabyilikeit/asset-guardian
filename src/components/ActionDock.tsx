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
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex gap-3">
        {/* Emergency Call */}
        <button 
          onClick={onPanicMode}
          className="bg-muted hover:bg-red-50 text-muted-foreground hover:text-red-600 p-4 rounded-xl border border-border transition-colors"
        >
          <Phone className="w-6 h-6" />
        </button>

        {/* Primary Action */}
        <Button
          onClick={onFixPressure}
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 h-auto rounded-xl shadow-lg active:scale-[0.98] transition-all text-lg"
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
