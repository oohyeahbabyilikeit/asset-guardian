import { FlaskConical, RefreshCw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetNavigation } from './AssetNavigation';

interface DashboardHeaderProps {
  onTestHarness?: () => void;
  onRandomize?: () => void;
  scenarioName?: string;
  // Asset navigation props
  activeAsset?: 'water-heater' | 'softener';
  onSwitchAsset?: (asset: 'water-heater' | 'softener') => void;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
  hasSoftener?: boolean;
}

export function DashboardHeader({ 
  onTestHarness, 
  onRandomize, 
  scenarioName,
  activeAsset = 'water-heater',
  onSwitchAsset,
  waterHeaterStatus = 'optimal',
  softenerStatus = 'optimal',
  hasSoftener = false,
}: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-50">
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 px-4 py-2 flex justify-between items-center">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative flex items-center gap-2">
          {/* Cortex Logo */}
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          
          <div className="font-display text-lg font-bold tracking-tight text-foreground">
            CORTEX
          </div>
        </div>
        
        {/* Right side controls */}
        <div className="relative flex items-center gap-2">
          {onRandomize && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRandomize} 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50" 
              title="Random scenario"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          
          {onTestHarness && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onTestHarness} 
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="Test harness"
            >
              <FlaskConical className="w-4 h-4" />
            </Button>
          )}
          
          <div className="h-6 w-px bg-border/50 mx-1" />
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-optimal/10 border border-status-optimal/20">
              <div className="w-1.5 h-1.5 rounded-full bg-status-optimal animate-pulse" />
              <span className="text-[10px] font-semibold text-status-optimal uppercase tracking-wider">Live</span>
            </div>
            
            {/* User Avatar */}
            <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/50 rounded-lg border border-border/50 flex items-center justify-center text-xs font-semibold text-muted-foreground">
              HO
            </div>
          </div>
        </div>
      </header>

      {/* Asset Navigation - only shows when hasSoftener is true */}
      {hasSoftener && onSwitchAsset && (
        <AssetNavigation
          activeAsset={activeAsset}
          onSwitchAsset={onSwitchAsset}
          waterHeaterStatus={waterHeaterStatus}
          softenerStatus={softenerStatus}
          hasSoftener={hasSoftener}
        />
      )}
    </div>
  );
}
