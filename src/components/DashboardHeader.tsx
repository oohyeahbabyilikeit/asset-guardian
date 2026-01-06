import { FlaskConical, RefreshCw } from 'lucide-react';
import { demoContractor } from '@/data/mockAsset';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  onTestHarness?: () => void;
  onRandomize?: () => void;
  scenarioName?: string;
}

export function DashboardHeader({ onTestHarness, onRandomize, scenarioName }: DashboardHeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-xl border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex items-center gap-3">
        {/* Contractor Logo with glow */}
        <div 
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
          style={{ 
            backgroundColor: demoContractor.accentColor,
            boxShadow: `0 0 20px -4px ${demoContractor.accentColor}`,
          }}
        >
          {demoContractor.name.charAt(0)}
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground font-semibold tracking-widest">
            {scenarioName || 'Powered by'}
          </div>
          <div className="font-bold text-foreground leading-none">
            {demoContractor.name}
          </div>
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="relative flex items-center gap-3">
        {onRandomize && (
          <Button variant="ghost" size="icon" onClick={onRandomize} className="text-muted-foreground hover:text-foreground" title="Random scenario">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
        
        {onTestHarness && (
          <Button variant="ghost" size="icon" onClick={onTestHarness} className="text-muted-foreground hover:text-foreground">
            <FlaskConical className="w-4 h-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Live</span>
        </div>
        
        {/* User Avatar */}
        <div className="w-9 h-9 bg-secondary rounded-full border border-border shadow-lg flex items-center justify-center text-xs font-bold text-muted-foreground">
          HO
        </div>
      </div>
    </header>
  );
}
