import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Play, 
  ClipboardCheck, 
  Timer,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react';

interface ModeSelectScreenProps {
  onSelectMode: (mode: 'technician' | 'demo') => void;
  onQuickRandom?: () => void;
}

export function ModeSelectScreen({ onSelectMode, onQuickRandom }: ModeSelectScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with gradient overlay */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="relative px-6 pt-12 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border shadow-lg mb-6">
            <ClipboardCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Water Heater Assessment
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
            Professional diagnostic system for water heating equipment
          </p>
        </div>
      </div>
      
      {/* Mode Cards */}
      <div className="flex-1 px-6 pb-8">
        <div className="max-w-md mx-auto space-y-4">
          {/* Technician Mode - Primary */}
          <button
            onClick={() => onSelectMode('technician')}
            className="w-full group relative overflow-hidden rounded-xl border border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 p-5 text-left transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10 active:scale-[0.99]"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                  <Wrench className="h-7 w-7" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-semibold text-foreground">Technician Inspection</h2>
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-medium">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Complete on-site inspection with equipment measurements, followed by homeowner interview
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    5 min total
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" />
                    Full diagnostic
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
          </button>
          
          {/* Demo Mode - Secondary */}
          <button
            onClick={() => onSelectMode('demo')}
            className="w-full group relative overflow-hidden rounded-xl border border-border bg-card/50 p-5 text-left transition-all hover:border-muted-foreground/30 hover:bg-card active:scale-[0.99]"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground transition-transform group-hover:scale-105">
                  <Play className="h-7 w-7" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-foreground mb-1.5">Demo Mode</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Use sample data to explore the system without an active inspection
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    2 min
                  </span>
                  <span className="text-muted-foreground">
                    Homeowner questions only
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
          </button>
        </div>
      </div>
      
      {/* Footer with Quick Random Button */}
      <div className="px-6 pb-6 space-y-4">
        {onQuickRandom && (
          <button
            onClick={onQuickRandom}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Quick Random (Testing)
          </button>
        )}
        <p className="text-xs text-center text-muted-foreground/70 max-w-sm mx-auto">
          Technician mode collects real measurements for the most accurate risk assessment and maintenance recommendations.
        </p>
      </div>
    </div>
  );
}
