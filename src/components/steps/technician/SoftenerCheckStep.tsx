import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Package, 
  Settings, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera,
  Loader2,
  Sparkles
} from 'lucide-react';
import type { SoftenerInspection, SaltStatusType } from '@/types/technicianInspection';
import type { SoftenerQualityTier, ControlHead, VisualHeight } from '@/lib/softenerAlgorithm';
import { useSoftenerPlateScan } from '@/hooks/useSoftenerPlateScan';

const SALT_STATUS_OPTIONS: { value: SaltStatusType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'OK', label: 'Salt OK', icon: <CheckCircle className="h-5 w-5" />, color: 'border-green-500 bg-green-50' },
  { value: 'EMPTY', label: 'Empty/Low', icon: <XCircle className="h-5 w-5" />, color: 'border-red-500 bg-red-50' },
  { value: 'UNKNOWN', label: "Can't Check", icon: <AlertCircle className="h-5 w-5" />, color: 'border-muted bg-muted/50' },
];

const QUALITY_TIERS: { value: SoftenerQualityTier; label: string; description: string }[] = [
  { value: 'CABINET', label: 'Cabinet', description: 'All-in-one compact unit' },
  { value: 'STANDARD', label: 'Standard', description: 'Separate brine & resin tanks' },
  { value: 'PREMIUM', label: 'Premium', description: 'High-capacity, smart controls' },
];

const CONTROL_HEADS: { value: ControlHead; label: string }[] = [
  { value: 'DIGITAL', label: 'Digital (Metered)' },
  { value: 'ANALOG', label: 'Analog (Timer)' },
];

const VISUAL_HEIGHTS: { value: VisualHeight; label: string; capacity: string }[] = [
  { value: 'KNEE', label: 'Knee Height', capacity: '~24k grains' },
  { value: 'WAIST', label: 'Waist Height', capacity: '~32k grains' },
  { value: 'CHEST', label: 'Chest Height', capacity: '~48k grains' },
];

interface SoftenerCheckStepProps {
  data: SoftenerInspection;
  onUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

export function SoftenerCheckStep({ data, onUpdate, onNext }: SoftenerCheckStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scanSoftenerPlate, isScanning, result } = useSoftenerPlateScan();
  
  const handleScanClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const scanResult = await scanSoftenerPlate(file);
    if (scanResult) {
      const updates: Partial<SoftenerInspection> = {
        hasSoftener: true,
      };
      
      if (scanResult.qualityTier) {
        updates.qualityTier = scanResult.qualityTier;
      }
      if (scanResult.controlHead) {
        updates.controlHead = scanResult.controlHead;
      }
      // Map capacity to visual height
      if (scanResult.capacityGrains) {
        if (scanResult.capacityGrains <= 28000) {
          updates.visualHeight = 'KNEE';
        } else if (scanResult.capacityGrains <= 40000) {
          updates.visualHeight = 'WAIST';
        } else {
          updates.visualHeight = 'CHEST';
        }
      }
      
      onUpdate(updates);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Water Softener Check</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Is there a water softener present?
        </p>
      </div>
      
      {/* Has Softener Toggle */}
      <div className="p-6 bg-muted/50 rounded-lg border-2 border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplets className="h-8 w-8 text-blue-500" />
            <div>
              <Label className="text-lg font-medium">Water Softener Present?</Label>
              <p className="text-sm text-muted-foreground">
                Look for a tall tank with a control head
              </p>
            </div>
          </div>
          <Switch
            checked={data.hasSoftener}
            onCheckedChange={(checked) => onUpdate({ hasSoftener: checked })}
          />
        </div>
      </div>
      
      {/* Softener Details (if present) */}
      {data.hasSoftener && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* AI Softener Plate Scanner */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-auto py-4 flex items-center gap-3 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
              onClick={handleScanClick}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div className="text-left">
                    <p className="font-medium">Scanning Label...</p>
                    <p className="text-xs text-muted-foreground">Reading brand, capacity, age</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Camera className="h-6 w-6 text-primary" />
                    <Sparkles className="h-3 w-3 text-amber-500 absolute -top-1 -right-1" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">📸 Scan Softener Label</p>
                    <p className="text-xs text-muted-foreground">AI reads brand, capacity & age</p>
                  </div>
                </>
              )}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {result && result.confidence > 0 && (
              <div className="p-3 bg-accent/50 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Detected Info
                  </span>
                  <Badge variant="outline" className={
                    result.confidence >= 80 ? 'text-green-600 border-green-600' :
                    result.confidence >= 60 ? 'text-yellow-600 border-yellow-600' :
                    'text-muted-foreground'
                  }>
                    {result.confidence}% confident
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {result.brand && (
                    <div className="p-2 rounded bg-muted">
                      <span className="text-xs text-muted-foreground">Brand</span>
                      <p className="font-medium">{result.brand}</p>
                    </div>
                  )}
                  {result.capacityGrains && (
                    <div className="p-2 rounded bg-muted">
                      <span className="text-xs text-muted-foreground">Capacity</span>
                      <p className="font-medium">{result.capacityGrains.toLocaleString()} grains</p>
                    </div>
                  )}
                  {result.estimatedAge && (
                    <div className="p-2 rounded bg-muted">
                      <span className="text-xs text-muted-foreground">Est. Age</span>
                      <p className="font-medium">~{result.estimatedAge} years</p>
                    </div>
                  )}
                  {result.controlHead && (
                    <div className="p-2 rounded bg-muted">
                      <span className="text-xs text-muted-foreground">Control</span>
                      <p className="font-medium">{result.controlHead}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">or enter manually</span>
              </div>
            </div>
          </div>
          
          {/* Quick Salt Status */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Salt Status (Quick Check)
            </Label>
            <RadioGroup
              value={data.saltStatus}
              onValueChange={(value) => onUpdate({ saltStatus: value as SaltStatusType })}
              className="grid grid-cols-3 gap-2"
            >
              {SALT_STATUS_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={`salt-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`salt-${option.value}`}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:${option.color}`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Quality Tier */}
          <div className="space-y-3">
            <Label>Unit Quality Tier</Label>
            <RadioGroup
              value={data.qualityTier}
              onValueChange={(value) => onUpdate({ qualityTier: value as SoftenerQualityTier })}
              className="grid grid-cols-3 gap-2"
            >
              {QUALITY_TIERS.map((tier) => (
                <div key={tier.value}>
                  <RadioGroupItem
                    value={tier.value}
                    id={`tier-${tier.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`tier-${tier.value}`}
                    className="flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                  >
                    <span className="font-medium">{tier.label}</span>
                    <span className="text-xs text-muted-foreground">{tier.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Control Head Type */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Control Head Type
            </Label>
            <RadioGroup
              value={data.controlHead}
              onValueChange={(value) => onUpdate({ controlHead: value as ControlHead })}
              className="grid grid-cols-2 gap-2"
            >
              {CONTROL_HEADS.map((head) => (
                <div key={head.value}>
                  <RadioGroupItem
                    value={head.value}
                    id={`head-${head.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`head-${head.value}`}
                    className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    {head.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Visual Height */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Tank Height (Capacity Proxy)
            </Label>
            <RadioGroup
              value={data.visualHeight}
              onValueChange={(value) => onUpdate({ visualHeight: value as VisualHeight })}
              className="grid grid-cols-3 gap-2"
            >
              {VISUAL_HEIGHTS.map((height) => (
                <div key={height.value}>
                  <RadioGroupItem
                    value={height.value}
                    id={`height-${height.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`height-${height.value}`}
                    className="flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
                  >
                    <span className="font-medium">{height.label}</span>
                    <span className="text-xs text-muted-foreground">{height.capacity}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Additional Flags */}
          <div className="space-y-3">
            <Label>Additional Observations</Label>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg border border-muted">
                <span className="text-sm">Iron staining visible?</span>
                <Switch
                  checked={data.visualIron ?? false}
                  onCheckedChange={(checked) => onUpdate({ visualIron: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-muted">
                <span className="text-sm">Has carbon pre-filter?</span>
                <Switch
                  checked={data.hasCarbonFilter ?? false}
                  onCheckedChange={(checked) => onUpdate({ hasCarbonFilter: checked })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Button onClick={onNext} className="w-full">
        {data.hasSoftener ? 'Continue' : 'Skip to Next'}
      </Button>
    </div>
  );
}
