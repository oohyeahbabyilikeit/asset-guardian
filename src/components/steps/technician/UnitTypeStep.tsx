import React, { useState } from 'react';
import { 
  Flame, 
  Zap, 
  Wind,
  Thermometer,
  Sparkles,
  Building2,
  Ban,
  AlertTriangle
} from 'lucide-react';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { 
  TechnicianStepLayout, 
  SelectionButton, 
  StepCard,
  SectionHeader 
} from './TechnicianStepLayout';
import { Button } from '@/components/ui/button';

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
    icon: <Flame className="h-5 w-5" />,
    category: 'tank'
  },
  { 
    value: 'ELECTRIC', 
    label: 'Electric Tank', 
    description: 'Traditional tank with heating elements',
    icon: <Zap className="h-5 w-5" />,
    category: 'tank'
  },
  { 
    value: 'TANKLESS_GAS', 
    label: 'Tankless Gas', 
    description: 'On-demand heating, no storage',
    icon: <Wind className="h-5 w-5" />,
    category: 'tankless'
  },
  { 
    value: 'TANKLESS_ELECTRIC', 
    label: 'Tankless Electric', 
    description: 'On-demand electric heating',
    icon: <Sparkles className="h-5 w-5" />,
    category: 'tankless'
  },
  { 
    value: 'HYBRID', 
    label: 'Heat Pump / Hybrid', 
    description: 'Heat pump with electric backup',
    icon: <Thermometer className="h-5 w-5" />,
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

  return (
    <TechnicianStepLayout
      icon={<Flame className="h-8 w-8" />}
      title="Water Heater Type"
      subtitle="This determines which inspection questions we'll ask"
      onContinue={handleContinue}
      continueDisabled={!selectedType && !specialSelection}
      continueText={specialSelection ? 'Mark & Exit' : 'Continue'}
    >
      {/* Tank Units */}
      <div className="space-y-2">
        <SectionHeader title="Tank Units" />
        <div className="space-y-2">
          {tankTypes.map((type) => (
            <SelectionButton
              key={type.value}
              icon={type.icon}
              label={type.label}
              description={type.description}
              selected={selectedType === type.value && !specialSelection}
              onClick={() => {
                setSpecialSelection(null);
                onSelect(type.value);
              }}
              size="compact"
            />
          ))}
        </div>
      </div>

      {/* Tankless Units */}
      <div className="space-y-2">
        <SectionHeader title="Tankless" />
        <div className="space-y-2">
          {tanklessTypes.map((type) => (
            <SelectionButton
              key={type.value}
              icon={type.icon}
              label={type.label}
              description={type.description}
              selected={selectedType === type.value && !specialSelection}
              onClick={() => {
                setSpecialSelection(null);
                onSelect(type.value);
              }}
              size="compact"
            />
          ))}
        </div>
      </div>

      {/* Hybrid Units */}
      <div className="space-y-2">
        <SectionHeader title="Heat Pump" />
        <div className="space-y-2">
          {hybridTypes.map((type) => (
            <SelectionButton
              key={type.value}
              icon={type.icon}
              label={type.label}
              description={type.description}
              selected={selectedType === type.value && !specialSelection}
              onClick={() => {
                setSpecialSelection(null);
                onSelect(type.value);
              }}
              size="compact"
            />
          ))}
        </div>
      </div>

      {/* Special Cases */}
      <div className="space-y-2">
        <SectionHeader title="Other" />
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSpecialSelect('BOILER')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
              ${specialSelection === 'BOILER'
                ? "border-amber-500 bg-amber-500/10"
                : "border-muted hover:border-amber-500/50 bg-card"
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
                ? "border-destructive bg-destructive/10"
                : "border-muted hover:border-destructive/50 bg-card"
              }`}
          >
            <Ban className={`h-6 w-6 ${specialSelection === 'NO_ACCESS' ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div className="text-center">
              <p className="font-semibold text-sm">No Access</p>
              <p className="text-xs text-muted-foreground">Can't inspect</p>
            </div>
          </button>
        </div>
      </div>

      {/* Special selection warning */}
      {specialSelection && (
        <StepCard className="border-amber-500/50 bg-amber-500/5">
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
                  <p className="font-medium text-destructive">No Access</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The inspection will be marked as "No Access - Could Not Inspect".
                  </p>
                </>
              )}
            </div>
          </div>
        </StepCard>
      )}
    </TechnicianStepLayout>
  );
}
