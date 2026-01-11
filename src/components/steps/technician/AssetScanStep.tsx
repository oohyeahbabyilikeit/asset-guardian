import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flame, Zap, Droplets, Wind, CheckCircle2 } from 'lucide-react';
import type { AssetIdentification } from '@/types/technicianInspection';
import type { FuelType, VentType } from '@/lib/opterraAlgorithm';
import { decodeSerialNumber, getAgeDisplayString } from '@/lib/serialDecoder';

const BRANDS = [
  'A.O. Smith',
  'Bradford White',
  'Rheem',
  'Rinnai',
  'Navien',
  'Takagi',
  'Noritz',
  'State',
  'Lochinvar',
  'American',
  'Whirlpool',
  'GE',
  'Kenmore',
  'Ruud',
  'Other',
] as const;

const FUEL_TYPES: { value: FuelType; label: string; icon: React.ReactNode }[] = [
  { value: 'GAS', label: 'Gas Tank', icon: <Flame className="h-4 w-4" /> },
  { value: 'ELECTRIC', label: 'Electric Tank', icon: <Zap className="h-4 w-4" /> },
  { value: 'HYBRID', label: 'Hybrid/Heat Pump', icon: <Droplets className="h-4 w-4" /> },
  { value: 'TANKLESS_GAS', label: 'Tankless Gas', icon: <Wind className="h-4 w-4" /> },
  { value: 'TANKLESS_ELECTRIC', label: 'Tankless Electric', icon: <Zap className="h-4 w-4" /> },
];

const VENT_TYPES: { value: VentType; label: string }[] = [
  { value: 'ATMOSPHERIC', label: 'Atmospheric (Open Draft)' },
  { value: 'POWER_VENT', label: 'Power Vent (Fan-Assisted)' },
  { value: 'DIRECT_VENT', label: 'Direct Vent (Sealed)' },
];

interface AssetScanStepProps {
  data: AssetIdentification;
  onUpdate: (data: Partial<AssetIdentification>) => void;
  onAgeDetected: (age: number) => void;
  onNext: () => void;
}

export function AssetScanStep({ data, onUpdate, onAgeDetected, onNext }: AssetScanStepProps) {
  const [decodedAge, setDecodedAge] = useState<ReturnType<typeof decodeSerialNumber> | null>(null);
  
  const isTankless = data.fuelType === 'TANKLESS_GAS' || data.fuelType === 'TANKLESS_ELECTRIC';
  const isGasUnit = data.fuelType === 'GAS' || data.fuelType === 'TANKLESS_GAS';
  
  // Decode serial number when brand or serial changes
  useEffect(() => {
    if (data.brand && data.serialNumber && data.serialNumber.length >= 4) {
      const decoded = decodeSerialNumber(data.brand, data.serialNumber);
      setDecodedAge(decoded);
      
      if (decoded.ageYears !== undefined) {
        onAgeDetected(decoded.ageYears);
      }
    } else {
      setDecodedAge(null);
    }
  }, [data.brand, data.serialNumber, onAgeDetected]);
  
  const canProceed = data.brand && data.fuelType;
  
  return (
    <div className="space-y-5">
      {/* Brand Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Brand / Manufacturer</Label>
        <Select
          value={data.brand}
          onValueChange={(value) => onUpdate({ brand: value })}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select brand..." />
          </SelectTrigger>
          <SelectContent>
            {BRANDS.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Model & Serial in a row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Model Number</Label>
          <Input
            value={data.model}
            onChange={(e) => onUpdate({ model: e.target.value.toUpperCase() })}
            placeholder="XG50T06EC36U1"
            className="font-mono h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Serial Number</Label>
          <Input
            value={data.serialNumber}
            onChange={(e) => onUpdate({ serialNumber: e.target.value.toUpperCase() })}
            placeholder="1423A012345"
            className="font-mono h-12"
          />
        </div>
      </div>
      
      {/* Age Detection Result */}
      {decodedAge && decodedAge.confidence !== 'LOW' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--status-optimal))]/10 border border-[hsl(var(--status-optimal))]/20">
          <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-optimal))]" />
          <span className="text-sm font-medium text-foreground">
            {getAgeDisplayString(decodedAge)}
          </span>
          <Badge variant="secondary" className="ml-auto text-xs">
            Auto-detected
          </Badge>
        </div>
      )}
      
      {/* Fuel Type */}
      <div className="space-y-2.5">
        <Label className="text-sm font-medium">Unit Type</Label>
        <RadioGroup
          value={data.fuelType}
          onValueChange={(value) => onUpdate({ fuelType: value as FuelType })}
          className="grid grid-cols-2 gap-2"
        >
          {FUEL_TYPES.map((type) => (
            <div key={type.value}>
              <RadioGroupItem
                value={type.value}
                id={type.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={type.value}
                className="flex items-center gap-2.5 rounded-xl border-2 border-border bg-card p-3.5 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
              >
                <div className="text-muted-foreground peer-data-[state=checked]:text-primary">
                  {type.icon}
                </div>
                <span className="text-sm font-medium">{type.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Capacity/Flow + Warranty Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Capacity (Tank) or Flow Rate (Tankless) */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <Label className="text-sm font-medium">{isTankless ? 'Flow Rate' : 'Capacity'}</Label>
            <span className="text-sm font-mono font-medium text-primary">
              {isTankless ? `${data.ratedFlowGPM || 8} GPM` : `${data.tankCapacity || 50} gal`}
            </span>
          </div>
          <Slider
            value={[isTankless ? (data.ratedFlowGPM || 8) : (data.tankCapacity || 50)]}
            onValueChange={([value]) => onUpdate(isTankless ? { ratedFlowGPM: value } : { tankCapacity: value })}
            min={isTankless ? 4 : 20}
            max={isTankless ? 12 : 100}
            step={isTankless ? 0.5 : 5}
            className="py-2"
          />
        </div>
        
        {/* Warranty */}
        <div className="space-y-2.5">
          <Label className="text-sm font-medium">Warranty</Label>
          <RadioGroup
            value={String(data.warrantyYears)}
            onValueChange={(value) => onUpdate({ warrantyYears: parseInt(value) })}
            className="flex gap-1.5"
          >
            {[6, 9, 12].map((years) => (
              <div key={years} className="flex-1">
                <RadioGroupItem
                  value={String(years)}
                  id={`warranty-${years}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`warranty-${years}`}
                  className="flex justify-center rounded-lg border-2 border-border bg-card py-2.5 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-sm font-medium transition-all"
                >
                  {years}yr
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
      
      {/* Vent Type (Gas Units Only) */}
      {isGasUnit && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vent Type</Label>
          <Select
            value={data.ventType}
            onValueChange={(value) => onUpdate({ ventType: value as VentType })}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select vent type..." />
            </SelectTrigger>
            <SelectContent>
              {VENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <Button 
        onClick={onNext} 
        className="w-full h-12 text-base font-semibold mt-4"
        disabled={!canProceed}
      >
        Continue
      </Button>
    </div>
  );
}
