import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Edit2, Camera, Flame, Zap, AlertCircle, Scan } from 'lucide-react';
import type { AssetIdentification } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { decodeSerialNumber, getAgeDisplayString } from '@/lib/serialDecoder';
import { useDataPlateScan, type ScannedDataPlate } from '@/hooks/useDataPlateScan';
import { cn } from '@/lib/utils';
import { TechnicianStepLayout, StepCard, ChipOption } from './TechnicianStepLayout';
import { Button } from '@/components/ui/button';

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

const CAPACITY_CHIPS = [
  { value: 40, label: '40 gal' },
  { value: 50, label: '50 gal' },
  { value: 75, label: '75 gal' },
];

const FLOW_RATE_CHIPS = [
  { value: 5.0, label: '5 GPM' },
  { value: 8.0, label: '8 GPM' },
  { value: 10.0, label: '10+ GPM' },
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

function getFuelTypeLabel(fuelType: FuelType): string {
  const labels: Record<FuelType, string> = {
    'GAS': 'Gas Tank',
    'ELECTRIC': 'Electric Tank',
    'HYBRID': 'Hybrid Heat Pump',
    'TANKLESS_GAS': 'Tankless Gas',
    'TANKLESS_ELECTRIC': 'Tankless Electric',
  };
  return labels[fuelType] || fuelType;
}

interface AssetScanStepProps {
  data: AssetIdentification;
  onUpdate: (data: Partial<AssetIdentification>) => void;
  onAgeDetected: (age: number) => void;
  onAIDetection?: (fields: Record<string, boolean>) => void;
  onNext: () => void;
}

export function AssetScanStep({ data, onUpdate, onAgeDetected, onAIDetection, onNext }: AssetScanStepProps) {
  const [decodedAge, setDecodedAge] = useState<ReturnType<typeof decodeSerialNumber> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScannedDataPlate | null>(null);
  const { isScanning, scanImage } = useDataPlateScan();
  
  const isTankless = data.fuelType === 'TANKLESS_GAS' || data.fuelType === 'TANKLESS_ELECTRIC';
  const isGasUnit = data.fuelType === 'GAS' || data.fuelType === 'TANKLESS_GAS';
  const hasScanned = !!lastScanResult;
  
  const handleScanImage = async (file: File) => {
    const result = await scanImage(file);
    
    if (result) {
      setLastScanResult(result);
      const updates: Partial<AssetIdentification> = {};
      const aiFields: Record<string, boolean> = {};
      
      if (result.brand) {
        updates.brand = normalizeBrand(result.brand);
        aiFields.brand = true;
      }
      if (result.model) {
        updates.model = result.model;
        aiFields.model = true;
      }
      if (result.serialNumber) {
        updates.serialNumber = result.serialNumber;
        aiFields.serialNumber = true;
      }
      if (result.fuelType) {
        aiFields.fuelType = true;
      }
      if (result.capacity) {
        updates.tankCapacity = result.capacity;
        aiFields.tankCapacity = true;
      }
      if (result.flowRate) {
        updates.ratedFlowGPM = result.flowRate;
        aiFields.ratedFlowGPM = true;
      }
      if (result.warrantyYears) {
        updates.warrantyYears = result.warrantyYears;
        aiFields.warrantyYears = true;
      }
      
      onUpdate(updates);
      
      if (Object.keys(aiFields).length > 0) {
        onAIDetection?.(aiFields);
      }
      
      const fieldCount = Object.keys(updates).length;
      if (fieldCount < 3) {
        setIsEditing(true);
      }
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScanImage(file);
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

  const verificationItems = [
    { label: 'Brand', value: data.brand, detected: !!lastScanResult?.brand },
    { label: 'Model', value: data.model, detected: !!lastScanResult?.model },
    { label: 'Serial', value: data.serialNumber, detected: !!lastScanResult?.serialNumber },
    { label: 'Type', value: getFuelTypeLabel(data.fuelType), detected: !!lastScanResult?.fuelType, locked: true },
    ...(isTankless 
      ? [{ label: 'Flow', value: data.ratedFlowGPM ? `${data.ratedFlowGPM} GPM` : null, detected: !!lastScanResult?.flowRate }]
      : [{ label: 'Capacity', value: data.tankCapacity ? `${data.tankCapacity} gal` : null, detected: !!lastScanResult?.capacity }]
    ),
    ...(isGasUnit
      ? [{ label: 'BTU', value: lastScanResult?.btuRating ? `${(lastScanResult.btuRating / 1000).toFixed(0)}k BTU` : null, detected: !!lastScanResult?.btuRating }]
      : [{ label: 'Watts', value: lastScanResult?.wattage ? `${lastScanResult.wattage}W` : null, detected: !!lastScanResult?.wattage }]
    ),
    { label: 'Warranty', value: data.warrantyYears ? `${data.warrantyYears}yr` : null, detected: !!lastScanResult?.warrantyYears },
  ];

  const detectedCount = verificationItems.filter(item => item.value).length;
  const totalFields = verificationItems.length;
  
  return (
    <TechnicianStepLayout
      icon={<Scan className="h-8 w-8" />}
      title="Scan Data Plate"
      subtitle="Point camera at manufacturer label for instant ID"
      onContinue={onNext}
      continueDisabled={!canProceed}
    >
      {/* Scan Button */}
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
          disabled={isScanning}
        />
        <div className={cn(
          "w-full p-6 rounded-xl border-2 border-dashed transition-all text-center",
          isScanning 
            ? "border-primary bg-primary/5 animate-pulse"
            : hasScanned
            ? "border-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20"
            : "border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10"
        )}>
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              isScanning ? "bg-primary/20" : hasScanned ? "bg-green-500 text-white" : "bg-primary/20"
            )}>
              {isScanning ? (
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              ) : hasScanned ? (
                <CheckCircle2 className="h-8 w-8" />
              ) : (
                <Camera className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {isScanning ? 'Scanning...' : hasScanned ? 'Rescan Label' : 'Scan Data Plate'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isScanning ? 'AI extracting specifications' : 'Tap to use camera'}
              </p>
            </div>
          </div>
        </div>
      </label>

      {/* Verification Card */}
      {(hasScanned || isEditing || data.brand) && (
        <StepCard className="border-2">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Unit Details</span>
              {hasScanned && (
                <Badge variant="secondary" className="text-xs">
                  {detectedCount}/{totalFields} detected
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-primary"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {isEditing ? 'Done' : 'Edit'}
            </Button>
          </div>

          {/* Verification Grid */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {verificationItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.value ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={cn(
                      "text-sm font-medium truncate",
                      item.value ? "text-foreground" : "text-muted-foreground italic"
                    )}>
                      {item.value || '—'}
                    </p>
                  </div>
                  {item.detected && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto shrink-0">AI</Badge>
                  )}
                </div>
              ))}
              
              {decodedAge && decodedAge.confidence !== 'LOW' && (
                <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm font-medium">
                    {getAgeDisplayString(decodedAge)}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">Auto</Badge>
                </div>
              )}
            </div>
          )}

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-4 pt-2">
              {/* Brand Selection */}
              <div className="space-y-1.5">
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
              
              {/* Model & Serial */}
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

              {/* Unit Type Display */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Unit Type
                  <Badge variant="outline" className="text-[10px]">Locked</Badge>
                </Label>
                <div className="flex items-center gap-2 p-3 rounded-lg border-2 border-muted bg-muted/30">
                  {isGasUnit ? <Flame className="h-4 w-4 text-orange-500" /> : <Zap className="h-4 w-4 text-blue-500" />}
                  <span className="font-medium">{getFuelTypeLabel(data.fuelType)}</span>
                </div>
              </div>

              {/* Capacity / Flow Rate */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">{isTankless ? 'Flow Rate' : 'Capacity'}</Label>
                <div className="flex flex-wrap gap-2">
                  {(isTankless ? FLOW_RATE_CHIPS : CAPACITY_CHIPS).map((chip) => (
                    <ChipOption
                      key={chip.value}
                      label={chip.label}
                      selected={(isTankless ? data.ratedFlowGPM : data.tankCapacity) === chip.value}
                      onClick={() => onUpdate(isTankless ? { ratedFlowGPM: chip.value } : { tankCapacity: chip.value })}
                    />
                  ))}
                </div>
              </div>

              {/* Warranty */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Warranty</Label>
                <div className="flex flex-wrap gap-2">
                  {WARRANTY_CHIPS.map((chip) => (
                    <ChipOption
                      key={chip.value}
                      label={chip.label}
                      selected={data.warrantyYears === chip.value}
                      onClick={() => onUpdate({ warrantyYears: chip.value })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </StepCard>
      )}
    </TechnicianStepLayout>
  );
}
