import React from 'react';
import { Button } from '@/components/ui/button';
import { Droplets, Flame } from 'lucide-react';

interface AssetTypeSwitcherProps {
  activeAsset: 'water-heater' | 'softener';
  onSwitch: () => void;
}

export function AssetTypeSwitcher({ activeAsset, onSwitch }: AssetTypeSwitcherProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onSwitch}
      className="gap-2 text-xs"
    >
      {activeAsset === 'water-heater' ? (
        <>
          <Droplets className="h-3.5 w-3.5" />
          <span>View Softener</span>
        </>
      ) : (
        <>
          <Flame className="h-3.5 w-3.5" />
          <span>View Heater</span>
        </>
      )}
    </Button>
  );
}
