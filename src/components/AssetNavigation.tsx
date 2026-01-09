import React from 'react';
import { Flame, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetNavigationProps {
  activeAsset: 'water-heater' | 'softener';
  onSwitchAsset: (asset: 'water-heater' | 'softener') => void;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
  hasSoftener: boolean;
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
  hasSoftener,
}: AssetNavigationProps) {
  if (!hasSoftener) return null;

  return (
    <div className="px-4 py-3 bg-card/50 border-b border-border/30">
      <div className="relative flex p-1 bg-muted/50 rounded-xl max-w-md mx-auto">
        {/* Animated background indicator */}
        <div
          className={cn(
            "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20 transition-all duration-300 ease-out",
            activeAsset === 'softener' ? 'left-[calc(50%+2px)]' : 'left-1'
          )}
        />

        {/* Water Heater Tab */}
        <button
          onClick={() => onSwitchAsset('water-heater')}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors duration-200",
            activeAsset === 'water-heater'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Flame className="w-4 h-4" />
          <span>Water Heater</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            statusColors[waterHeaterStatus]
          )} />
        </button>

        {/* Softener Tab */}
        <button
          onClick={() => onSwitchAsset('softener')}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors duration-200",
            activeAsset === 'softener'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Droplets className="w-4 h-4" />
          <span>Softener</span>
          <div className={cn(
            "w-2 h-2 rounded-full",
            statusColors[softenerStatus]
          )} />
        </button>
      </div>
    </div>
  );
}
