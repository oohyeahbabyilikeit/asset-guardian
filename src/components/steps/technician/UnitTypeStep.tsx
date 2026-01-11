import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Zap, 
  Droplets, 
  Wind,
  Thermometer,
  Sparkles
} from 'lucide-react';
import type { FuelType } from '@/lib/opterraAlgorithm';

interface UnitTypeOption {
  value: FuelType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'tank' | 'tankless' | 'hybrid';
}

const UNIT_TYPES: UnitTypeOption[] = [
  { 
    value: 'GAS', 
    label: 'Gas Tank', 
    description: 'Traditional tank with gas burner',
    icon: <Flame className="h-6 w-6" />,
    category: 'tank'
  },
  { 
    value: 'ELECTRIC', 
    label: 'Electric Tank', 
    description: 'Traditional tank with heating elements',
    icon: <Zap className="h-6 w-6" />,
    category: 'tank'
  },
  { 
    value: 'TANKLESS_GAS', 
    label: 'Tankless Gas', 
    description: 'On-demand heating, no storage',
    icon: <Wind className="h-6 w-6" />,
    category: 'tankless'
  },
  { 
    value: 'TANKLESS_ELECTRIC', 
    label: 'Tankless Electric', 
    description: 'On-demand electric heating',
    icon: <Sparkles className="h-6 w-6" />,
    category: 'tankless'
  },
  { 
    value: 'HYBRID', 
    label: 'Heat Pump / Hybrid', 
    description: 'Heat pump with electric backup',
    icon: <Thermometer className="h-6 w-6" />,
    category: 'hybrid'
  },
];

interface UnitTypeStepProps {
  selectedType: FuelType;
  onSelect: (type: FuelType) => void;
  onNext: () => void;
}

export function UnitTypeStep({ selectedType, onSelect, onNext }: UnitTypeStepProps) {
  const getCategoryLabel = (category: 'tank' | 'tankless' | 'hybrid') => {
    switch (category) {
      case 'tank': return 'Tank Units';
      case 'tankless': return 'Tankless';
      case 'hybrid': return 'Heat Pump';
    }
  };

  // Group by category
  const tankTypes = UNIT_TYPES.filter(t => t.category === 'tank');
  const tanklessTypes = UNIT_TYPES.filter(t => t.category === 'tankless');
  const hybridTypes = UNIT_TYPES.filter(t => t.category === 'hybrid');

  const renderTypeButton = (type: UnitTypeOption) => (
    <button
      key={type.value}
      type="button"
      onClick={() => onSelect(type.value)}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left w-full
        ${selectedType === type.value
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-muted hover:border-primary/50 bg-background"
        }`}
    >
      <div className={`p-3 rounded-lg ${selectedType === type.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {type.icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{type.label}</p>
        <p className="text-xs text-muted-foreground">{type.description}</p>
      </div>
      {selectedType === type.value && (
        <Badge className="bg-primary text-primary-foreground">Selected</Badge>
      )}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">What type of water heater?</h2>
        <p className="text-sm text-muted-foreground">This determines which inspection questions we'll ask</p>
      </div>

      {/* Tank Units */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {getCategoryLabel('tank')}
        </Label>
        <div className="space-y-2">
          {tankTypes.map(renderTypeButton)}
        </div>
      </div>

      {/* Tankless Units */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {getCategoryLabel('tankless')}
        </Label>
        <div className="space-y-2">
          {tanklessTypes.map(renderTypeButton)}
        </div>
      </div>

      {/* Hybrid Units */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {getCategoryLabel('hybrid')}
        </Label>
        <div className="space-y-2">
          {hybridTypes.map(renderTypeButton)}
        </div>
      </div>

      <Button 
        onClick={onNext} 
        className="w-full h-12 font-semibold"
        disabled={!selectedType}
      >
        Continue
      </Button>
    </div>
  );
}
