import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useDataPlateScan } from '@/hooks/useDataPlateScan';
import { ScanHeroCard, ScanHeroSection } from '@/components/ui/ScanHeroCard';
import { QuickSelectChips } from '@/components/ui/QuickSelectChips';

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
  { value: 'ELECTRIC', label: 'Electric', icon: <Zap className="h-4 w-4" /> },
  { value: 'HYBRID', label: 'Hybrid', icon: <Droplets className="h-4 w-4" /> },
  { value: 'TANKLESS_GAS', label: 'Tankless Gas', icon: <Wind className="h-4 w-4" /> },
  { value: 'TANKLESS_ELECTRIC', label: 'Tankless Elec', icon: <Zap className="h-4 w-4" /> },
];

const VENT_TYPES: { value: VentType; label: string }[] = [
  { value: 'ATMOSPHERIC', label: 'Atmospheric' },
  { value: 'POWER_VENT', label: 'Power Vent' },
  { value: 'DIRECT_VENT', label: 'Direct Vent' },
];

const CAPACITY_CHIPS = [
  { value: 40, label: '40 gal', sublabel: 'Small' },
  { value: 50, label: '50 gal', sublabel: 'Standard' },
  { value: 75, label: '75 gal', sublabel: 'Large' },
];

const FLOW_RATE_CHIPS = [
  { value: 5.0, label: '5 GPM', sublabel: 'Low' },
  { value: 8.0, label: '8 GPM', sublabel: 'Standard' },
  { value: 10.0, label: '10+ GPM', sublabel: 'High' },
];

const WARRANTY_CHIPS = [
  { value: 6, label: '6yr' },
  { value: 9, label: '9yr' },
  { value: 12, label: '12yr' },
];

function normalizeBrand(brand: string | null): string {
  if (!brand) return '';
  const lower = brand.toLowerCase();
  
  for (const b of BRANDS) {
    if (lower.includes(b.toLowerCase()) || b.toLowerCase().includes(lower)) {
      return b;
    }
  }
  
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
  const { isScanning, scannedData, scanImage } = useDataPlateScan();
  
  const isTankless = data.fuelType === 'TANKLESS_GAS' || data.fuelType === 'TANKLESS_ELECTRIC';
  const isGasUnit = data.fuelType === 'GAS' || data.fuelType === 'TANKLESS_GAS';
  const hasScanned = !!scannedData;
  
  const handleScanImage = async (file: File) => {
    const result = await scanImage(file);
    
    if (result) {
      const updates: Partial<AssetIdentification> = {};
      
      if (result.brand) updates.brand = normalizeBrand(result.brand);
      if (result.model) updates.model = result.model;
      if (result.serialNumber) updates.serialNumber = result.serialNumber;
      if (result.fuelType) updates.fuelType = result.fuelType;
      if (result.capacity) updates.tankCapacity = result.capacity;
      if (result.flowRate) updates.ratedFlowGPM = result.flowRate;
      if (result.warrantyYears) updates.warrantyYears = result.warrantyYears;
      
      onUpdate(updates);
    }
  };
  
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

  const scanSummary = hasScanned && (
    <div className="space-y-1 text-sm">
      <p className="font-medium text-foreground">
        {data.brand} • {FUEL_TYPES.find(f => f.value === data.fuelType)?.label}
      </p>
      {data.model && <p className="text-muted-foreground">Model: {data.model}</p>}
      {!isTankless && data.tankCapacity && (
        <p className="text-muted-foreground">{data.tankCapacity} gallon</p>
      )}
      {isTankless && data.ratedFlowGPM && (
        <p className="text-muted-foreground">{data.ratedFlowGPM} GPM</p>
      )}
      {decodedAge?.ageYears !== undefined && (
        <p className="text-muted-foreground">~{decodedAge.ageYears} years old</p>
      )}
    </div>
  );
  
  return (
    <div className="space-y-5">
      <ScanHeroCard
        title={data.brand || 'Water Heater'}
        subtitle="Point at the manufacturer label"
        isScanning={isScanning}
        hasScanned={hasScanned}
        scanSummary={scanSummary}
        onScanImage={handleScanImage}
        scanLabel="📷 Scan Data Plate"
      >
        {/* Manual Entry Form */}
        <div className="space-y-4">
          {/* Brand Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Brand</Label>
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
          
          {/* Model & Serial - Compact Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Model #</Label>
              <Input
                value={data.model}
                onChange={(e) => onUpdate({ model: e.target.value.toUpperCase() })}
                placeholder="XG50T06..."
                className="font-mono text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm">Serial #</Label>
              <Input
                value={data.serialNumber}
                onChange={(e) => onUpdate({ serialNumber: e.target.value.toUpperCase() })}
                placeholder="1423A012..."
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          {/* Age Detection Result */}
          {decodedAge && decodedAge.confidence !== 'LOW' && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium">
                {getAgeDisplayString(decodedAge)}
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">Auto</Badge>
            </div>
          )}
          
          {/* Unit Type - Chip Style */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Unit Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {FUEL_TYPES.map((fuel) => (
                <button
                  key={fuel.value}
                  type="button"
                  onClick={() => onUpdate({ fuelType: fuel.value })}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${data.fuelType === fuel.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-muted/30 hover:border-primary/50"
                    }`}
                >
                  {fuel.icon}
                  <span className="text-xs">{fuel.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Capacity / Flow Rate */}
          <QuickSelectChips
            label={isTankless ? 'Flow Rate' : 'Capacity'}
            value={isTankless ? (data.ratedFlowGPM || null) : (data.tankCapacity || null)}
            onChange={(v) => onUpdate(isTankless ? { ratedFlowGPM: v } : { tankCapacity: v })}
            options={isTankless ? FLOW_RATE_CHIPS : CAPACITY_CHIPS}
            allowCustom
            customLabel="Other"
            customPlaceholder={isTankless ? "GPM" : "Gallons"}
          />

          {/* Warranty */}
          <QuickSelectChips
            label="Warranty"
            value={data.warrantyYears || null}
            onChange={(v) => onUpdate({ warrantyYears: v })}
            options={WARRANTY_CHIPS}
            allowCustom
            customLabel="Other"
            customPlaceholder="Years"
          />
          
          {/* Vent Type - Collapsible for Gas */}
          {isGasUnit && (
            <ScanHeroSection title="Vent Type" defaultOpen={!!data.ventType}>
              <div className="flex flex-wrap gap-2">
                {VENT_TYPES.map((vent) => (
                  <button
                    key={vent.value}
                    type="button"
                    onClick={() => onUpdate({ ventType: vent.value })}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium
                      ${data.ventType === vent.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-muted/30 hover:border-primary/50"
                      }`}
                  >
                    {vent.label}
                  </button>
                ))}
              </div>
            </ScanHeroSection>
          )}
        </div>
      </ScanHeroCard>
      
      <Button 
        onClick={onNext} 
        className="w-full h-12 text-base font-semibold"
        disabled={!canProceed}
      >
        Continue
      </Button>
    </div>
  );
}
