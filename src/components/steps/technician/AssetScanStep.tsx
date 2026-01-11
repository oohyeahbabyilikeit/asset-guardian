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
import { Flame, Zap, Droplets, Wind, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { AssetIdentification, WATER_HEATER_BRANDS } from '@/types/technicianInspection';
import type { FuelType, VentType } from '@/lib/opterraAlgorithm';
import { decodeSerialNumber, getAgeDisplayString, getConfidenceColor } from '@/lib/serialDecoder';

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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Asset Identification</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Scan the unit's data plate for key information
        </p>
      </div>
      
      {/* Brand Selection */}
      <div className="space-y-2">
        <Label>Brand / Manufacturer</Label>
        <Select
          value={data.brand}
          onValueChange={(value) => onUpdate({ brand: value })}
        >
          <SelectTrigger>
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
      
      {/* Model Number */}
      <div className="space-y-2">
        <Label>Model Number (optional)</Label>
        <Input
          value={data.model}
          onChange={(e) => onUpdate({ model: e.target.value.toUpperCase() })}
          placeholder="e.g., XG50T06EC36U1"
          className="font-mono"
        />
      </div>
      
      {/* Serial Number */}
      <div className="space-y-2">
        <Label>Serial Number</Label>
        <Input
          value={data.serialNumber}
          onChange={(e) => onUpdate({ serialNumber: e.target.value.toUpperCase() })}
          placeholder="e.g., 1423A012345"
          className="font-mono"
        />
        
        {/* Age Detection Badge */}
        {decodedAge && (
          <div className="flex items-center gap-2 mt-2">
            {decodedAge.confidence !== 'LOW' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {getAgeDisplayString(decodedAge)}
                </span>
                <Badge variant="secondary" className={getConfidenceColor(decodedAge.confidence)}>
                  {decodedAge.confidence} confidence
                </Badge>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Could not decode age from serial
                </span>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Fuel Type */}
      <div className="space-y-3">
        <Label>Unit Type</Label>
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
                className="flex items-center gap-2 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
              >
                {type.icon}
                <span className="text-sm">{type.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Capacity (Tank) or Flow Rate (Tankless) */}
      {isTankless ? (
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Rated Flow (GPM)</Label>
            <span className="text-sm font-medium">{data.ratedFlowGPM || 8} GPM</span>
          </div>
          <Slider
            value={[data.ratedFlowGPM || 8]}
            onValueChange={([value]) => onUpdate({ ratedFlowGPM: value })}
            min={4}
            max={12}
            step={0.5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4 GPM</span>
            <span>12 GPM</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Tank Capacity</Label>
            <span className="text-sm font-medium">{data.tankCapacity || 50} Gallons</span>
          </div>
          <Slider
            value={[data.tankCapacity || 50]}
            onValueChange={([value]) => onUpdate({ tankCapacity: value })}
            min={20}
            max={100}
            step={5}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>20 gal</span>
            <span>100 gal</span>
          </div>
        </div>
      )}
      
      {/* Vent Type (Gas Units Only) */}
      {isGasUnit && (
        <div className="space-y-2">
          <Label>Vent Type</Label>
          <Select
            value={data.ventType}
            onValueChange={(value) => onUpdate({ ventType: value as VentType })}
          >
            <SelectTrigger>
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
      
      {/* Warranty Years */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Label>Warranty Period</Label>
          <span className="text-sm font-medium">{data.warrantyYears} Years</span>
        </div>
        <RadioGroup
          value={String(data.warrantyYears)}
          onValueChange={(value) => onUpdate({ warrantyYears: parseInt(value) })}
          className="flex gap-2"
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
                className="flex justify-center rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-sm"
              >
                {years} yr
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <Button 
        onClick={onNext} 
        className="w-full"
        disabled={!canProceed}
      >
        Continue to Measurements
      </Button>
    </div>
  );
}
