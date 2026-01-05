import { Bell, Wrench, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-6 px-4">
      {/* SOS Button - Floating */}
      <button
        onClick={onPanicMode}
        className={cn(
          "absolute -top-4 right-4 w-14 h-14 rounded-full",
          "bg-status-critical text-white",
          "flex items-center justify-center",
          "shadow-lg shadow-status-critical/30",
          "hover:scale-105 active:scale-95 transition-transform",
          "animate-pulse"
        )}
        aria-label="Emergency SOS"
      >
        <Bell className="w-6 h-6" />
      </button>

      <div className="flex flex-col gap-3 max-w-md mx-auto">
        {/* Primary CTA */}
        <Button
          onClick={onFixPressure}
          size="lg"
          className={cn(
            "w-full h-14 text-lg font-semibold",
            "bg-primary hover:bg-primary/90",
            "shadow-lg shadow-primary/20"
          )}
        >
          <Wrench className="w-5 h-5 mr-2" />
          FIX PRESSURE - EST ${estimatedCost}
        </Button>

        {/* Secondary CTA */}
        <Button
          onClick={onViewReport}
          variant="outline"
          size="lg"
          className="w-full h-12 border-border/50 hover:bg-secondary"
        >
          <FileText className="w-5 h-5 mr-2" />
          VIEW FORENSIC REPORT
        </Button>
      </div>
    </div>
  );
}
