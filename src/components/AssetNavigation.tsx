import React from 'react';
import { Flame, Droplets, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetNavigationProps {
  activeAsset: 'water-heater' | 'softener' | 'heat-pump';
  onSwitchAsset: (asset: 'water-heater' | 'softener' | 'heat-pump') => void;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
  heatPumpStatus?: 'optimal' | 'warning' | 'critical';
  hasSoftener: boolean;
  hasHeatPump?: boolean;
}

const statusColors = {
  optimal: 'bg-status-optimal',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
};

export function AssetNavigation({
  activeAsset,
  onSwitchAsset,
  waterHeaterStatus = 'optimal',
  softenerStatus = 'optimal',
  heatPumpStatus = 'optimal',
  hasSoftener,
  hasHeatPump = false,
}: AssetNavigationProps) {
  // Count how many assets we have
  const assetCount = 1 + (hasSoftener ? 1 : 0) + (hasHeatPump ? 1 : 0);
  
  // Don't show navigation if only one asset
  if (assetCount <= 1) return null;

  // Calculate positions for the sliding indicator
  const getIndicatorPosition = () => {
    if (assetCount === 2) {
      // Two assets: water-heater or softener/heat-pump
      if (activeAsset === 'water-heater') return 'left-1';
      return 'left-[calc(50%+2px)]';
    }
    // Three assets
    if (activeAsset === 'water-heater') return 'left-1';
    if (activeAsset === 'softener') return 'left-[calc(33.33%+2px)]';
    return 'left-[calc(66.66%+2px)]';
  };

  const getIndicatorWidth = () => {
    if (assetCount === 2) return 'w-[calc(50%-4px)]';
    return 'w-[calc(33.33%-4px)]';
  };

  return (
    <div className="px-4 py-3 bg-card/50 border-b border-border/30">
      <div className="relative flex p-1 bg-muted/50 rounded-xl max-w-md mx-auto">
        {/* Animated background indicator */}
        <div
          className={cn(
            "absolute top-1 bottom-1 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20 transition-all duration-300 ease-out",
            getIndicatorPosition(),
            getIndicatorWidth()
          )}
        />

        {/* Water Heater Tab - always shown */}
        <button
          onClick={() => onSwitchAsset('water-heater')}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors duration-200",
            activeAsset === 'water-heater'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Flame className="w-4 h-4" />
          <span className="hidden sm:inline">Water Heater</span>
          <span className="sm:hidden">Heater</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            statusColors[waterHeaterStatus]
          )} />
        </button>

        {/* Heat Pump Tab - shown when hasHeatPump */}
        {hasHeatPump && (
          <button
            onClick={() => onSwitchAsset('heat-pump')}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors duration-200",
              activeAsset === 'heat-pump'
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Cpu className="w-4 h-4" />
            <span className="hidden sm:inline">Heat Pump</span>
            <span className="sm:hidden">Pump</span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              statusColors[heatPumpStatus]
            )} />
          </button>
        )}

        {/* Softener Tab - shown when hasSoftener */}
        {hasSoftener && (
          <button
            onClick={() => onSwitchAsset('softener')}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors duration-200",
              activeAsset === 'softener'
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Droplets className="w-4 h-4" />
            <span className="hidden sm:inline">Softener</span>
            <span className="sm:hidden">Soft</span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              statusColors[softenerStatus]
            )} />
          </button>
        )}
      </div>
    </div>
  );
}
