import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Flame, 
  Zap, 
  Droplets, 
  Wind,
  Thermometer,
  Sparkles,
  Building2,
  Ban,
  AlertTriangle
} from 'lucide-react';
import type { FuelType } from '@/lib/opterraAlgorithm';

type SpecialSelection = 'BOILER' | 'NO_ACCESS' | null;

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
  onCannotInspect?: (reason: 'boiler' | 'no_access') => void;
}

export function UnitTypeStep({ selectedType, onSelect, onNext, onCannotInspect }: UnitTypeStepProps) {
  const [specialSelection, setSpecialSelection] = useState<SpecialSelection>(null);

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

  const handleSpecialSelect = (special: SpecialSelection) => {
    setSpecialSelection(special);
  };

  const handleContinue = () => {
    if (specialSelection === 'BOILER') {
      onCannotInspect?.('boiler');
    } else if (specialSelection === 'NO_ACCESS') {
      onCannotInspect?.('no_access');
    } else {
      onNext();
    }
  };

  const renderTypeButton = (type: UnitTypeOption) => {
    const isSelected = selectedType === type.value && !specialSelection;
    return (
      <button
        key={type.value}
        type="button"
        onClick={() => {
          setSpecialSelection(null);
          onSelect(type.value);
        }}
        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left w-full
          ${isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-muted hover:border-primary/50 bg-background"
          }`}
      >
        <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          {type.icon}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{type.label}</p>
          <p className="text-xs text-muted-foreground">{type.description}</p>
        </div>
        {isSelected && (
          <Badge className="bg-primary text-primary-foreground">Selected</Badge>
        )}
      </button>
    );
  };

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

      {/* Special Cases */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Other
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleSpecialSelect('BOILER')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
              ${specialSelection === 'BOILER'
                ? "border-amber-500 bg-amber-500/10"
                : "border-muted hover:border-amber-500/50 bg-background"
              }`}
          >
            <Building2 className={`h-6 w-6 ${specialSelection === 'BOILER' ? 'text-amber-600' : 'text-muted-foreground'}`} />
            <div className="text-center">
              <p className="font-semibold text-sm">Boiler</p>
              <p className="text-xs text-muted-foreground">Not tracked</p>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => handleSpecialSelect('NO_ACCESS')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
              ${specialSelection === 'NO_ACCESS'
                ? "border-red-500 bg-red-500/10"
                : "border-muted hover:border-red-500/50 bg-background"
              }`}
          >
            <Ban className={`h-6 w-6 ${specialSelection === 'NO_ACCESS' ? 'text-red-600' : 'text-muted-foreground'}`} />
            <div className="text-center">
              <p className="font-semibold text-sm">No Access</p>
              <p className="text-xs text-muted-foreground">Can't inspect</p>
            </div>
          </button>
        </div>
      </div>

      {/* Special selection warning */}
      {specialSelection && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                {specialSelection === 'BOILER' ? (
                  <>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Boiler - Not Tracked</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This app tracks water heaters only. The inspection will be marked as "Boiler - Not Applicable".
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-red-800 dark:text-red-200">No Access</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The inspection will be marked as "No Access - Could Not Inspect".
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button 
        onClick={handleContinue} 
        className="w-full h-12 font-semibold"
        disabled={!selectedType && !specialSelection}
        variant={specialSelection ? 'outline' : 'default'}
      >
        {specialSelection ? 'Mark & Exit' : 'Continue'}
      </Button>
    </div>
  );
}
