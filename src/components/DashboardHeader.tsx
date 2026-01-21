import { FlaskConical, RefreshCw, Brain, Shield } from 'lucide-react';
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
  // Chain of custody branding
  homeownerName?: string;
  contractorName?: string;
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
  homeownerName,
  contractorName,
}: DashboardHeaderProps) {
  const showAssetNav = hasSoftener && onSwitchAsset;
  const showChainOfCustody = homeownerName || contractorName;

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-card/90 backdrop-blur-xl border-b border-border/50 px-4 py-2">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Main header row */}
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
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
                size="sm"
                onClick={onTestHarness} 
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="Test harness"
              >
                <FlaskConical className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Test Harness</span>
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
                {homeownerName ? homeownerName.charAt(0).toUpperCase() : 'HO'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Chain of Custody Badge - shows verified report origin */}
        {showChainOfCustody && (
          <div className="relative flex items-center justify-center gap-1.5 mt-1.5 py-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3 text-primary/70" />
            <span>
              {homeownerName && <span className="text-foreground font-medium">Report for {homeownerName}</span>}
              {homeownerName && contractorName && <span> • </span>}
              {contractorName && <span>Verified by <span className="text-foreground font-medium">{contractorName}</span></span>}
            </span>
          </div>
        )}
      </header>

      {/* Asset Navigation - shows when softener exists */}
      {showAssetNav && (
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
