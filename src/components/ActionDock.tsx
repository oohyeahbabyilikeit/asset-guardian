import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionDockProps {
  onPanicMode: () => void;
  onServiceRequest: () => void;
  // Layout control - static mode for animated wrapper usage
  position?: 'fixed' | 'static';
}

export function ActionDock({ 
  onPanicMode, 
  onServiceRequest,
  position = 'fixed',
}: ActionDockProps) {
  const containerClasses = position === 'fixed' 
    ? "fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4 safe-area-bottom"
    : "bg-card/90 backdrop-blur-md border-t border-border p-4 safe-area-bottom";
  
  return (
    <div 
      className={containerClasses}
      style={{
        boxShadow: '0 -8px 32px -8px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Gradient fade above dock */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <div className="max-w-md mx-auto">
        {/* Primary Action - single unified CTA */}
        <Button
          onClick={onServiceRequest}
          size="lg"
          className="w-full font-bold py-4 h-auto rounded-xl active:scale-[0.98] transition-all text-base bg-primary hover:bg-primary/90 text-primary-foreground"
          style={{
            boxShadow: '0 4px 24px -4px hsl(var(--primary) / 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <span className="truncate">Get Expert Help</span>
          <ChevronRight className="w-5 h-5 ml-2 flex-shrink-0" />
        </Button>
      </div>
      
      {/* Secondary link - Emergency only */}
      <div className="max-w-md mx-auto mt-3 flex items-center justify-center">
        <button 
          onClick={onPanicMode}
          className="text-sm text-destructive hover:text-destructive/80 transition-colors underline-offset-4 hover:underline"
        >
          Emergency / Report Problem
        </button>
      </div>
    </div>
  );
}
