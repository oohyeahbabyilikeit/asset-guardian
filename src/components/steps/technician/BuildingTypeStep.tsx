import React from 'react';
import { Home, Building, Warehouse } from 'lucide-react';
import { TechnicianStepLayout, SelectionButton } from './TechnicianStepLayout';

export type BuildingType = 'residential' | 'multifamily' | 'commercial';

interface BuildingTypeOption {
  value: BuildingType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const BUILDING_TYPES: BuildingTypeOption[] = [
  { 
    value: 'residential', 
    label: 'Single-Family Residential', 
    description: 'House, townhome, or condo unit',
    icon: <Home className="h-6 w-6" />,
  },
  { 
    value: 'multifamily', 
    label: 'Multi-Family Residential', 
    description: 'Apartment building, duplex, or multi-unit',
    icon: <Building className="h-6 w-6" />,
  },
  { 
    value: 'commercial', 
    label: 'Commercial', 
    description: 'Office, retail, restaurant, warehouse',
    icon: <Warehouse className="h-6 w-6" />,
  },
];

interface BuildingTypeStepProps {
  selectedType: BuildingType | null;
  onSelect: (type: BuildingType) => void;
  onNext: () => void;
}

export function BuildingTypeStep({ selectedType, onSelect, onNext }: BuildingTypeStepProps) {
  return (
    <TechnicianStepLayout
      icon={<Home className="h-8 w-8" />}
      title="Building Type"
      subtitle="This helps us tailor the inspection process"
      onContinue={onNext}
      continueDisabled={!selectedType}
    >
      <div className="space-y-3">
        {BUILDING_TYPES.map((type) => (
          <SelectionButton
            key={type.value}
            icon={type.icon}
            label={type.label}
            description={type.description}
            selected={selectedType === type.value}
            onClick={() => onSelect(type.value)}
          />
        ))}
      </div>
    </TechnicianStepLayout>
  );
}
