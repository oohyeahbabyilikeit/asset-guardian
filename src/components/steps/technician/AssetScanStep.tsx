import React, { useState, useEffect, useRef } from 'react';
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
import { Flame, Zap, Droplets, Wind, CheckCircle2, Camera, Loader2, Sparkles } from 'lucide-react';
import type { AssetIdentification } from '@/types/technicianInspection';
import type { FuelType, VentType } from '@/lib/opterraAlgorithm';
import { decodeSerialNumber, getAgeDisplayString } from '@/lib/serialDecoder';
import { useDataPlateScan } from '@/hooks/useDataPlateScan';

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

// Map brand names from AI to our brand list
function normalizeBrand(brand: string | null): string {
  if (!brand) return '';
  const lower = brand.toLowerCase();
  
  // Check for exact or partial matches
  for (const b of BRANDS) {
    if (lower.includes(b.toLowerCase()) || b.toLowerCase().includes(lower)) {
      return b;
    }
  }
  
  // Common variations
  if (lower.includes('ao smith') || lower.includes('a. o. smith')) return 'A.O. Smith';
  if (lower.includes('bradford')) return 'Bradford White';
  
  return 'Other';
}

interface AssetScanStepProps {
  data: AssetIdentification;
  onUpdate: (data: Partial<AssetIdentification>) => void;
  onAgeDetected: (age: number) => void;
  onNext: () => void;
}

export function AssetScanStep({ data, onUpdate, onAgeDetected, onNext }: AssetScanStepProps) {
  const [decodedAge, setDecodedAge] = useState<ReturnType<typeof decodeSerialNumber> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isScanning, scannedData, scanImage } = useDataPlateScan();
  
  const isTankless = data.fuelType === 'TANKLESS_GAS' || data.fuelType === 'TANKLESS_ELECTRIC';
  const isGasUnit = data.fuelType === 'GAS' || data.fuelType === 'TANKLESS_GAS';
  
  // Handle file selection for scanning
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await scanImage(file);
    
    if (result) {
      // Apply scanned data to form
      const updates: Partial<AssetIdentification> = {};
      
      if (result.brand) {
        updates.brand = normalizeBrand(result.brand);
      }
      if (result.model) {
        updates.model = result.model;
      }
      if (result.serialNumber) {
        updates.serialNumber = result.serialNumber;
      }
      if (result.fuelType) {
        updates.fuelType = result.fuelType;
      }
      if (result.capacity) {
        updates.tankCapacity = result.capacity;
      }
      if (result.flowRate) {
        updates.ratedFlowGPM = result.flowRate;
      }
      if (result.warrantyYears) {
        updates.warrantyYears = result.warrantyYears;
      }
      
      onUpdate(updates);
    }
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };
  
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
      {/* AI Scan Data Plate Button */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full h-14 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Analyzing data plate...</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              <span className="font-medium">Scan Data Plate</span>
              <Sparkles className="h-4 w-4 ml-2 text-primary" />
            </>
          )}
        </Button>
        
        {scannedData && scannedData.confidence && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Badge 
              variant={scannedData.confidence === 'HIGH' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {scannedData.confidence === 'HIGH' ? '✓ High confidence' : 
               scannedData.confidence === 'MEDIUM' ? '~ Medium confidence' : 
               '? Low confidence'}
            </Badge>
            <span>Verify fields below</span>
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or enter manually</span>
        </div>
      </div>
      
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
