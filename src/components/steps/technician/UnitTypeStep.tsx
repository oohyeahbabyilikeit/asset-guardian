import React, { useState } from 'react';
import { 
  Flame, 
  Zap, 
  Thermometer,
  Building2,
  Ban,
  AlertTriangle
} from 'lucide-react';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { 
  TechnicianStepLayout, 
  SelectionButton, 
  StepCard 
} from './TechnicianStepLayout';

// Simplified unit types - fuel type determined by plate scan
type UnitCategory = 'TANK' | 'TANKLESS' | 'HYBRID' | 'BOILER' | 'NO_ACCESS';

interface UnitCategoryOption {
  value: UnitCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  isSpecial?: boolean;
}

const UNIT_CATEGORIES: UnitCategoryOption[] = [
  { 
    value: 'TANK', 
    label: 'Tank', 
    description: 'Traditional storage tank water heater',
    icon: <Flame className="h-5 w-5" />,
  },
  { 
    value: 'TANKLESS', 
    label: 'Tankless', 
    description: 'On-demand, no storage tank',
    icon: <Zap className="h-5 w-5" />,
  },
  { 
    value: 'HYBRID', 
    label: 'Hybrid / Heat Pump', 
    description: 'Heat pump with electric backup',
    icon: <Thermometer className="h-5 w-5" />,
  },
  { 
    value: 'BOILER', 
    label: 'Boiler', 
    description: 'Not tracked in this system',
    icon: <Building2 className="h-5 w-5" />,
    isSpecial: true,
  },
  { 
    value: 'NO_ACCESS', 
    label: 'No Access', 
    description: "Can't inspect the unit",
    icon: <Ban className="h-5 w-5" />,
    isSpecial: true,
  },
];

interface UnitTypeStepProps {
  selectedType: FuelType;
  onSelect: (type: FuelType) => void;
  onNext: () => void;
  onCannotInspect?: (reason: 'boiler' | 'no_access') => void;
}

export function UnitTypeStep({ selectedType, onSelect, onNext, onCannotInspect }: UnitTypeStepProps) {
  const [selectedCategory, setSelectedCategory] = useState<UnitCategory | null>(() => {
    // Map existing fuelType back to category for edit mode
    if (selectedType === 'HYBRID') return 'HYBRID';
    if (selectedType === 'TANKLESS_GAS' || selectedType === 'TANKLESS_ELECTRIC') return 'TANKLESS';
    if (selectedType === 'GAS' || selectedType === 'ELECTRIC') return 'TANK';
    return null;
  });

  const handleSelect = (category: UnitCategory) => {
    setSelectedCategory(category);
    
    // Map category to a default FuelType (will be refined by plate scan)
    // Using GAS as default for tank, TANKLESS_GAS for tankless
    if (category === 'TANK') {
      onSelect('GAS'); // Default, plate scan will determine actual fuel
    } else if (category === 'TANKLESS') {
      onSelect('TANKLESS_GAS'); // Default, plate scan will determine actual fuel
    } else if (category === 'HYBRID') {
      onSelect('HYBRID');
    }
  };

  const handleContinue = () => {
    if (selectedCategory === 'BOILER') {
      onCannotInspect?.('boiler');
    } else if (selectedCategory === 'NO_ACCESS') {
      onCannotInspect?.('no_access');
    } else {
      onNext();
    }
  };

  const isSpecialSelection = selectedCategory === 'BOILER' || selectedCategory === 'NO_ACCESS';

  return (
    <TechnicianStepLayout
      icon={<Flame className="h-8 w-8" />}
      title="Water Heater Type"
      subtitle="Fuel type will be determined by the data plate"
      onContinue={handleContinue}
      continueDisabled={!selectedCategory}
      continueText={isSpecialSelection ? 'Mark & Exit' : 'Continue'}
    >
      <div className="space-y-3">
        {UNIT_CATEGORIES.map((category) => (
          <SelectionButton
            key={category.value}
            icon={category.icon}
            label={category.label}
            description={category.description}
            selected={selectedCategory === category.value}
            onClick={() => handleSelect(category.value)}
            size="compact"
          />
        ))}
      </div>

      {/* Special selection warning */}
      {isSpecialSelection && (
        <StepCard className="border-amber-500/50 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {selectedCategory === 'BOILER' ? (
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
