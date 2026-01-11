import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Play, 
  ClipboardCheck, 
  Timer,
  ArrowRight
} from 'lucide-react';

interface ModeSelectScreenProps {
  onSelectMode: (mode: 'technician' | 'demo') => void;
}

export function ModeSelectScreen({ onSelectMode }: ModeSelectScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Water Heater Assessment
          </h1>
          <p className="text-muted-foreground">
            Choose how you'd like to proceed
          </p>
        </div>
        
        {/* Mode Cards */}
        <div className="space-y-4">
          {/* Technician Mode */}
          <button
            onClick={() => onSelectMode('technician')}
            className="w-full p-6 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Wrench className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-foreground">Technician Mode</h2>
                  <Badge variant="default" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Full inspection workflow with on-site measurements, followed by homeowner interview
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    ~5 min total
                  </span>
                  <span>6-8 inspection steps</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
          
          {/* Demo Mode */}
          <button
            onClick={() => onSelectMode('demo')}
            className="w-full p-6 rounded-xl border-2 border-muted hover:border-muted-foreground/30 hover:bg-muted/50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <Play className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground">Demo Mode</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Skip technician inspection and use sample data for testing
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    ~2 min
                  </span>
                  <span>Homeowner questions only</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </button>
        </div>
        
        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground">
          Technician mode provides the most accurate assessment by collecting real measurements from the unit.
        </p>
      </div>
    </div>
  );
}
