import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Package, 
  Settings, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import type { SoftenerInspection, SaltStatusType } from '@/types/technicianInspection';
import type { SoftenerQualityTier, ControlHead, VisualHeight } from '@/lib/softenerAlgorithm';
import { useSoftenerPlateScan } from '@/hooks/useSoftenerPlateScan';
import { ScanHeroCard, ScanHeroSection } from '@/components/ui/ScanHeroCard';
import { StatusToggleRow } from '@/components/ui/StatusToggleRow';

const QUALITY_TIERS: { value: SoftenerQualityTier; label: string }[] = [
  { value: 'CABINET', label: 'Cabinet' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'PREMIUM', label: 'Premium' },
];

const VISUAL_HEIGHTS: { value: VisualHeight; label: string; capacity: string }[] = [
  { value: 'KNEE', label: 'Knee', capacity: '~24k' },
  { value: 'WAIST', label: 'Waist', capacity: '~32k' },
  { value: 'CHEST', label: 'Chest', capacity: '~48k' },
];

interface SoftenerCheckStepProps {
  data: SoftenerInspection;
  onUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

export function SoftenerCheckStep({ data, onUpdate, onNext }: SoftenerCheckStepProps) {
  const { scanSoftenerPlate, isScanning, result } = useSoftenerPlateScan();
  
  const handleScanImage = async (file: File) => {
    const scanResult = await scanSoftenerPlate(file);
    if (scanResult) {
      const updates: Partial<SoftenerInspection> = { hasSoftener: true };
      
      if (scanResult.qualityTier) updates.qualityTier = scanResult.qualityTier;
      if (scanResult.controlHead) updates.controlHead = scanResult.controlHead;
      
      if (scanResult.capacityGrains) {
        if (scanResult.capacityGrains <= 28000) updates.visualHeight = 'KNEE';
        else if (scanResult.capacityGrains <= 40000) updates.visualHeight = 'WAIST';
        else updates.visualHeight = 'CHEST';
      }
      
      onUpdate(updates);
    }
  };

  const scanSummary = result && result.confidence > 0 && (
    <div className="space-y-1 text-sm">
      {result.brand && <p className="font-medium">{result.brand}</p>}
      {result.capacityGrains && (
        <p className="text-muted-foreground">{result.capacityGrains.toLocaleString()} grains</p>
      )}
      {result.estimatedAge && (
        <p className="text-muted-foreground">~{result.estimatedAge} years old</p>
      )}
    </div>
  );
  
  // Track if user has made an explicit choice
  const hasAnswered = data.hasSoftener !== undefined;
  
  return (
    <div className="space-y-5">
      {/* Primary Yes/No Selection - Required */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Is there a water softener? (Required)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate({ hasSoftener: true })}
            className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all
              ${data.hasSoftener === true
                ? "border-primary bg-primary/10"
                : "border-muted hover:border-primary/50 bg-background"
              }`}
          >
            <CheckCircle className={`h-8 w-8 ${data.hasSoftener === true ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="font-semibold">Yes</span>
            <span className="text-xs text-muted-foreground">Softener present</span>
          </button>
          
          <button
            type="button"
            onClick={() => onUpdate({ hasSoftener: false })}
            className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all
              ${data.hasSoftener === false
                ? "border-destructive bg-destructive/10"
                : "border-muted hover:border-primary/50 bg-background"
              }`}
          >
            <XCircle className={`h-8 w-8 ${data.hasSoftener === false ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="font-semibold">No</span>
            <span className="text-xs text-muted-foreground">No softener</span>
          </button>
        </div>
      </div>
      
      {/* Softener Details */}
      {data.hasSoftener && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* AI Scan */}
          <ScanHeroCard
            title={result?.brand || 'Water Softener'}
            subtitle="Photo the label/control head"
            isScanning={isScanning}
            hasScanned={!!result}
            scanSummary={scanSummary}
            onScanImage={handleScanImage}
            scanLabel="📷 Scan Label"
          >
            {/* Manual Entry */}
            <div className="space-y-4">
              {/* Salt Status - Quick */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Salt Status
                </Label>
                <div className="flex gap-2">
                  {([
                    { value: 'OK' as SaltStatusType, label: 'OK', icon: <CheckCircle className="h-4 w-4" />, color: 'green' },
                    { value: 'EMPTY' as SaltStatusType, label: 'Empty', icon: <XCircle className="h-4 w-4" />, color: 'red' },
                    { value: 'UNKNOWN' as SaltStatusType, label: "Can't Check", icon: <AlertCircle className="h-4 w-4" />, color: 'gray' },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onUpdate({ saltStatus: opt.value })}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border-2 transition-all
                        ${data.saltStatus === opt.value
                          ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                          : opt.color === 'red' ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-400 bg-gray-50 text-gray-600'
                          : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      {opt.icon}
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Tier */}
              <div className="space-y-2">
                <Label className="text-sm">Quality Tier</Label>
                <div className="flex gap-2">
                  {QUALITY_TIERS.map((tier) => (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => onUpdate({ qualityTier: tier.value })}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all
                        ${data.qualityTier === tier.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tank Height */}
              <div className="space-y-2">
                <Label className="text-sm">Tank Height (Capacity)</Label>
                <div className="flex gap-2">
                  {VISUAL_HEIGHTS.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      onClick={() => onUpdate({ visualHeight: h.value })}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all
                        ${data.visualHeight === h.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      <div className="font-medium">{h.label}</div>
                      <div className="text-[10px] opacity-70">{h.capacity}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Control Head */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Control Type
                </Label>
                <div className="flex gap-2">
                  {([
                    { value: 'DIGITAL' as ControlHead, label: 'Digital' },
                    { value: 'ANALOG' as ControlHead, label: 'Analog' },
                  ]).map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => onUpdate({ controlHead: c.value })}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                        ${data.controlHead === c.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted hover:border-primary/50'
                        }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScanHeroCard>

          {/* Additional Flags - Collapsed */}
          <ScanHeroSection title="Additional Observations" defaultOpen={false}>
            <div className="space-y-2">
              <StatusToggleRow
                label="Iron staining visible?"
                value={data.visualIron ? 'poor' : 'good'}
                onChange={(v) => onUpdate({ visualIron: v !== 'good' })}
                options={[
                  { value: 'good', label: 'No', color: 'green', icon: <span className="text-xs">✓</span> },
                  { value: 'poor', label: 'Yes', color: 'yellow', icon: <span className="text-xs">!</span> },
                ]}
              />
              <StatusToggleRow
                label="Has carbon pre-filter?"
                value={data.hasCarbonFilter ? 'good' : 'unknown'}
                onChange={(v) => onUpdate({ hasCarbonFilter: v === 'good' })}
                options={[
                  { value: 'good', label: 'Yes', color: 'green', icon: <span className="text-xs">✓</span> },
                  { value: 'unknown', label: 'No', color: 'gray', icon: <span className="text-xs">—</span> },
                ]}
              />
            </div>
          </ScanHeroSection>
        </div>
      )}
      
      <Button 
        onClick={onNext} 
        className="w-full h-12 font-semibold"
        disabled={data.hasSoftener === undefined}
      >
        Continue
      </Button>
    </div>
  );
}
