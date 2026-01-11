import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Building2, 
  Building,
  Warehouse
} from 'lucide-react';

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
    icon: <Home className="h-8 w-8" />,
  },
  { 
    value: 'multifamily', 
    label: 'Multi-Family Residential', 
    description: 'Apartment building, duplex, or multi-unit',
    icon: <Building className="h-8 w-8" />,
  },
  { 
    value: 'commercial', 
    label: 'Commercial', 
    description: 'Office, retail, restaurant, warehouse',
    icon: <Warehouse className="h-8 w-8" />,
  },
];

interface BuildingTypeStepProps {
  selectedType: BuildingType | null;
  onSelect: (type: BuildingType) => void;
  onNext: () => void;
}

export function BuildingTypeStep({ selectedType, onSelect, onNext }: BuildingTypeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">What type of building?</h2>
        <p className="text-sm text-muted-foreground">This helps us tailor the inspection process</p>
      </div>

      <div className="space-y-3">
        {BUILDING_TYPES.map((type) => {
          const isSelected = selectedType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onSelect(type.value)}
              className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left w-full
                ${isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted hover:border-primary/50 bg-background"
                }`}
            >
              <div className={`p-4 rounded-xl ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{type.label}</p>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              {isSelected && (
                <Badge className="bg-primary text-primary-foreground">Selected</Badge>
              )}
            </button>
          );
        })}
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
